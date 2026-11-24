import { useMemo, useState } from 'react'
import { Mail, Search, ShoppingBag, Users } from 'lucide-react'
import { useAuth, useCommerce } from '@/lib/store'
import { cx, formatDate, formatIDR, roleLabel } from '@/lib/utils'

export default function AdminCustomers() {
  const users = useAuth((s) => s.users)
  const orders = useCommerce((s) => s.orders)
  const [query, setQuery] = useState('')

  const customers = useMemo(() => {
    const registered = users.filter((u) => u.role === 'customer')
    const rows = registered.map((u) => {
      const userOrders = orders.filter((o) => o.userId === u.id && o.status !== 'cancelled')
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone ?? '—',
        joined: u.createdAt,
        orderCount: userOrders.length,
        spent: userOrders.reduce((acc, o) => acc + o.total, 0),
        registered: true,
      }
    })

    // Pelanggan tamu dari pesanan (belum mendaftar akun)
    const guests = new Map<string, { name: string; email: string; orderCount: number; spent: number }>()
    orders
      .filter((o) => o.status !== 'cancelled' && !registered.some((u) => u.id === o.userId))
      .forEach((o) => {
        const key = o.email.toLowerCase()
        const current = guests.get(key) ?? { name: o.customerName, email: o.email, orderCount: 0, spent: 0 }
        current.orderCount += 1
        current.spent += o.total
        guests.set(key, current)
      })

    return [
      ...rows,
      ...Array.from(guests.entries()).map(([email, g]) => ({
        id: email,
        name: g.name,
        email: g.email,
        phone: '—',
        joined: '',
        orderCount: g.orderCount,
        spent: g.spent,
        registered: false,
      })),
    ]
      .filter((c) => {
        const q = query.trim().toLowerCase()
        return !q || `${c.name} ${c.email}`.toLowerCase().includes(q)
      })
      .sort((a, b) => b.spent - a.spent)
  }, [users, orders, query])

  const totalSpent = customers.reduce((acc, c) => acc + c.spent, 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Manajemen pelanggan</h1>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          {customers.length} pelanggan terdaftar dan tamu dengan riwayat pesanan.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Akun pelanggan', value: users.filter((u) => u.role === 'customer').length, icon: Users, tone: 'bg-primary-soft text-primary-dark' },
          { label: 'Pelanggan dengan pesanan', value: customers.filter((c) => c.orderCount > 0).length, icon: ShoppingBag, tone: 'bg-mint/60 text-success' },
          { label: 'Total belanja', value: formatIDR(totalSpent), icon: Mail, tone: 'bg-sky/60 text-ink' },
        ].map((s) => (
          <div key={s.label} className="clay flex items-center gap-3 p-4">
            <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-clay-sm', s.tone)}>
              <s.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{s.label}</p>
              <p className="truncate font-display text-lg font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="clay p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="customer-search" className="sr-only">Cari pelanggan</label>
          <input
            id="customer-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau email pelanggan…"
            className="input-clay pl-10"
          />
        </div>

        <div className="mt-4 space-y-2">
          <div className="hidden grid-cols-[2fr_1fr_0.8fr_0.8fr_1fr] gap-3 px-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted lg:grid">
            <span>Pelanggan</span>
            <span>Telepon</span>
            <span>Pesanan</span>
            <span>Total belanja</span>
            <span>Bergabung</span>
          </div>
          {customers.length === 0 ? (
            <p className="rounded-2xl bg-cream px-4 py-8 text-center text-sm text-muted">
              Tidak ada pelanggan yang cocok.
            </p>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-cream/70 px-3 py-2.5 lg:grid-cols-[2fr_1fr_0.8fr_0.8fr_1fr]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-xs font-bold text-primary-dark">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{customer.name}</p>
                    <p className="truncate text-[10px] text-muted">{customer.email}</p>
                    {!customer.registered && (
                      <span className="chip mt-0.5 bg-blush/60 text-ink normal-case tracking-normal">Tamu</span>
                    )}
                  </div>
                </div>
                <p className="hidden text-[11px] text-muted lg:block">{customer.phone}</p>
                <p className="hidden text-xs font-semibold lg:block">{customer.orderCount}</p>
                <p className="hidden text-xs font-bold text-primary-dark lg:block">
                  {formatIDR(customer.spent)}
                </p>
                <p className="hidden text-[11px] text-muted lg:block">
                  {customer.joined ? formatDate(customer.joined) : '—'}
                </p>
                <div className="col-span-2 flex items-center justify-end gap-2 lg:hidden">
                  <p className="text-[11px] font-semibold">{customer.orderCount} pesanan</p>
                  <p className="text-[11px] font-bold text-primary-dark">{formatIDR(customer.spent)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="clay p-4">
        <h2 className="font-display text-sm font-bold">Tim apotek</h2>
        <p className="mt-1 text-[11px] text-muted">
          Akun internal tidak dihitung sebagai pelanggan dan tidak dapat diubah dari halaman ini.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {users.filter((u) => u.role !== 'customer').map((u) => (
            <div key={u.id} className="rounded-2xl bg-cream px-3 py-2.5">
              <p className="truncate text-xs font-bold">{u.name}</p>
              <p className="truncate text-[10px] text-muted">{u.email}</p>
              <span className="chip mt-1 bg-white text-primary-dark">{roleLabel[u.role]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
