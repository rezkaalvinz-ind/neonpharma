import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { categories as seedCategories, seedProducts, seedUsers } from './seed'
import { isSupabaseConfigured } from './supabase'
import * as remote from './supabaseApi'
import type {
  Address,
  AppNotification,
  CartLine,
  Category,
  Order,
  OrderItem,
  OrderStatus,
  Prescription,
  PrescriptionStatus,
  Product,
  Role,
  User,
} from './types'

let counter = 0
const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

export const makeOrderId = () =>
  `NP${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`

/* ------------------------------------------------------------------ AUTH */

interface AuthState {
  users: User[]
  userId: string | null
  hydrated: boolean
  hydrate: () => Promise<void>
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; role?: Role }>
  register: (data: {
    name: string
    email: string
    password: string
  }) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>
  logout: () => void
  updateProfile: (data: Partial<Pick<User, 'name' | 'phone' | 'email'>>) => void
  addAddress: (data: Omit<Address, 'id'>) => Address
  updateAddress: (id: string, data: Partial<Address>) => void
  removeAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      userId: null,
      hydrated: false,
      hydrate: async () => {
        if (!isSupabaseConfigured) {
          set({ hydrated: true })
          return
        }
        const user = await remote.currentUser()
        if (user) {
          const profiles =
            user.role === 'customer'
              ? get().users.filter((u) => u.id === user.id)
              : await remote.fetchAllProfiles()
          set({
            users: [...profiles.filter((u) => u.id !== user.id), user],
            userId: user.id,
          })
          await useCatalog.getState().hydrate()
          await useCommerce.getState().hydrate(user)
        } else {
          set({ userId: null })
          await useCatalog.getState().hydrate()
        }
        set({ hydrated: true })
      },
      login: async (email, password) => {
        if (isSupabaseConfigured) {
          const result = await remote.signIn(email, password)
          if (!result.ok || !result.user) return { ok: false, error: result.error }
          const user = result.user
          set({
            users: [...get().users.filter((u) => u.id !== user.id), user],
            userId: user.id,
          })
          await useCatalog.getState().hydrate()
          await useCommerce.getState().hydrate(user)
          return { ok: true, role: user.role }
        }
        const user = get().users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        )
        if (!user || user.password !== password)
          return { ok: false, error: 'Email atau password salah.' }
        set({ userId: user.id })
        return { ok: true, role: user.role }
      },
      register: async ({ name, email, password }) => {
        if (isSupabaseConfigured) {
          const result = await remote.signUp({ name, email, password })
          if (!result.ok) return { ok: false, error: result.error }
          if (result.needsConfirmation) return { ok: true, needsConfirmation: true }
          const signedIn = await remote.signIn(email, password)
          if (!signedIn.ok || !signedIn.user) return { ok: true, needsConfirmation: true }
          const user = signedIn.user
          set({
            users: [...get().users.filter((u) => u.id !== user.id), user],
            userId: user.id,
          })
          await useCatalog.getState().hydrate()
          await useCommerce.getState().hydrate(user)
          return { ok: true }
        }
        if (
          get().users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())
        )
          return { ok: false, error: 'Email sudah terdaftar. Silakan masuk.' }
        const user: User = {
          id: uid('u'),
          name,
          email: email.trim(),
          password,
          role: 'customer',
          addresses: [],
          createdAt: new Date().toISOString(),
        }
        set({ users: [...get().users, user], userId: user.id })
        useCommerce.getState().pushNotification({
          userId: user.id,
          title: 'Selamat datang di NEON PHARMA',
          body: 'Akunmu siap digunakan. Yuk lengkapi alamat pengiriman agar checkout lebih cepat.',
          type: 'system',
        })
        return { ok: true }
      },
      logout: () => {
        if (isSupabaseConfigured) void remote.signOut()
        set({ userId: null })
      },
      updateProfile: (data) => {
        const id = get().userId
        if (!id) return
        set({
          users: get().users.map((u) => (u.id === id ? { ...u, ...data } : u)),
        })
        if (isSupabaseConfigured) void remote.updateProfileRemote(id, data)
      },
      addAddress: (data) => {
        const userId = get().userId
        const id = isSupabaseConfigured ? crypto.randomUUID() : uid('addr')
        const current = get().users.find((u) => u.id === userId)
        const makeDefault = Boolean(data.isDefault) || (current?.addresses.length ?? 0) === 0
        const address: Address = { ...data, id, isDefault: makeDefault }
        if (!userId) return address
        set({
          users: get().users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  addresses: makeDefault
                    ? [...u.addresses.map((a) => ({ ...a, isDefault: false })), address]
                    : [...u.addresses, address],
                }
              : u,
          ),
        })
        if (isSupabaseConfigured) void remote.createAddressRemote(id, userId, address)
        return address
      },
      updateAddress: (id, data) => {
        const userId = get().userId
        if (!userId) return
        set({
          users: get().users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  addresses: u.addresses.map((a) =>
                    a.id === id
                      ? { ...a, ...data }
                      : data.isDefault
                        ? { ...a, isDefault: false }
                        : a,
                  ),
                }
              : u,
          ),
        })
        if (isSupabaseConfigured) {
          const updated = get()
            .users.find((u) => u.id === userId)
            ?.addresses.find((a) => a.id === id)
          if (updated) void remote.updateAddressRemote(id, userId, updated)
        }
      },
      removeAddress: (id) => {
        const userId = get().userId
        if (!userId) return
        set({
          users: get().users.map((u) =>
            u.id === userId
              ? { ...u, addresses: u.addresses.filter((a) => a.id !== id) }
              : u,
          ),
        })
        if (isSupabaseConfigured) void remote.deleteAddressRemote(id)
      },
      setDefaultAddress: (id) => {
        const userId = get().userId
        if (!userId) return
        set({
          users: get().users.map((u) =>
            u.id === userId
              ? { ...u, addresses: u.addresses.map((a) => ({ ...a, isDefault: a.id === id })) }
              : u,
          ),
        })
        if (isSupabaseConfigured) void remote.setDefaultAddressRemote(id, userId)
      },
    }),
    { name: 'neon-pharma-auth', version: 1 },
  ),
)

