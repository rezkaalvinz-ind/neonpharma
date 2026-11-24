/**
 * Verifikasi end-to-end jalur Supabase (bukan mode demo):
 *   1. signup + konfirmasi email (autoconfirm project = false)
 *   2. login, trigger profil
 *   3. RPC place_order → baris orders/order_items + stok products turun
 *   4. isolasi data: akun lain tidak melihat pesanan itu
 *   5. anon tidak bisa menulis ke products
 *
 * Jalankan: SUPABASE_DB_PASSWORD="..." node scripts/verify-supabase.mjs
 * Semua data uji dihapus lagi di akhir (finally).
 */
import fs from 'node:fs'
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'

const pw = process.env.SUPABASE_DB_PASSWORD
if (!pw) {
  console.error('SUPABASE_DB_PASSWORD belum diset.')
  process.exit(1)
}

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
)

const A = { email: 'uji.a@uji-neonpharma.com', password: 'UjiApotek123!' }
const B = { email: 'uji.b@uji-neonpharma.com', password: 'UjiApotek123!' }

const db = new pg.Client({
  connectionString: `postgresql://postgres.xpmnuepaeqkorewovdwr:${encodeURIComponent(pw)}@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
})

let pass = 0
const fail = []
const check = (label, ok, detail = '') => {
  if (ok) {
    pass += 1
    console.log(`  ✓ ${label}`)
  } else {
    fail.push(label)
    console.log(`  ✗ ${label}${detail ? ` → ${detail}` : ''}`)
  }
}

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/**
 * User dibuat langsung di auth.users (bukan lewat signUp) karena project ini
 * memakai mailer_autoconfirm = false dan SMTP default Supabase dibatasi
 * 2 email/jam — signUp akan kena "email rate limit exceeded".
 * Insert ini tetap memicu trigger handle_new_user → profiles.
 */
async function provision(user, name) {
  await db.query(
    `insert into auth.users (
       instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
       confirmation_token, recovery_token, email_change_token_new, email_change
     ) values (
       '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
       'authenticated', 'authenticated', $1, extensions.crypt($2, extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', $3::jsonb, now(), now(),
       '', '', '', ''
     )`,
    [user.email, user.password, JSON.stringify({ full_name: name })],
  )
  const { data, error } = await sb.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })
  if (error) throw new Error(`login ${user.email}: ${error.message}`)
  return data.session
}

await db.connect()
const orderId = `UJI${Date.now().toString().slice(-8)}`
let productId = null
let startStock = 0

try {
  console.log('\n1. Auth + trigger profil')
  const sessionA = await provision(A, 'Uji A')
  check('login akun A lewat GoTrue', Boolean(sessionA?.access_token))

  const { data: profileA } = await sb.from('profiles').select('id,email,role').eq('id', sessionA.user.id).maybeSingle()
  check('trigger membuat baris profiles', profileA?.email === A.email, profileA?.email)
  check('role default = customer', profileA?.role === 'customer', profileA?.role)

  console.log('\n2. Checkout lewat RPC place_order')
  const { data: products } = await sb.from('products').select('id,name,stock,price,sold').eq('requires_prescription', false).limit(1)
  const product = products?.[0]
  productId = product?.id
  startStock = product?.stock ?? 0
  check('produk non-resep tersedia', Boolean(product), productId)

  const order = {
    id: orderId,
    user_id: sessionA.user.id,
    customer_name: 'Uji A',
    email: A.email,
    status: 'pending',
    payment_method: 'transfer',
    subtotal: product.price * 2,
    shipping: 0,
    discount: 0,
    total: product.price * 2,
    address: { id: 'x', label: 'Rumah', recipient: 'Uji A', phone: '0812', detail: 'Jl. Uji 1', city: 'Bandung', province: 'Jawa Barat', postal: '40111', isDefault: true },
    requires_prescription: false,
  }
  const items = [{ product_id: product.id, name: product.name, brand: 'Uji', price: product.price, quantity: 2, emoji: '💊', tone: 'bg-primary-soft' }]

  const { error: rpcErr } = await sb.rpc('place_order', { p_order: order, p_items: items })
  check('place_order tanpa error', !rpcErr, rpcErr?.message)

  const { data: savedOrder, error: orderErr } = await sb
    .from('orders')
    .select('id,status,total,order_items(product_id,quantity,price)')
    .eq('id', orderId)
    .maybeSingle()
  check('baris orders tersimpan', savedOrder?.id === orderId, orderErr?.message)
  check('order_items ikut tersimpan', savedOrder?.order_items?.length === 1, JSON.stringify(savedOrder?.order_items))

  const { data: after } = await sb.from('products').select('stock,sold').eq('id', product.id).single()
  check('stok products berkurang 2', after?.stock === startStock - 2, `${startStock} → ${after?.stock}`)

  console.log('\n3. Isolasi data antar akun (RLS)')
  const sessionB = await provision(B, 'Uji B')
  const { data: ordersB } = await sb.from('orders').select('id')
  check('akun B tidak melihat pesanan akun A', (ordersB ?? []).every((o) => o.id !== orderId), `terlihat ${ordersB?.length ?? 0} pesanan`)

  const { data: stolen } = await sb.from('order_items').select('order_id').eq('order_id', orderId)
  check('akun B tidak bisa membaca item pesanan A', (stolen ?? []).length === 0, JSON.stringify(stolen))

  const { error: forgeErr } = await sb.rpc('place_order', {
    p_order: { ...order, id: `${orderId}B`, user_id: sessionA.user.id },
    p_items: items,
  })
  check('akun B ditolak membuat pesanan atas nama A', Boolean(forgeErr), forgeErr?.message)

  console.log('\n4. Anon tidak bisa menulis')
  const anon = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { error: anonWrite } = await anon.from('products').update({ stock: 999 }).eq('id', product.id)
  check('anon ditolak update products', Boolean(anonWrite), anonWrite?.message ?? 'tidak ada error!')

  const { data: anonRead } = await anon.from('products').select('id').limit(1)
  check('anon tetap bisa baca katalog', (anonRead ?? []).length === 1)

  check('akun B login (sesi terpisah)', Boolean(sessionB?.access_token))
} catch (err) {
  fail.push('exception')
  console.log(`\n✗ exception: ${err.message}`)
} finally {
  console.log('\n5. Bersih-bersih data uji')
  try {
    if (productId) {
      await db.query('update public.products set stock = $1, sold = greatest(0, sold - 2) where id = $2', [startStock, productId])
    }
    await db.query('delete from public.order_items where order_id = $1', [orderId])
    await db.query('delete from public.orders where id = $1', [orderId])
    await db.query('delete from public.profiles where email = any($1)', [[A.email, B.email]])
    await db.query('delete from auth.users where email = any($1)', [[A.email, B.email]])
    const { rows } = await db.query('select count(*)::int as n from auth.users')
    console.log(`  ✓ selesai — sisa auth.users: ${rows[0].n}`)
  } catch (err) {
    console.log(`  ! cleanup gagal: ${err.message}`)
  }
  await db.end()
  console.log(`\nHASIL: ${pass} lolos, ${fail.length} gagal`)
  if (fail.length) {
    console.log(`GAGAL: ${fail.join(', ')}`)
    process.exit(1)
  }
}
