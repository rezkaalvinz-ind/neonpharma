import { supabase } from './supabase'
import type {
  Address,
  AppNotification,
  Category,
  Order,
  OrderItem,
  OrderStatus,
  Prescription,
  Product,
  Role,
  User,
} from './types'

type Row = Record<string, any>

const client = () => {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  return supabase
}

const num = (value: unknown, fallback = 0) =>
  typeof value === 'number' ? value : Number(value ?? fallback)

const warn = (scope: string, error: unknown) => {
  // Kegagalan backend tidak boleh mematikan UI; dicatat untuk diagnosis.
  console.warn(`[supabase:${scope}]`, error)
}

/* ---------------------------------------------------------------- mappers */

export const mapProduct = (row: Row): Product => ({
  id: row.id,
  name: row.name,
  brand: row.brand,
  category: row.category_slug,
  price: num(row.price),
  originalPrice: row.original_price ?? undefined,
  stock: num(row.stock),
  requiresPrescription: Boolean(row.requires_prescription),
  description: row.description ?? '',
  ingredients: row.ingredients ?? undefined,
  usage: row.usage ?? undefined,
  storage: row.storage ?? undefined,
  warning: row.warning ?? undefined,
  emoji: row.emoji ?? '💊',
  tone: row.tone ?? 'bg-primary-soft',
  rating: num(row.rating, 4.5),
  reviews: num(row.reviews),
  sold: num(row.sold),
  createdAt: String(row.created_at ?? '').slice(0, 10),
  badges: row.badges ?? undefined,
})

const toProductRow = (p: Product) => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category_slug: p.category,
  price: p.price,
  original_price: p.originalPrice ?? null,
  stock: p.stock,
  requires_prescription: p.requiresPrescription,
  description: p.description,
  ingredients: p.ingredients ?? null,
  usage: p.usage ?? null,
  storage: p.storage ?? null,
  warning: p.warning ?? null,
  emoji: p.emoji,
  tone: p.tone,
  rating: p.rating,
  reviews: p.reviews,
  sold: p.sold,
  badges: p.badges ?? null,
})

const mapCategory = (row: Row): Category => ({
  slug: row.slug,
  name: row.name,
  short: row.short,
  emoji: row.emoji,
  tone: row.tone,
  blurb: row.blurb,
})

const mapAddress = (row: Row): Address => ({
  id: row.id,
  label: row.label,
  recipient: row.recipient,
  phone: row.phone,
  detail: row.detail,
  city: row.city,
  province: row.province,
  postal: row.postal,
  isDefault: Boolean(row.is_default),
})

const mapOrderItem = (row: Row): OrderItem => ({
  productId: row.product_id,
  name: row.name,
  brand: row.brand,
  price: num(row.price),
  qty: num(row.quantity),
  emoji: row.emoji ?? '💊',
  tone: row.tone ?? 'bg-primary-soft',
})

const mapOrder = (row: Row): Order => ({
  id: row.id,
  userId: row.user_id,
  customerName: row.customer_name,
  email: row.email,
  items: (row.order_items ?? []).map(mapOrderItem),
  subtotal: num(row.subtotal),
  shipping: num(row.shipping),
  discount: num(row.discount),
  total: num(row.total),
  status: row.status as OrderStatus,
  paymentMethod: row.payment_method,
  address: row.address as Address,
  prescriptionId: row.prescription_id ?? undefined,
  requiresPrescription: Boolean(row.requires_prescription),
  note: row.note ?? undefined,
  createdAt: row.created_at,
})

const mapPrescription = (row: Row): Prescription => ({
  id: row.id,
  userId: row.user_id,
  customerName: row.customer_name,
  fileName: row.file_path,
  doctorName: row.doctor_name ?? undefined,
  note: row.note ?? undefined,
  status: row.status,
  createdAt: row.created_at,
})

const mapNotification = (row: Row): AppNotification => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  body: row.body,
  read: Boolean(row.read),
  type: row.type,
  createdAt: row.created_at,
})