export { useSettings } from './settings'

export const useCurrentUser = () => {
  const users = useAuth((s) => s.users)
  const userId = useAuth((s) => s.userId)
  return users.find((u) => u.id === userId) ?? null
}

/* --------------------------------------------------------------- CATALOG */

interface CatalogState {
  products: Product[]
  categories: Category[]
  hydrate: () => Promise<void>
  upsertProduct: (product: Product) => void
  deleteProduct: (id: string) => void
  adjustStock: (id: string, delta: number) => void
  setStock: (id: string, value: number) => void
  upsertCategory: (category: Category) => void
  deleteCategory: (slug: string) => { ok: boolean; error?: string }
}

export const useCatalog = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      categories: seedCategories,
      hydrate: async () => {
        if (!isSupabaseConfigured) return
        const data = await remote.fetchCatalog()
        if (!data) return
        // Bila tabel masih kosong, biarkan seed lokal agar katalog tidak kosong.
        if (data.products.length > 0) {
          set({
            products: data.products,
            categories:
              data.categories.length > 0 ? data.categories : get().categories,
          })
        }
      },
      upsertProduct: (product) => {
        const exists = get().products.some((p) => p.id === product.id)
        set({
          products: exists
            ? get().products.map((p) => (p.id === product.id ? product : p))
            : [product, ...get().products],
        })
        if (isSupabaseConfigured) void remote.upsertProductRemote(product)
      },
      deleteProduct: (id) => {
        set({ products: get().products.filter((p) => p.id !== id) })
        if (isSupabaseConfigured) void remote.deleteProductRemote(id)
      },
      adjustStock: (id, delta) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
          ),
        })
        if (isSupabaseConfigured) {
          const product = get().products.find((p) => p.id === id)
          if (product) void remote.saveStockRemote(id, product.stock)
        }
      },
      setStock: (id, value) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, value) } : p,
          ),
        })
        if (isSupabaseConfigured) void remote.saveStockRemote(id, Math.max(0, value))
      },
      upsertCategory: (category) => {
        const exists = get().categories.some((c) => c.slug === category.slug)
        set({
          categories: exists
            ? get().categories.map((c) => (c.slug === category.slug ? category : c))
            : [...get().categories, category],
        })
        if (isSupabaseConfigured) void remote.upsertCategoryRemote(category)
      },
      deleteCategory: (slug) => {
        const used = get().products.some((p) => p.category === slug)
        if (used)
          return {
            ok: false,
            error: 'Kategori masih dipakai oleh produk. Pindahkan produk terlebih dahulu.',
          }
        set({ categories: get().categories.filter((c) => c.slug !== slug) })
        if (isSupabaseConfigured) void remote.deleteCategoryRemote(slug)
        return { ok: true }
      },
    }),
    { name: 'neon-pharma-catalog', version: 2 },
  ),
)

