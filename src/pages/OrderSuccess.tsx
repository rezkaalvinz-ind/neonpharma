import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock, FileCheck2, Package, Truck } from 'lucide-react'
import { ProductVisual } from '@/components/ProductCard'
import { useCommerce, useCurrentUser } from '@/lib/store'
import { formatDate, formatIDR, orderStatusLabel } from '@/lib/utils'
import NotFound from './NotFound'

const paymentInstruction: Record<string, { title: string; lines: string[] }> = {
  transfer: {
    title: 'Instruksi transfer bank',
    lines: [
      'Transfer ke BCA 1234567890 a.n. PT Neon Pharma Sehat',
      'Nominal harus sama dengan total pesanan',
      'Konfirmasi otomatis dalam 1–5 menit setelah pembayaran',
    ],
  },
  ewallet: {
    title: 'Instruksi dompet digital',
    lines: [
      'Tautan pembayaran dikirim ke email terdaftar',
      'Bayar melalui GoPay, OVO, atau DANA',
      'Pesanan diproses setelah pembayaran berhasil',
    ],
  },
  cod: {
    title: 'Pembayaran di tempat',
    lines: [
      'Siapkan uang tunai sejumlah total pesanan',
      'Kurir akan menghubungi sebelum tiba',
      'Pastikan penerima berada di alamat saat pengantaran',
    ],
  },
}

export default function OrderSuccess() {
  const { id } = useParams()
  const orders = useCommerce((s) => s.orders)
  const user = useCurrentUser()
  const order = orders.find((o) => o.id === id)

  if (!order || !user || (order.userId !== user.id && user.role === 'customer')) return <NotFound />

  const instruction = paymentInstruction[order.paymentMethod]

  return (
    <div className="page-container pt-8">
      <div className="mx-auto max-w-3xl">
        <div className="clay-lg overflow-hidden">
          <div className="relative bg-gradient-to-br from-mint/70 via-white to-primary-soft px-6 py-8 text-center sm:px-10">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/60 blur-2xl" />
            <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-success shadow-clay">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="relative mt-4 text-2xl font-extrabold sm:text-3xl">Terima kasih!</h1>
            <p className="relative mt-2 text-sm text-muted">
              Pesanan <span className="font-display font-bold text-ink">{order.id}</span> tanggal{' '}
              {formatDate(order.createdAt)} telah kami terima.
            </p>
            <div className="relative mt-4 flex flex-wrap justify-center gap-2">
              <span className="chip bg-white text-ink shadow-clay-sm normal-case tracking-normal">
                <Clock className="h-3.5 w-3.5 text-primary" /> {orderStatusLabel[order.status]}
              </span>
              <span className="chip bg-white text-ink shadow-clay-sm normal-case tracking-normal">
                <Package className="h-3.5 w-3.5 text-primary" /> {order.items.length} produk
              </span>
              <span className="chip bg-white text-ink shadow-clay-sm normal-case tracking-normal">
                <Truck className="h-3.5 w-3.5 text-primary" />{' '}
                {order.shipping === 0 ? 'Gratis ongkir' : formatIDR(order.shipping)}
              </span>
            </div>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            {order.requiresPrescription && (
              <div className="flex gap-3 rounded-2xl bg-primary-soft/70 p-4">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-dark" />
                <div>
                  <p className="font-display text-sm font-bold">Menunggu verifikasi resep</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Pesananmu memuat obat resep. Apoteker akan memeriksa dokumen resep dalam
                    1×24 jam kerja. Kamu akan menerima notifikasi setelah resep diverifikasi.
                  </p>
                  <Link to="/notifications" className="mt-1.5 inline-block text-xs font-bold text-primary hover:underline">
                    Lihat notifikasi
                  </Link>
                </div>
              </div>
            )}

            <div>
              <h2 className="font-display text-sm font-bold">{instruction.title}</h2>
              <ul className="mt-2 space-y-1.5">
                {instruction.lines.map((line) => (
                  <li key={line} className="flex gap-2 text-xs leading-relaxed text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-sm font-bold">Produk yang dipesan</h2>
              <ul className="mt-2 divide-y divide-primary/10">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3 py-2.5">
                    <ProductVisual product={item} size="sm" className="h-12 w-12 text-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{item.name}</p>
                      <p className="text-[11px] text-muted">
                        {item.qty} × {formatIDR(item.price)}
                      </p>
                    </div>
                    <p className="font-display text-xs font-bold">
                      {formatIDR(item.price * item.qty)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between rounded-2xl bg-cream px-4 py-3">
                <span className="font-display text-sm font-bold">Total pembayaran</span>
                <span className="font-display text-sm font-extrabold text-primary-dark">
                  {formatIDR(order.total)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-clay-sm">
              <p className="font-display text-xs font-bold uppercase tracking-wide text-muted">
                Dikirim ke
              </p>
              <p className="mt-1 text-sm font-semibold">{order.address.recipient}</p>
              <p className="text-xs leading-relaxed text-muted">
                {order.address.detail}, {order.address.city}, {order.address.province}{' '}
                {order.address.postal} · {order.address.phone}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link to={`/orders/${order.id}`} className="btn-clay flex-1 py-3">
                Lihat detail pesanan
              </Link>
              <Link to="/shop" className="btn-soft flex-1 py-3">
                Lanjut belanja <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