const toUser = (profile: Row, addresses: Address[]): User => ({
  id: profile.id,
  name: profile.full_name ?? profile.email?.split('@')[0] ?? 'Pelanggan',
  email: profile.email ?? '',
  password: '',
  role: (profile.role ?? 'customer') as Role,
  phone: profile.phone ?? undefined,
  addresses,
  createdAt: String(profile.created_at ?? new Date().toISOString()).slice(0, 10),
})

/* ------------------------------------------------------------------- auth */

export async function signIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; user?: User }> {
  try {
    const { data, error } = await client().auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: 'Email atau password salah.' }
    const user = await loadUser(data.user!.id)
    if (!user) return { ok: false, error: 'Profil pengguna tidak ditemukan.' }
    return { ok: true, user }
  } catch (error) {
    warn('signIn', error)
    return { ok: false, error: 'Tidak dapat menghubungi server. Coba lagi.' }
  }
}

export async function signUp(input: {
  name: string
  email: string
  password: string
}): Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }> {
  try {
    const { data, error } = await client().auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.name } },
    })
    if (error) return { ok: false, error: error.message }
    if (!data.session) return { ok: true, needsConfirmation: true }
    return { ok: true }
  } catch (error) {
    warn('signUp', error)
    return { ok: false, error: 'Tidak dapat mendaftar. Coba lagi.' }
  }
}

export async function signOut(): Promise<void> {
  try {
    await client().auth.signOut()
  } catch (error) {
    warn('signOut', error)
  }
}

export async function currentUser(): Promise<User | null> {
  try {
    const { data } = await client().auth.getSession()
    if (!data.session) return null
    return await loadUser(data.session.user.id)
  } catch (error) {
    warn('currentUser', error)
    return null
  }
}

async function loadUser(id: string): Promise<User | null> {
  const sb = client()
  let { data: profile, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    warn('loadUser.profile', error)
    return null
  }

  if (!profile) {
    const { data: authUser } = await sb.auth.getUser()
    const meta = authUser.user?.user_metadata ?? {}
    const inserted = await sb
      .from('profiles')
      .insert({
        id,
        full_name: meta.full_name ?? authUser.user?.email?.split('@')[0] ?? 'Pelanggan',
        email: authUser.user?.email ?? '',
      })
      .select('*')
      .maybeSingle()
    profile = inserted.data
  }

  if (!profile) return null
  const addresses = await fetchAddresses(id)
  return toUser(profile, addresses)
}

export async function fetchAllProfiles(): Promise<User[]> {
  try {
    const { data, error } = await client().from('profiles').select('*')
    if (error || !data) return []
    return data.map((row) => toUser(row, []))
  } catch (error) {
    warn('fetchAllProfiles', error)
    return []
  }
}

