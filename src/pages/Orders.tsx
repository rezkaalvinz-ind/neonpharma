import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Package, Search } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { useCommerce, useCurrentUser } from '@/lib/store'
import { cx, formatDate, formatIDR, orderStatusLabel, orderStatusTone } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'

const filters: Array<{ id: 'all' | OrderStatus; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'processing', label: 'Diproses' },
  { id: 'shipped', label: 'Dikirim' },
  { id: 'delivered', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
]

export default function Orders() {
  const user = useCurrentUser()
  const orders = useCommerce((s) => s.orders)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [query, setQuery] = useState('')

  const myOrders = useMemo(() => {
    if (!user) return []
    const base =
      user.role === 'customer'
        ? orders.filter((o) => o.userId === user.id)
        : orders
    return base.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return (
          o.id.toLowerCase().includes(q) ||
          o.items.some((i) => i.name.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [orders, user, filter, query])

  return (
    <div className="page-container pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Riwayat pesanan</h1>
          <p className="mt-1 text-sm text-muted">
            Pantau status, detail pengiriman, dan rincian pembayaran pesananmu.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="order-search" className="sr-only">Cari pesanan</label>
          <input
            id="order-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor pesanan…"
            className="input-clay w-full pl-10 sm:w-64"
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 hide-scrollbar" role="tablist" aria-label="Filter status pesanan">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cx(
              'shrink-0 rounded-full px-4 py-2 font-display text-xs font-bold transition',
              filter === f.id
                ? 'bg-primary text-white shadow-clay-btn'
                : 'bg-white text-muted shadow-clay-sm hover:text-primary-dark',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {myOrders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="Belum ada pesanan"
            description="Pesanan yang kamu buat akan muncul di sini beserta status pengirimannya."
            action={
              <Link to="/shop" className="btn-clay px-6 py-3">
                Mulai belanja <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        ) : (
          myOrders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="clay clay-hover block p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-bold">{order.id}</p>
                  <p className="text-[11px] text-muted">
                    {formatDate(order.createdAt)} · {order.items.length} produk
                  </p>
                </div>
                <span className={cx('chip', orderStatusTone[order.status])}>
                  {orderStatusLabel[order.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {order.items.slice(0, 4).map((item) => (
                  <span
                    key={item.productId}
                    className={cx(
                      'grid h-11 w-11 place-items-center rounded-2xl text-lg shadow-clay-sm',
                      item.tone,
                    )}
                    title={item.name}
                    aria-hidden
                  >
                    {item.emoji}
                  </span>
                ))}
                {order.items.length > 4 && (
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cream text-[11px] font-bold text-muted">
                    +{order.items.length - 4}
                  </span>
                )}
                <span className="ml-auto font-display text-sm font-extrabold text-primary-dark">
                  {formatIDR(order.total)}
                </span>
              </div>

              <p className="mt-2 line-clamp-1 text-xs text-muted">
                {order.items.map((i) => i.name).join(', ')}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
