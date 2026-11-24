import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ShopSettings {
  storeName: string
  email: string
  phone: string
  address: string
  hours: string
  lowStockThreshold: number
  notifyOrders: boolean
  notifyStock: boolean
  notifyPromo: boolean
  update: (data: Partial<Omit<ShopSettings, 'update'>>) => void
}

const defaults = {
  storeName: 'NEON PHARMA',
  email: 'halo@neonpharma.id',
  phone: '(022) 1234-5678',
  address: 'Jl. Kesehatan Raya No. 88, Bandung, Jawa Barat 40131',
  hours: 'Senin–Minggu, 08.00–22.00 WIB',
  lowStockThreshold: 10,
  notifyOrders: true,
  notifyStock: true,
  notifyPromo: false,
}

export const useSettings = create<ShopSettings>()(
  persist(
    (set) => ({
      ...defaults,
      update: (data) => set(data),
    }),
    { name: 'neon-pharma-settings', version: 1 },
  ),
)