export async function updateProfileRemote(
  id: string,
  data: { name?: string; email?: string; phone?: string },
): Promise<void> {
  try {
    await client()
      .from('profiles')
      .update({
        ...(data.name !== undefined ? { full_name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      })
      .eq('id', id)
  } catch (error) {
    warn('updateProfile', error)
  }
}

/* ---------------------------------------------------------------- catalog */

export async function fetchCatalog(): Promise<{
  products: Product[]
  categories: Category[]
} | null> {
  try {
    const sb = client()
    const [productsRes, categoriesRes] = await Promise.all([
      sb.from('products').select('*').order('created_at', { ascending: false }),
      sb.from('categories').select('*').order('name'),
    ])
    if (productsRes.error || categoriesRes.error) {
      warn('fetchCatalog', productsRes.error ?? categoriesRes.error)
      return null
    }
    return {
      products: (productsRes.data ?? []).map(mapProduct),
      categories: (categoriesRes.data ?? []).map(mapCategory),
    }
  } catch (error) {
    warn('fetchCatalog', error)
    return null
  }
}

export async function upsertProductRemote(product: Product): Promise<void> {
  try {
    const { error } = await client()
      .from('products')
      .upsert(toProductRow(product), { onConflict: 'id' })
    if (error) warn('upsertProduct', error)
  } catch (error) {
    warn('upsertProduct', error)
  }
}

export async function deleteProductRemote(id: string): Promise<void> {
  try {
    await client().from('products').delete().eq('id', id)
  } catch (error) {
    warn('deleteProduct', error)
  }
}

export async function saveStockRemote(id: string, stock: number): Promise<void> {
  try {
    await client().from('products').update({ stock }).eq('id', id)
  } catch (error) {
    warn('saveStock', error)
  }
}

export async function upsertCategoryRemote(category: Category): Promise<void> {
  try {
    await client().from('categories').upsert(category, { onConflict: 'slug' })
  } catch (error) {
    warn('upsertCategory', error)
  }
}

export async function deleteCategoryRemote(slug: string): Promise<void> {
  try {
    await client().from('categories').delete().eq('slug', slug)
  } catch (error) {
    warn('deleteCategory', error)
  }
}

/* --------------------------------------------------------------- commerce */

export async function fetchOrders(): Promise<Order[]> {
  try {
    const { data, error } = await client()
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    if (error || !data) {
      if (error) warn('fetchOrders', error)
      return []
    }
    return data.map(mapOrder)
  } catch (error) {
    warn('fetchOrders', error)
    return []
  }
}

export async function createOrderRemote(order: Order): Promise<void> {
  try {
    const payload = {
      id: order.id,
      user_id: order.userId,
      customer_name: order.customerName,
      email: order.email,
      status: order.status,
      payment_method: order.paymentMethod,
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      address: order.address,
      prescription_id: order.prescriptionId ?? null,
      requires_prescription: order.requiresPrescription,
      note: order.note ?? null,
      created_at: order.createdAt,
    }
    const items = order.items.map((item) => ({
      product_id: item.productId,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: item.qty,
      emoji: item.emoji,
      tone: item.tone,
    }))
    const { error } = await client().rpc('place_order', {
      p_order: payload,
      p_items: items,
    })
    if (error) warn('createOrder', error)
  } catch (error) {
    warn('createOrder', error)
  }
}

export async function updateOrderStatusRemote(
  id: string,
  status: OrderStatus,
): Promise<void> {
  try {
    await client().from('orders').update({ status }).eq('id', id)
  } catch (error) {
    warn('updateOrderStatus', error)
  }
}

export async function cancelOrderRemote(id: string): Promise<void> {
  try {
    const { error } = await client().rpc('cancel_order', { p_order_id: id })
    if (error) warn('cancelOrder', error)
  } catch (error) {
    warn('cancelOrder', error)
  }
}

export async function fetchPrescriptions(): Promise<Prescription[]> {
  try {
    const { data, error } = await client()
      .from('prescriptions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error || !data) {
      if (error) warn('fetchPrescriptions', error)
      return []
    }
    return data.map(mapPrescription)
  } catch (error) {
    warn('fetchPrescriptions', error)
    return []
  }
}

export async function createPrescriptionRemote(
  prescription: Prescription,
  file?: File,
): Promise<string | null> {
  try {
    let filePath = prescription.fileName
    if (file) {
      const extension = file.name.split('.').pop() || 'jpg'
      const path = `${prescription.userId}/${prescription.id}-${Date.now()}.${extension}`
      const { error: uploadError } = await client()
        .storage.from('prescriptions')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (uploadError) warn('uploadPrescription', uploadError)
      else filePath = path
    }
    const { error } = await client().from('prescriptions').insert({
      id: prescription.id,
      user_id: prescription.userId,
      customer_name: prescription.customerName,
      file_path: filePath,
      doctor_name: prescription.doctorName ?? null,
      note: prescription.note ?? null,
      status: prescription.status,
      created_at: prescription.createdAt,
    })
    if (error) warn('createPrescription', error)
    return filePath
  } catch (error) {
    warn('createPrescription', error)
    return null
  }
}

export async function updatePrescriptionStatusRemote(
  id: string,
  status: Prescription['status'],
): Promise<void> {
  try {
    const sb = client()
    const { data: user } = await sb.auth.getUser()
    await sb
      .from('prescriptions')
      .update({ status, reviewed_by: user.user?.id ?? null })
      .eq('id', id)
    if (status === 'approved') {
      await sb
        .from('orders')
        .update({ status: 'processing' })
        .eq('prescription_id', id)
        .eq('status', 'pending')
    }
  } catch (error) {
    warn('updatePrescriptionStatus', error)
  }
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const { data, error } = await client()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error || !data) {
      if (error) warn('fetchNotifications', error)
      return []
    }
    return data.map(mapNotification)
  } catch (error) {
    warn('fetchNotifications', error)
    return []
  }
}

