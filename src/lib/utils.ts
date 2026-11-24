export const formatIDR = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

export const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value)

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export const discountPercent = (price: number, originalPrice?: number) =>
  originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

export const FREE_SHIPPING_MIN = 150000
export const SHIPPING_FEE = 15000

export const shippingFor = (subtotal: number) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE

export const PROMOS: Record<string, { label: string; type: 'percent' | 'amount'; value: number; min: number }> = {
  NEON10: { label: 'Diskon 10%', type: 'percent', value: 10, min: 50000 },
  HEMAT50: { label: 'Potongan Rp50.000', type: 'amount', value: 50000, min: 300000 },
}

export const promoDiscount = (code: string, subtotal: number) => {
  const promo = PROMOS[code.trim().toUpperCase()]
  if (!promo || subtotal < promo.min) return 0
  return promo.type === 'percent'
    ? Math.round((subtotal * promo.value) / 100)
    : promo.value
}

export const orderStatusLabel: Record<string, string> = {
  pending: 'Menunggu Konfirmasi',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
}

export const orderStatusTone: Record<string, string> = {
  pending: 'bg-amber-100 text-warning',
  processing: 'bg-sky/70 text-ink',
  shipped: 'bg-primary-soft text-primary-dark',
  delivered: 'bg-mint/70 text-success',
  cancelled: 'bg-red-100 text-error',
}

export const prescriptionStatusLabel: Record<string, string> = {
  pending: 'Menunggu Verifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export const roleLabel: Record<string, string> = {
  customer: 'Pelanggan',
  staff: 'Pegawai',
  pharmacist: 'Apoteker',
  admin: 'Admin',
}
