export type Role = 'customer' | 'staff' | 'pharmacist' | 'admin'

export interface Category {
  slug: string
  name: string
  short: string
  emoji: string
  tone: string // tailwind classes for pastel background
  blurb: string
}

export interface Product {
  id: string
  name: string
  brand: string
  category: string
  price: number
  originalPrice?: number
  stock: number
  requiresPrescription: boolean
  description: string
  ingredients?: string
  usage?: string
  storage?: string
  warning?: string
  emoji: string
  tone: string
  rating: number
  reviews: number
  sold: number
  createdAt: string
  badges?: string[]
}

export interface Address {
  id: string
  label: string
  recipient: string
  phone: string
  detail: string
  city: string
  province: string
  postal: string
  isDefault?: boolean
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  phone?: string
  addresses: Address[]
  createdAt: string
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  name: string
  brand: string
  price: number
  qty: number
  emoji: string
  tone: string
}

export interface Order {
  id: string
  userId: string
  customerName: string
  email: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  status: OrderStatus
  paymentMethod: 'transfer' | 'cod' | 'ewallet'
  address: Address
  prescriptionId?: string
  requiresPrescription: boolean
  note?: string
  createdAt: string
}

export type PrescriptionStatus = 'pending' | 'approved' | 'rejected'

export interface Prescription {
  id: string
  userId: string
  customerName: string
  fileName: string
  doctorName?: string
  note?: string
  status: PrescriptionStatus
  createdAt: string
}

export interface AppNotification {
  id: string
  userId: string
  title: string
  body: string
  read: boolean
  type: 'order' | 'promo' | 'system' | 'prescription'
  createdAt: string
}

export interface Testimonial {
  id: string
  name: string
  city: string
  rating: number
  text: string
  emoji: string
  tone: string
}

export interface CartLine {
  productId: string
  qty: number
}