export async function createNotificationRemote(
  notification: AppNotification,
): Promise<void> {
  try {
    await client().from('notifications').insert({
      id: notification.id,
      user_id: notification.userId,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      read: notification.read,
      created_at: notification.createdAt,
    })
  } catch (error) {
    warn('createNotification', error)
  }
}

export async function markNotificationReadRemote(
  id: string,
  read: boolean,
): Promise<void> {
  try {
    await client().from('notifications').update({ read }).eq('id', id)
  } catch (error) {
    warn('markNotificationRead', error)
  }
}

export async function markAllNotificationsReadRemote(userId: string): Promise<void> {
  try {
    await client().from('notifications').update({ read: true }).eq('user_id', userId)
  } catch (error) {
    warn('markAllNotificationsRead', error)
  }
}

/* -------------------------------------------------------------- addresses */

export async function fetchAddresses(userId: string): Promise<Address[]> {
  try {
    const { data, error } = await client()
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    if (error || !data) return []
    return data.map(mapAddress)
  } catch (error) {
    warn('fetchAddresses', error)
    return []
  }
}

export async function createAddressRemote(
  id: string,
  userId: string,
  address: Address,
): Promise<void> {
  try {
    const sb = client()
    if (address.isDefault) {
      await sb.from('addresses').update({ is_default: false }).eq('user_id', userId)
    }
    await sb.from('addresses').insert({
      id,
      user_id: userId,
      label: address.label,
      recipient: address.recipient,
      phone: address.phone,
      detail: address.detail,
      city: address.city,
      province: address.province,
      postal: address.postal,
      is_default: Boolean(address.isDefault),
    })
  } catch (error) {
    warn('createAddress', error)
  }
}

export async function updateAddressRemote(
  id: string,
  userId: string,
  address: Address,
): Promise<void> {
  try {
    const sb = client()
    if (address.isDefault) {
      await sb.from('addresses').update({ is_default: false }).eq('user_id', userId)
    }
    await sb
      .from('addresses')
      .update({
        label: address.label,
        recipient: address.recipient,
        phone: address.phone,
        detail: address.detail,
        city: address.city,
        province: address.province,
        postal: address.postal,
        is_default: Boolean(address.isDefault),
      })
      .eq('id', id)
  } catch (error) {
    warn('updateAddress', error)
  }
}

export async function deleteAddressRemote(id: string): Promise<void> {
  try {
    await client().from('addresses').delete().eq('id', id)
  } catch (error) {
    warn('deleteAddress', error)
  }
}

export async function setDefaultAddressRemote(
  id: string,
  userId: string,
): Promise<void> {
  try {
    const sb = client()
    await sb.from('addresses').update({ is_default: false }).eq('user_id', userId)
    await sb.from('addresses').update({ is_default: true }).eq('id', id)
  } catch (error) {
    warn('setDefaultAddress', error)
  }
}

export async function placeOrderRpcFallback(order: Order): Promise<void> {
  await createOrderRemote(order)
}