/* -------------------------------------------------------------- COMMERCE */

const seedOrderItems = (ids: Array<[string, number]>): OrderItem[] =>
  ids.map(([productId, qty]) => {
    const product = seedProducts.find((p) => p.id === productId)!
    return {
      productId,
      name: product.name,
      brand: product.brand,
      price: product.price,
      qty,
      emoji: product.emoji,
      tone: product.tone,
    }
  })

const sum = (items: OrderItem[]) => items.reduce((acc, i) => acc + i.price * i.qty, 0)

const demoAddress: Address = {
  id: 'addr-demo',
  label: 'Rumah',
  recipient: 'Sari Wulandari',
  phone: '0812-3456-7890',
  detail: 'Jl. Cihampelas No. 42, RT 03 / RW 05',
  city: 'Bandung',
  province: 'Jawa Barat',
  postal: '40131',
  isDefault: true,
}

const buildSeedOrder = (
  id: string,
  userId: string,
  customerName: string,
  email: string,
  items: Array<[string, number]>,
  status: OrderStatus,
  daysAgo: number,
  paymentMethod: Order['paymentMethod'] = 'transfer',
): Order => {
  const orderItems = seedOrderItems(items)
  const subtotal = sum(orderItems)
  const shipping = subtotal >= 150000 ? 0 : 15000
  return {
    id,
    userId,
    customerName,
    email,
    items: orderItems,
    subtotal,
    shipping,
    discount: 0,
    total: subtotal + shipping,
    status,
    paymentMethod,
    address: { ...demoAddress, recipient: customerName },
    requiresPrescription: false,
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  }
}

const seedOrders: Order[] = [
  buildSeedOrder('NP20265001', 'u-customer', 'Sari Wulandari', 'sari@example.com', [['sanmol-500', 2], ['redoxon-c', 1]], 'delivered', 26, 'ewallet'),
  buildSeedOrder('NP20265002', 'u-customer', 'Sari Wulandari', 'sari@example.com', [['cetaphil-cleanser', 1], ['wardah-uv-shield', 2]], 'delivered', 18),
  buildSeedOrder('NP20265003', 'u-customer', 'Sari Wulandari', 'sari@example.com', [['amoxicillin-500', 1]], 'processing', 5),
  buildSeedOrder('NP20265004', 'u-customer', 'Sari Wulandari', 'sari@example.com', [['omron-thermo', 1], ['masker-medis-50', 2]], 'shipped', 3, 'cod'),
  buildSeedOrder('NP20265005', 'u-guest-1', 'Dimas Prakoso', 'dimas@example.com', [['blackmores-d3', 1], ['sangobion', 1]], 'delivered', 12),
  buildSeedOrder('NP20265006', 'u-guest-2', 'Ayu Lestari', 'ayu@example.com', [['pampers-m', 2], ['cussons-baby-powder', 1]], 'pending', 1),
  buildSeedOrder('NP20265007', 'u-guest-3', 'Rudi Hartono', 'rudi@example.com', [['omron-tensimeter', 1]], 'delivered', 21),
  buildSeedOrder('NP20265008', 'u-guest-2', 'Ayu Lestari', 'ayu@example.com', [['sensodyne-100', 1], ['listerine-250', 1], ['dettol-250', 2]], 'processing', 2),
]

const seedPrescriptions: Prescription[] = [
  {
    id: 'RX-2401',
    userId: 'u-customer',
    customerName: 'Sari Wulandari',
    fileName: 'resep-amoxicillin.jpg',
    doctorName: 'dr. Prita Ayu',
    note: 'Resep untuk infeksi tenggorokan, 5 hari.',
    status: 'approved',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'RX-2402',
    userId: 'u-guest-2',
    customerName: 'Ayu Lestari',
    fileName: 'resep-omeprazole.pdf',
    doctorName: 'dr. Hendra Wijaya',
    note: 'Keluhan lambung, kontrol 2 minggu.',
    status: 'pending',
    createdAt: new Date(Date.now() - 4000000).toISOString(),
  },
]

