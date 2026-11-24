import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, FileCheck2, MapPin, MessageSquare, Package, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import { ProductVisual } from '@/components/ProductCard'
import { Button, Modal } from '@/components/ui'
import { useCommerce, useCurrentUser } from '@/lib/store'
import {
  cx,
  formatDateTime,
  formatIDR,
  orderStatusLabel,
  orderStatusTone,
  prescriptionStatusLabel,
} from '@/lib/utils'
import NotFound from './NotFound'

const steps = [
  { id: 'pending', label: 'Pesanan dibuat', icon: Package },
  { id: 'processing', label: 'Diproses apotek', icon: Check },
  { id: 'shipped', label: 'Dikirim', icon: Truck },
  { id: 'delivered', label: 'Selesai', icon: MapPin },
] as const

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const orders = useCommerce((s) => s.orders)
  const prescriptions = useCommerce((s) => s.prescriptions)
  const cancelOrder = useCommerce((s) => s.cancelOrder)
  const addToCart = useCommerce((s) => s.addToCart)
  const user = useCurrentUser()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const order = orders.find((o) => o.id === id)
  if (!order || !user || (order.userId !== user.id && user.role === 'customer')) return <NotFound />

  const prescription = prescriptions.find((p) => p.id === order.prescriptionId)
  const activeIndex = steps.findIndex((s) => s.id === order.status)
  const canCancel = order.status === 'pending' || order.status === 'processing'
  const methodLabel = { transfer: 'Transfer bank', ewallet: 'Dompet digital', cod: 'Bayar di tempat' }

  return (
    <div className="page-container pt-8">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary-dark">
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke riwayat pesanan
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{order.id}</h1>
          <p className="mt-1 text-xs text-muted">Dibuat {formatDateTime(order.createdAt)}</p>
        </div>
        <span className={cx('chip', orderStatusTone[order.status])}>
          {orderStatusLabel[order.status]}
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* TIMELINE */}
          <section className="clay p-5">
            <h2 className="font-display text-base font-bold">Status pesanan</h2>
            {order.status === 'cancelled' ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-red-50 p-3 text-sm text-error">
                <X className="h-4 w-4 shrink-0" />
                Pesanan ini dibatalkan. Stok produk telah dikembalikan.
              </div>
            ) : (
              <ol className="mt-4 space-y-3">
                {steps.map((step, i) => {
                  const done = i <= activeIndex
                  return (
                    <li key={step.id} className="flex items-start gap-3">
                      <span
                        className={cx(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-full transition',
                          done ? 'bg-primary text-white shadow-clay-btn' : 'bg-cream text-muted shadow-clay-in',
                        )}
                      >
                        <step.icon className="h-4 w-4" />
                      </span>
                      <div className="pt-1.5">
                        <p className={cx('font-display text-sm font-bold', !done && 'text-muted')}>
                          {step.label}
                        </p>
                        {i === activeIndex && (
                          <p className="text-[11px] text-muted">Status saat ini</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}

            {prescription && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-primary-soft/60 p-3">
                <FileCheck2 className="h-4 w-4 text-primary-dark" />
                <p className="text-xs text-primary-dark">
                  Resep {prescription.id} · {prescription.fileName} ·{' '}
                  <span className="font-bold">{prescriptionStatusLabel[prescription.status]}</span>
                </p>
              </div>
            )}
          </section>

          {/* ITEMS */}
          <section className="clay p-5">
            <h2 className="font-display text-base font-bold">Produk</h2>
            <ul className="mt-3 divide-y divide-primary/10">
              {order.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 py-3">
                  <ProductVisual product={item} size="sm" className="h-12 w-12 text-xl" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${item.productId}`}
                      className="truncate text-sm font-semibold hover:text-primary-dark"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[11px] text-muted">
                      {item.brand} · {item.qty} × {formatIDR(item.price)}
                    </p>
                  </div>
                  <p className="font-display text-sm font-bold">
                    {formatIDR(item.price * item.qty)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {order.note && (
            <section className="clay flex gap-3 p-5">
              <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <h2 className="font-display text-sm font-bold">Catatan</h2>
                <p className="mt-1 text-sm text-muted">{order.note}</p>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <section className="clay p-5">
            <h2 className="font-display text-base font-bold">Ringkasan pembayaran</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold">{formatIDR(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Diskon</dt>
                  <dd className="font-semibold">−{formatIDR(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Ongkos kirim</dt>
                <dd className="font-semibold">
                  {order.shipping === 0 ? 'Gratis' : formatIDR(order.shipping)}
                </dd>
              </div>
              <div className="my-1 h-px bg-primary/10" />
              <div className="flex justify-between">
                <dt className="font-display font-bold">Total</dt>
                <dd className="font-display font-extrabold text-primary-dark">
                  {formatIDR(order.total)}
                </dd>
              </div>
              <div className="flex justify-between text-xs">
                <dt className="text-muted">Metode</dt>
                <dd className="font-semibold">{methodLabel[order.paymentMethod]}</dd>
              </div>
            </dl>
          </section>

          <section className="clay p-5">
            <h2 className="font-display text-base font-bold">Alamat pengiriman</h2>
            <p className="mt-2 text-sm font-semibold">{order.address.recipient}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {order.address.detail}
              <br />
              {order.address.city}, {order.address.province} {order.address.postal}
              <br />
              {order.address.phone}
            </p>
          </section>

          <div className="space-y-2">
            <Button
              variant="soft"
              className="w-full"
              onClick={() => {
                order.items.forEach((item) => addToCart(item.productId, item.qty))
                toast.success('Produk dimasukkan kembali ke keranjang')
                navigate('/cart')
              }}
            >
              Pesan lagi
            </Button>
            <Link to="/contact" className="btn-ghost w-full">
              Butuh bantuan?
            </Link>
            {canCancel && (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="btn-ghost w-full text-error hover:bg-red-50"
              >
                Batalkan pesanan
              </button>
            )}
          </div>
        </aside>
      </div>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Batalkan pesanan?"
        description="Stok produk akan dikembalikan dan pesanan tidak dapat dipulihkan."
        size="sm"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setConfirmCancel(false)}>
              Kembali
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-br from-red-500 to-error shadow-[0_8px_18px_rgba(185,28,28,0.3)]"
              onClick={() => {
                cancelOrder(order.id)
                setConfirmCancel(false)
                toast.success('Pesanan dibatalkan')
              }}
            >
              Ya, batalkan
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Pesanan <span className="font-semibold text-ink">{order.id}</span> sebesar{' '}
          {formatIDR(order.total)} akan dibatalkan.
        </p>
      </Modal>
    </div>
  )
}
