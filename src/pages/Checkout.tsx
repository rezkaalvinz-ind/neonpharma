import { useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Banknote,
  Check,
  CreditCard,
  FileCheck2,
  Info,
  MapPin,
  ShieldCheck,
  Smartphone,
  Upload,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProductVisual } from '@/components/ProductCard'
import { Field, Input, Textarea } from '@/components/ui'
import { useAuth, useCatalog, useCommerce, useCurrentUser } from '@/lib/store'
import { PROMOS, cx, formatIDR, promoDiscount, shippingFor } from '@/lib/utils'

const schema = z.object({
  recipient: z.string().min(3, 'Nama penerima minimal 3 karakter'),
  phone: z
    .string()
    .min(9, 'Nomor telepon minimal 9 digit')
    .regex(/^[0-9+\-\s]+$/, 'Nomor telepon tidak valid'),
  detail: z.string().min(10, 'Alamat minimal 10 karakter'),
  city: z.string().min(2, 'Kota wajib diisi'),
  province: z.string().min(2, 'Provinsi wajib diisi'),
  postal: z.string().regex(/^\d{5}$/, 'Kode pos harus 5 digit'),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const payments = [
  {
    id: 'transfer' as const,
    label: 'Transfer bank',
    description: 'BCA, Mandiri, BNI, BRI',
    icon: CreditCard,
  },
  {
    id: 'ewallet' as const,
    label: 'Dompet digital',
    description: 'GoPay, OVO, DANA',
    icon: Smartphone,
  },
  {
    id: 'cod' as const,
    label: 'Bayar di tempat',
    description: 'Area tertentu, maks. Rp2.000.000',
    icon: Banknote,
  },
]

export default function Checkout() {
  const user = useCurrentUser()
  const cart = useCommerce((s) => s.cart)
  const products = useCatalog((s) => s.products)
  const placeOrder = useCommerce((s) => s.placeOrder)
  const addPrescription = useCommerce((s) => s.addPrescription)
  const clearCart = useCommerce((s) => s.clearCart)
  const addAddress = useAuth((s) => s.addAddress)
  const navigate = useNavigate()

  const defaultAddress = user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0]
  const [payment, setPayment] = useState<'transfer' | 'ewallet' | 'cod'>('transfer')
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null)
  const [promoError, setPromoError] = useState('')
  const [rxFile, setRxFile] = useState('')
  const [rxFileObj, setRxFileObj] = useState<File | null>(null)
  const [rxDoctor, setRxDoctor] = useState('')
  const [rxError, setRxError] = useState('')
  const [saveAddress, setSaveAddress] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const completedRef = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      recipient: defaultAddress?.recipient ?? user?.name ?? '',
      phone: defaultAddress?.phone ?? user?.phone ?? '',
      detail: defaultAddress?.detail ?? '',
      city: defaultAddress?.city ?? '',
      province: defaultAddress?.province ?? '',
      postal: defaultAddress?.postal ?? '',
      note: '',
    },
  })

  const lines = cart
    .map((line) => ({ ...line, product: products.find((p) => p.id === line.productId) }))
    .filter((l) => l.product)

  const subtotal = lines.reduce((acc, l) => acc + (l.product?.price ?? 0) * l.qty, 0)
  const shipping = shippingFor(subtotal)
  const discount = promo?.discount ?? 0
  const total = Math.max(0, subtotal - discount + shipping)
  const rxRequired = useMemo(
    () => lines.some((l) => l.product?.requiresPrescription),
    [lines],
  )

  if (!user) return null
  if (lines.length === 0 && !completedRef.current) return <Navigate to="/cart" replace />

  const pickAddress = (id: string) => {
    const address = user.addresses.find((a) => a.id === id)
    if (!address) return
    setValue('recipient', address.recipient)
    setValue('phone', address.phone)
    setValue('detail', address.detail)
    setValue('city', address.city)
    setValue('province', address.province)
    setValue('postal', address.postal)
    setValue('note', '')
    setSaveAddress(false)
  }

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) {
      setPromoError('Masukkan kode promo.')
      return
    }
    const definition = PROMOS[code]
    if (!definition) {
      setPromoError('Kode promo tidak dikenal.')
      setPromo(null)
      return
    }
    if (subtotal < definition.min) {
      setPromoError(`Minimum belanja ${formatIDR(definition.min)} untuk kode ini.`)
      setPromo(null)
      return
    }
    setPromo({ code, discount: promoDiscount(code, subtotal) })
    setPromoError('')
    toast.success(`Kode ${code} diterapkan: ${definition.label}`)
  }

  const onSubmit = async (values: FormValues) => {
    if (rxRequired && !rxFile) {
      setRxError('Unggah foto atau PDF resep dokter untuk melanjutkan.')
      return
    }
    setRxError('')
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 500))

    const address = {
      id: defaultAddress?.id ?? `addr-${Date.now()}`,
      label: defaultAddress?.label ?? 'Rumah',
      recipient: values.recipient,
      phone: values.phone,
      detail: values.detail,
      city: values.city,
      province: values.province,
      postal: values.postal,
    }

    if (saveAddress && user.addresses.length === 0) {
      addAddress(address)
    }

    const prescription = rxRequired
      ? addPrescription({
          userId: user.id,
          customerName: user.name,
          fileName: rxFile,
          doctorName: rxDoctor || undefined,
          note: values.note,
          file: rxFileObj ?? undefined,
        })
      : undefined

    const order = placeOrder({
      userId: user.id,
      customerName: user.name,
      email: user.email,
      items: lines.map(({ product, qty }) => ({
        productId: product!.id,
        name: product!.name,
        brand: product!.brand,
        price: product!.price,
        qty,
        emoji: product!.emoji,
        tone: product!.tone,
      })),
      subtotal,
      shipping,
      discount,
      total,
      paymentMethod: payment,
      address,
      prescriptionId: prescription?.id,
      requiresPrescription: rxRequired,
      note: values.note,
    })

    completedRef.current = true
    navigate(`/order-success/${order.id}`, { replace: true })
    clearCart()
    setSubmitting(false)
    toast.success('Pesanan berhasil dibuat')
  }

  const fieldError = (message?: string) =>
    message ? <p className="mt-1 text-xs font-semibold text-error">{message}</p> : null

  return (
    <div className="page-container pt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-extrabold">Checkout</h1>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="h-4 w-4 text-success" /> Transaksi aman & terenkripsi
        </p>
      </div>

      <ol className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted">
        {['Keranjang', 'Checkout', 'Selesai'].map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cx(
                'grid h-6 w-6 place-items-center rounded-full font-display',
                i <= 1 ? 'bg-primary text-white' : 'bg-white text-muted shadow-clay-sm',
              )}
            >
              {i + 1}
            </span>
            <span className={i === 1 ? 'text-ink' : ''}>{step}</span>
            {i < 2 && <span className="mx-1 h-px w-6 bg-primary/20" />}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]" noValidate>
        <div className="space-y-4">
          {/* ADDRESS */}
          <section className="clay p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <MapPin className="h-4 w-4 text-primary" /> Alamat pengiriman
            </h2>

            {user.addresses.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {user.addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => pickAddress(a.id)}
                    className="rounded-2xl bg-cream px-3 py-2 text-left text-[11px] font-medium text-ink shadow-clay-in transition hover:bg-primary-soft"
                  >
                    <span className="font-display font-bold">{a.label}</span> · {a.city}
                    {a.isDefault && <span className="ml-1 text-primary">(utama)</span>}
                  </button>
                ))}
                <Link
                  to="/addresses"
                  className="rounded-2xl px-3 py-2 text-[11px] font-bold text-primary hover:underline"
                >
                  Kelola alamat
                </Link>
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nama penerima" htmlFor="recipient" required>
                <Input id="recipient" aria-invalid={!!errors.recipient} {...register('recipient')} />
                {fieldError(errors.recipient?.message)}
              </Field>
              <Field label="Nomor telepon" htmlFor="phone" required>
                <Input id="phone" inputMode="tel" aria-invalid={!!errors.phone} {...register('phone')} />
                {fieldError(errors.phone?.message)}
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Alamat lengkap"
                  htmlFor="detail"
                  hint="Sertakan nama jalan, nomor rumah, RT/RW."
                  required
                >
                  <Textarea id="detail" rows={2} aria-invalid={!!errors.detail} {...register('detail')} />
                  {fieldError(errors.detail?.message)}
                </Field>
              </div>
              <Field label="Kota / Kabupaten" htmlFor="city" required>
                <Input id="city" aria-invalid={!!errors.city} {...register('city')} />
                {fieldError(errors.city?.message)}
              </Field>
              <Field label="Provinsi" htmlFor="province" required>
                <Input id="province" aria-invalid={!!errors.province} {...register('province')} />
                {fieldError(errors.province?.message)}
              </Field>
              <Field label="Kode pos" htmlFor="postal" required>
                <Input id="postal" inputMode="numeric" maxLength={5} aria-invalid={!!errors.postal} {...register('postal')} />
                {fieldError(errors.postal?.message)}
              </Field>
              <Field label="Catatan kurir (opsional)" htmlFor="note">
                <Input id="note" placeholder="Contoh: titip di pos keamanan" {...register('note')} />
              </Field>
            </div>

            {user.addresses.length === 0 && (
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Simpan alamat ini untuk pesanan berikutnya
              </label>
            )}
          </section>

          {/* PRESCRIPTION */}
          {rxRequired && (
            <section className="clay p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <FileCheck2 className="h-4 w-4 text-primary" /> Verifikasi resep
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Pesananmu memuat obat yang memerlukan resep dokter. Unggah dokumen resep agar
                apoteker dapat memverifikasi sebelum pesanan diproses.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1.5 block font-display text-xs font-bold uppercase tracking-wide text-muted">
                    Foto / PDF resep <span className="text-primary">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={cx(
                      'flex w-full items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-4 text-left transition',
                      rxFile
                        ? 'border-success/40 bg-mint/30'
                        : 'border-primary/30 bg-cream hover:bg-primary-soft/50',
                    )}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-primary shadow-clay-sm">
                      {rxFile ? <Check className="h-5 w-5 text-success" /> : <Upload className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold">
                        {rxFile || 'Pilih file resep'}
                      </span>
                      <span className="block text-[11px] text-muted">JPG, PNG, atau PDF maks. 5 MB</span>
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 5 * 1024 * 1024) {
                        setRxError('Ukuran file maksimal 5 MB.')
                        return
                      }
                      setRxFile(file.name)
                      setRxFileObj(file)
                      setRxError('')
                    }}
                  />
                  {rxError && (
                    <p role="alert" className="mt-1.5 text-xs font-semibold text-error">{rxError}</p>
                  )}
                </div>
                <Field label="Nama dokter (opsional)" htmlFor="doctor">
                  <Input
                    id="doctor"
                    placeholder="dr. Nama Dokter"
                    value={rxDoctor}
                    onChange={(e) => setRxDoctor(e.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-3 flex gap-2 rounded-2xl bg-primary-soft/60 p-3 text-[11px] leading-relaxed text-primary-dark">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Obat resep hanya diserahkan setelah resep dinyatakan valid oleh apoteker. Jika
                resep ditolak, pesanan akan dibatalkan dan danamu dikembalikan.
              </div>
            </section>
          )}

          {/* PAYMENT */}
          <section className="clay p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <Wallet className="h-4 w-4 text-primary" /> Metode pembayaran
            </h2>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Metode pembayaran">
              {payments.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={payment === option.id}
                  onClick={() => setPayment(option.id)}
                  className={cx(
                    'flex flex-col items-start gap-2 rounded-2xl p-3.5 text-left transition',
                    payment === option.id
                      ? 'bg-primary-soft shadow-clay-in ring-1 ring-primary/40'
                      : 'bg-white shadow-clay-sm hover:bg-cream',
                  )}
                >
                  <span className="flex w-full items-center justify-between">
                    <option.icon className="h-5 w-5 text-primary-dark" />
                    {payment === option.id && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </span>
                  <span>
                    <span className="block font-display text-xs font-bold">{option.label}</span>
                    <span className="mt-0.5 block text-[10px] text-muted">{option.description}</span>
                  </span>
                </button>
              ))}
            </div>
            {payment === 'cod' && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-warning">
                Pembayaran di tempat tersedia untuk area tertentu dengan nilai pesanan maksimal
                Rp2.000.000.
              </p>
            )}
          </section>
        </div>

        {/* SUMMARY */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="clay p-5">
            <h2 className="font-display text-base font-bold">Ringkasan pesanan</h2>

            <ul className="mt-3 max-h-64 space-y-2.5 overflow-y-auto pr-1">
              {lines.map(({ product, qty }) => (
                <li key={product!.id} className="flex items-center gap-2.5">
                  <ProductVisual product={product!} size="sm" className="h-11 w-11 text-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{product!.name}</p>
                    <p className="text-[11px] text-muted">
                      {qty} × {formatIDR(product!.price)}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-xs font-bold">
                    {formatIDR(product!.price * qty)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <label htmlFor="promo" className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-wide text-muted">
                Kode promo
              </label>
              <div className="flex gap-2">
                <Input
                  id="promo"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="NEON10"
                  className="py-2.5 text-xs"
                />
                <button type="button" onClick={applyPromo} className="btn-soft shrink-0 px-4 py-2 text-xs">
                  Pakai
                </button>
              </div>
              {promoError && <p className="mt-1 text-[11px] font-semibold text-error">{promoError}</p>}
              {promo && (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-success">
                  <Check className="h-3 w-3" /> {promo.code} · hemat {formatIDR(promo.discount)}
                  <button
                    type="button"
                    onClick={() => {
                      setPromo(null)
                      setPromoInput('')
                    }}
                    className="ml-1 font-bold text-muted underline"
                  >
                    hapus
                  </button>
                </p>
              )}
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold">{formatIDR(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Diskon</dt>
                  <dd className="font-semibold">−{formatIDR(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Ongkos kirim</dt>
                <dd className="font-semibold">{shipping === 0 ? 'Gratis' : formatIDR(shipping)}</dd>
              </div>
              <div className="my-2 h-px bg-primary/10" />
              <div className="flex justify-between text-base">
                <dt className="font-display font-bold">Total</dt>
                <dd className="font-display font-extrabold text-primary-dark">{formatIDR(total)}</dd>
              </div>
            </dl>

            <button type="submit" disabled={submitting} className="btn-clay mt-4 w-full py-3.5">
              {submitting ? 'Memproses pesanan…' : 'Buat pesanan'}
            </button>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-muted">
              Dengan menekan “Buat pesanan”, kamu menyetujui syarat dan ketentuan NEON PHARMA.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