const seedNotifications: AppNotification[] = [
  {
    id: 'n1',
    userId: 'u-customer',
    title: 'Pesanan NP20265004 sedang dikirim',
    body: 'Kurir sedang menuju alamatmu. Estimasi tiba hari ini sebelum pukul 18.00.',
    read: false,
    type: 'order',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'n2',
    userId: 'u-customer',
    title: 'Resep kamu telah diverifikasi',
    body: 'Apoteker menyetujui resep RX-2401. Pesanan dapat diproses.',
    read: true,
    type: 'prescription',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'n3',
    userId: 'u-customer',
    title: 'Diskon 10% untuk kebutuhan harianmu',
    body: 'Gunakan kode NEON10 pada checkout dengan minimum belanja Rp50.000.',
    read: false,
    type: 'promo',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
]

export interface PlaceOrderInput {
  userId: string
  customerName: string
  email: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  paymentMethod: Order['paymentMethod']
  address: Address
  prescriptionId?: string
  requiresPrescription: boolean
  note?: string
}

interface CommerceState {
  cart: CartLine[]
  wishlist: string[]
  orders: Order[]
  prescriptions: Prescription[]
  notifications: AppNotification[]
  recentSearches: string[]
  hydrate: (user: User) => Promise<void>
  addToCart: (productId: string, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  toggleWishlist: (productId: string) => void
  addRecentSearch: (term: string) => void
  clearRecentSearches: () => void
  placeOrder: (input: PlaceOrderInput) => Order
  cancelOrder: (orderId: string) => void
  setOrderStatus: (orderId: string, status: OrderStatus) => void
  addPrescription: (
    data: Omit<Prescription, 'id' | 'status' | 'createdAt'> & { file?: File },
  ) => Prescription
  setPrescriptionStatus: (id: string, status: PrescriptionStatus) => void
  pushNotification: (data: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (userId: string) => void
  resetDemoData: () => void
}

export const useCommerce = create<CommerceState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      orders: seedOrders,
      prescriptions: seedPrescriptions,
      notifications: seedNotifications,
      recentSearches: [],
      hydrate: async (user) => {
        if (!isSupabaseConfigured) return
        const [orders, prescriptions, notifications] = await Promise.all([
          remote.fetchOrders(),
          remote.fetchPrescriptions(),
          remote.fetchNotifications(user.id),
        ])
        set({
          orders,
          prescriptions:
            user.role === 'customer'
              ? prescriptions.filter((p) => p.userId === user.id)
              : prescriptions,
          notifications,
        })
      },
      addToCart: (productId, qty = 1) => {
        const product = useCatalog.getState().products.find((p) => p.id === productId)
        if (!product || product.stock === 0) return
        const existing = get().cart.find((l) => l.productId === productId)
        const nextQty = Math.min(product.stock, (existing?.qty ?? 0) + qty)
        set({
          cart: existing
            ? get().cart.map((l) => (l.productId === productId ? { ...l, qty: nextQty } : l))
            : [...get().cart, { productId, qty: nextQty }],
        })
      },
      setQty: (productId, qty) => {
        const product = useCatalog.getState().products.find((p) => p.id === productId)
        const safeQty = Math.max(1, Math.min(qty, product?.stock ?? 99))
        set({
          cart: get().cart.map((l) =>
            l.productId === productId ? { ...l, qty: safeQty } : l,
          ),
        })
      },
      removeFromCart: (productId) =>
        set({ cart: get().cart.filter((l) => l.productId !== productId) }),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (productId) =>
        set({
          wishlist: get().wishlist.includes(productId)
            ? get().wishlist.filter((id) => id !== productId)
            : [...get().wishlist, productId],
        }),
      addRecentSearch: (term) => {
        const clean = term.trim()
        if (clean.length < 2) return
        set({
          recentSearches: [clean, ...get().recentSearches.filter((t) => t !== clean)].slice(0, 6),
        })
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
      placeOrder: (input) => {
        const order: Order = {
          ...input,
          id: makeOrderId(),
          status: input.requiresPrescription ? 'pending' : 'pending',
          createdAt: new Date().toISOString(),
        }
        input.items.forEach((item) =>
          useCatalog.getState().adjustStock(item.productId, -item.qty),
        )
        set({ orders: [order, ...get().orders] })
        if (isSupabaseConfigured) void remote.createOrderRemote(order)
        get().pushNotification({
          userId: input.userId,
          title: `Pesanan ${order.id} berhasil dibuat`,
          body: input.requiresPrescription
            ? 'Pesanan menunggu verifikasi resep oleh apoteker sebelum diproses.'
            : 'Kami sedang mengonfirmasi pembayaran dan menyiapkan pesananmu.',
          type: 'order',
        })
        return order
      },
      cancelOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order || order.status === 'delivered' || order.status === 'cancelled') return
        order.items.forEach((item) =>
          useCatalog.getState().adjustStock(item.productId, item.qty),
        )
        set({
          orders: get().orders.map((o) =>
            o.id === orderId ? { ...o, status: 'cancelled' } : o,
          ),
        })
        if (isSupabaseConfigured) void remote.cancelOrderRemote(orderId)
        get().pushNotification({
          userId: order.userId,
          title: `Pesanan ${order.id} dibatalkan`,
          body: 'Stok produk telah dikembalikan. Dana akan diproses sesuai metode pembayaran.',
          type: 'order',
        })
      },
      setOrderStatus: (orderId, status) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return
        set({
          orders: get().orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })
        if (isSupabaseConfigured) void remote.updateOrderStatusRemote(orderId, status)
        get().pushNotification({
          userId: order.userId,
          title: `Status pesanan ${order.id} diperbarui`,
          body: `Pesananmu sekarang berstatus: ${status}.`,
          type: 'order',
        })
      },
      addPrescription: ({ file, ...data }) => {
        const prescription: Prescription = {
          ...data,
          id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
        set({ prescriptions: [prescription, ...get().prescriptions] })
        if (isSupabaseConfigured)
          void remote.createPrescriptionRemote(prescription, file)
        return prescription
      },
      setPrescriptionStatus: (id, status) => {
        const rx = get().prescriptions.find((r) => r.id === id)
        set({
          prescriptions: get().prescriptions.map((r) =>
            r.id === id ? { ...r, status } : r,
          ),
        })
        if (!rx) return
        get().pushNotification({
          userId: rx.userId,
          title:
            status === 'approved'
              ? `Resep ${rx.id} disetujui`
              : status === 'rejected'
                ? `Resep ${rx.id} ditolak`
                : `Resep ${rx.id} ditinjau ulang`,
          body:
            status === 'approved'
              ? 'Apoteker telah memverifikasi resepmu. Pesanan terkait akan segera diproses.'
              : status === 'rejected'
                ? 'Resep tidak dapat diproses. Silakan hubungi apoteker melalui halaman Kontak.'
                : 'Apoteker sedang meninjau ulang resepmu.',
          type: 'prescription',
        })
        if (isSupabaseConfigured)
          void remote.updatePrescriptionStatusRemote(id, status)
        if (status === 'approved') {
          const related = get().orders.find(
            (o) => o.prescriptionId === id && o.status === 'pending',
          )
          if (related) get().setOrderStatus(related.id, 'processing')
        }
      },
      pushNotification: (data) => {
        const notification: AppNotification = {
          ...data,
          id: isSupabaseConfigured ? crypto.randomUUID() : uid('n'),
          read: false,
          createdAt: new Date().toISOString(),
        }
        set({ notifications: [notification, ...get().notifications] })
        if (isSupabaseConfigured)
          void remote.createNotificationRemote(notification)
      },
      markNotificationRead: (id) => {
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })
        if (isSupabaseConfigured)
          void remote.markNotificationReadRemote(id, true)
      },
      markAllNotificationsRead: (userId) => {
        set({
          notifications: get().notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n,
          ),
        })
        if (isSupabaseConfigured)
          void remote.markAllNotificationsReadRemote(userId)
      },
      resetDemoData: () =>
        set({
          cart: [],
          wishlist: [],
          orders: seedOrders,
          prescriptions: seedPrescriptions,
          notifications: seedNotifications,
          recentSearches: [],
        }),
    }),
    { name: 'neon-pharma-commerce', version: 1 },
  ),
)
