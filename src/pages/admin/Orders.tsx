import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Modal, Select } from '@/components/ui'
import { useCommerce } from '@/lib/store'
import {
  cx,
  formatDateTime,
  formatIDR,
  orderStatusLabel,
  orderStatusTone,
  prescriptionStatusLabel,
} from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/types'

const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const orders = useCommerce((s) => s.orders)
  const prescriptions = useCommerce((s) => s.prescriptions)
  const setOrderStatus = useCommerce((s) => s.setOrderStatus)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | OrderStatus>('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [draftStatus, setDraftStatus] = useState<OrderStatus>('pending')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...orders]
      .filter((o) => (status === 'all' ? true : o.status === status))
      .filter((o) =>
        !q
          ? true
          : `${o.id} ${o.customerName} ${o.email}`.toLowerCase().includes(q),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, status, query])

  const openOrder = (order: Order) => {
    setSelected(order)
    setDraftStatus(order.status)
  }

  const prescription = selected
    ? prescriptions.find((p) => p.id === selected.prescriptionId)
    : undefined

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Manajemen pesanan</h1>
        <p className="mt-1 text-xs text-muted sm:text-sm">{orders.length} pesanan tercatat.</p>
      </div>

      <div className="clay p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="order-admin-search" className="sr-only">Cari pesanan</label>
            <input
              id="order-admin-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nomor pesanan, nama, atau email…"
              className="input-clay pl-10"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | OrderStatus)}
            aria-label="Filter status"
            className="sm:w-52"
          >
            <option value="all">Semua status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{orderStatusLabel[s]}</option>
            ))}
          </Select>
        </div>

        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-cream px-4 py-8 text-center text-sm text-muted">
              Tidak ada pesanan sesuai filter.
            </p>
          ) : (
            filtered.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => openOrder(order)}
                className="flex w-full flex-wrap items-center gap-3 rounded-2xl bg-cream/70 px-3 py-3 text-left transition hover:bg-primary-soft/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-bold">{order.id}</p>
                  <p className="truncate text-[11px] text-muted">
                    {order.customerName} · {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <span className={cx('chip shrink-0', orderStatusTone[order.status])}>
                  {orderStatusLabel[order.status]}
                </span>
                <p className="w-24 shrink-0 text-right font-display text-xs font-bold">
                  {formatIDR(order.total)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Pesanan ${selected.id}` : 'Pesanan'}
        description={selected ? formatDateTime(selected.createdAt) : undefined}
        size="lg"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setSelected(null)}>Tutup</Button>
            <Button
              size="sm"
              onClick={() => {
                if (!selected) return
                setOrderStatus(selected.id, draftStatus)
                toast.success(`Status ${selected.id} → ${orderStatusLabel[draftStatus]}`)
                setSelected(null)
              }}
            >
              Perbarui status
            </Button>
          </>
        }
      >
        {selected && (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cx('chip', orderStatusTone[selected.status])}>
                {orderStatusLabel[selected.status]}
              </span>
              {selected.requiresPrescription && (
                <span className="chip bg-primary-soft text-primary-dark">Perlu resep</span>
              )}
              <span className="chip bg-white text-ink shadow-clay-sm">
                {selected.paymentMethod === 'transfer'
                  ? 'Transfer bank'
                  : selected.paymentMethod === 'ewallet'
                    ? 'Dompet digital'
                    : 'Bayar di tempat'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-cream p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Pelanggan</p>
                <p className="mt-1 text-sm font-semibold">{selected.customerName}</p>
                <p className="text-xs text-muted">{selected.email}</p>
              </div>
              <div className="rounded-2xl bg-cream p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Alamat</p>
                <p className="mt-1 text-xs leading-relaxed text-ink">
                  {selected.address.recipient} · {selected.address.phone}
                  <br />
                  {selected.address.detail}, {selected.address.city} {selected.address.postal}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Produk</p>
              <ul className="mt-1.5 divide-y divide-primary/10">
                {selected.items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-2.5 py-2">
                    <span className={cx('grid h-9 w-9 place-items-center rounded-xl text-base', item.tone)}>
                      {item.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{item.name}</p>
                      <p className="text-[10px] text-muted">{item.qty} × {formatIDR(item.price)}</p>
                    </div>
                    <p className="text-xs font-bold">{formatIDR(item.price * item.qty)}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-cream p-3 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{formatIDR(selected.subtotal)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted">Ongkir</span>
                <span className="font-semibold">
                  {selected.shipping === 0 ? 'Gratis' : formatIDR(selected.shipping)}
                </span>
              </div>
              {selected.discount > 0 && (
                <div className="flex justify-between py-0.5 text-success">
                  <span>Diskon</span>
                  <span className="font-semibold">−{formatIDR(selected.discount)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-primary/10 pt-1.5">
                <span className="font-display font-bold">Total</span>
                <span className="font-display font-extrabold text-primary-dark">
                  {formatIDR(selected.total)}
                </span>
              </div>
            </div>

            {prescription && (
              <div className="rounded-2xl bg-primary-soft/60 p-3 text-xs">
                <p className="font-display font-bold">Resep {prescription.id}</p>
                <p className="mt-0.5 text-muted">
                  {prescription.fileName} · {prescription.doctorName ?? 'Dokter tidak dicantumkan'}
                </p>
                <p className="mt-1 font-semibold text-primary-dark">
                  {prescriptionStatusLabel[prescription.status]}
                </p>
              </div>
            )}

            {selected.note && (
              <div className="rounded-2xl bg-amber-50 p-3 text-xs text-warning">
                Catatan pelanggan: {selected.note}
              </div>
            )}

            <div>
              <label htmlFor="status-select" className="mb-1.5 block font-display text-[10px] font-bold uppercase tracking-wide text-muted">
                Ubah status pesanan
              </label>
              <Select
                id="status-select"
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as OrderStatus)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{orderStatusLabel[s]}</option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
