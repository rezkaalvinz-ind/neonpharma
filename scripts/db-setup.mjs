/**
 * Menjalankan supabase/schema.sql lalu supabase/seed.sql ke database Supabase.
 *
 * Jalankan:  SUPABASE_DB_PASSWORD="..." node scripts/db-setup.mjs
 *
 * Password TIDAK disimpan di file mana pun — hanya dibaca dari environment.
 * Koneksi memakai session pooler karena host db.<ref>.supabase.co
 * hanya punya AAAA record (tidak resolvable di jaringan IPv4-only).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const REF = 'xpmnuepaeqkorewovdwr'
const pw = process.env.SUPABASE_DB_PASSWORD
if (!pw) {
  console.error('SUPABASE_DB_PASSWORD belum diset.')
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const files = ['supabase/schema.sql', 'supabase/seed.sql']

// Region pooler project ini: ap-northeast-1 (ditemukan lewat scripts/db-find-region.mjs).
const candidates = [
  `postgresql://postgres.${REF}:${encodeURIComponent(pw)}@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${REF}:${encodeURIComponent(pw)}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
]

async function connect() {
  let lastErr
  for (const connectionString of candidates) {
    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
    try {
      await client.connect()
      const host = new URL(connectionString).host
      console.log(`terhubung → ${host}`)
      return client
    } catch (err) {
      lastErr = err
      console.log(`gagal ${new URL(connectionString).host}: ${err.message}`)
      try { await client.end() } catch {}
    }
  }
  throw lastErr
}

const client = await connect()
try {
  const who = await client.query('select current_user as u, current_database() as d')
  console.log(`user=${who.rows[0].u} db=${who.rows[0].d}`)

  for (const rel of files) {
    const sql = fs.readFileSync(path.join(root, rel), 'utf8')
    process.stdout.write(`menjalankan ${rel} (${(sql.length / 1024).toFixed(1)} kB) ... `)
    await client.query(sql)
    console.log('ok')
  }

  const stats = await client.query(`
    select 'categories' as t, count(*)::int as n from public.categories
    union all select 'products', count(*)::int from public.products
    union all select 'profiles', count(*)::int from public.profiles
    union all select 'orders', count(*)::int from public.orders
    union all select 'tables', count(*)::int from information_schema.tables where table_schema='public'
    union all select 'policies', count(*)::int from pg_policies where schemaname='public'
  `)
  console.table(stats.rows)
} finally {
  await client.end()
}
