import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  FileCheck2,
  Package,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth, useCatalog, useCommerce, useSettings } from '@/lib/store'
import {
  cx,
  formatIDR,
  formatNumber,
  orderStatusLabel,
  orderStatusTone,
} from '@/lib/utils'

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#93C5FD',
  shipped: '#8B5CF6',
  delivered: '#34D399',
  cancelled: '#F87171',
}

export default function AdminDashboard() {
  const orders = useCommerce((s) => s.orders)
  const prescriptions = useCommerce((s) => s.prescriptions)
  const products = useCatalog((s) => s.products)
  const users = useAuth((s) => s.users)
  const lowStockThreshold = useSettings((s) => s.lowStockThreshold)

  const paidOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders])
  const revenue = paidOrders.reduce((acc, o) => acc + o.total, 0)
  const customers = users.filter((u) => u.role === 'customer')

  const chartData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().slice(0, 10)
      const dayOrders = paidOrders.filter((o) => o.createdAt.slice(0, 10) === key)
      return {
        label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        pendapatan: dayOrders.reduce((acc, o) => acc + o.total, 0),
        pesanan: dayOrders.length,
      }
    })
  }, [paidOrders])

  const statusData = useMemo(
    () =>
      Object.keys(statusColors)
        .map((status) => ({
          name: orderStatusLabel[status],
          status,
          value: orders.filter((o) => o.status === status).length,
        }))
        .filter((s) => s.value > 0),
    [orders],
  )

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; emoji: string }>()
    paidOrders.forEach((o) =>
      o.items.forEach((item) => {
        const current = map.get(item.productId) ?? {
          name: item.name,
          qty: 0,
          revenue: 0,
          emoji: item.emoji,
        }
        current.qty += item.qty
        current.revenue += item.price * item.qty
        map.set(item.productId, current)
      }),
    )
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [paidOrders])

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [orders],
  )

  const lowStock = products.filter((p) => p.stock <= lowStockThreshold).sort((a, b) => a.stock - b.stock)
  const pendingRx = prescriptions.filter((p) => p.status === 'pending')

  const stats = [
    {
      label: 'Total pendapatan',
      value: formatIDR(revenue),
      icon: Wallet,
      tone: 'bg-primary-soft text-primary-dark',
      note: `${paidOrders.length} transaksi berhasil`,
    },
    {
      label: 'Pesanan',
      value: formatNumber(orders.length),
      icon: ClipboardList,
      tone: 'bg-sky/60 text-ink',
      note: `${orders.filter((o) => o.status === 'pending').length} menunggu konfirmasi`,
    },
    {
      label: 'Produk aktif',
      value: formatNumber(products.length),
      icon: Boxes,
      tone: 'bg-mint/60 text-success',
      note: `${lowStock.length} stok menipis`,
    },
    {
      label: 'Pelanggan',
      value: formatNumber(
        new Set([
          ...customers.map((c) => c.email.toLowerCase()),
          ...paidOrders.map((o) => o.email.toLowerCase()),
        ]).size,
      ),
      icon: Users,
      tone: 'bg-blush/70 text-ink',
      note: `${customers.length} akun terdaftar`,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Dashboard apotek</h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Ringkasan performa penjualan dan operasional NEON PHARMA.
          </p>
        </div>
        <Link to="/admin/reports" className="btn-soft px-4 py-2 text-xs">
          <TrendingUp className="h-3.5 w-3.5" /> Lihat laporan
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="clay p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <span className={cx('grid h-10 w-10 place-items-center rounded-2xl shadow-clay-sm', s.tone)}>
                <s.icon className="h-4 w-4" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted/50" />
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {s.label}
            </p>
            <p className="mt-0.5 font-display text-xl font-extrabold leading-tight sm:text-2xl">
              {s.value}
            </p>
            <p className="mt-1 text-[11px] text-muted">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="clay p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold">Pendapatan 7 hari</h2>
              <p className="text-[11px] text-muted">Tidak termasuk pesanan yang dibatalkan</p>
            </div>
            <span className="chip bg-mint/70 text-success">Realtime</span>
          </div>
          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke="#E6E0F5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#77738A' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#77738A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) => formatIDR(Number(value))}
                  contentStyle={{
                    borderRadius: 16,
                    border: 'none',
                    boxShadow: '8px 8px 20px rgba(174,164,204,0.25)',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pendapatan"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fill="url(#revenueFill)"
                  dot={{ r: 3, fill: '#8B5CF6', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="clay p-4 sm:p-5">
          <h2 className="font-display text-base font-bold">Status pesanan</h2>
          <p className="text-[11px] text-muted">Distribusi seluruh pesanan</p>
          <div className="mt-2 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="none"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={statusColors[entry.status]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${value} pesanan`}
                  contentStyle={{ borderRadius: 16, border: 'none', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {statusData.map((s) => (
              <li key={s.status} className="flex items-center gap-2 text-[11px]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: statusColors[s.status] }}
                />
                <span className="flex-1 text-muted">{s.name}</span>
                <span className="font-display font-bold">{s.value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="clay p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Pesanan terbaru</h2>
            <Link to="/admin/orders" className="text-[11px] font-bold text-primary hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="mt-3 divide-y divide-primary/10">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-bold">{o.id}</p>
                  <p className="truncate text-[11px] text-muted">
                    {o.customerName} · {o.items.length} produk
                  </p>
                </div>
                <span className={cx('chip', orderStatusTone[o.status])}>
                  {orderStatusLabel[o.status]}
                </span>
                <span className="ml-auto shrink-0 font-display text-xs font-bold">
                  {formatIDR(o.total)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="clay p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <AlertTriangle className="h-4 w-4 text-warning" /> Stok menipis
              </h2>
              <Link to="/admin/inventory" className="text-[11px] font-bold text-primary hover:underline">
                Kelola
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="mt-3 text-xs text-muted">Semua stok dalam kondisi aman.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {lowStock.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5">
                    <span className={cx('grid h-9 w-9 place-items-center rounded-xl text-base', p.tone)}>
                      {p.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{p.name}</span>
                      <span className="block text-[10px] text-muted">{p.brand}</span>
                    </span>
                    <span className={cx('text-xs font-bold', p.stock === 0 ? 'text-error' : 'text-warning')}>
                      {p.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="clay p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <FileCheck2 className="h-4 w-4 text-primary" /> Resep menunggu
              </h2>
              <Link to="/admin/prescriptions" className="text-[11px] font-bold text-primary hover:underline">
                Verifikasi
              </Link>
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold text-primary-dark">
              {pendingRx.length}
            </p>
            <p className="text-[11px] text-muted">
              {pendingRx.length === 0
                ? 'Tidak ada resep yang menunggu verifikasi.'
                : 'Perlu ditinjau apoteker sebelum pesanan diproses.'}
            </p>
          </section>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="clay p-4 sm:p-5">
          <h2 className="font-display text-base font-bold">Produk terlaris</h2>
          <div className="mt-3 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="4 6" stroke="#EEE9FB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#77738A' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 10, fill: '#29243A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                />
                <Tooltip
                  formatter={(value) => `${value} terjual`}
                  contentStyle={{ borderRadius: 16, border: 'none', fontSize: 12 }}
                />
                <Bar dataKey="qty" fill="#8B5CF6" radius={[0, 10, 10, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="clay p-4 sm:p-5">
          <h2 className="font-display text-base font-bold">Akses cepat</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {[
              { to: '/admin/products', label: 'Tambah produk', icon: Package },
              { to: '/admin/orders', label: 'Proses pesanan', icon: ClipboardList },
              { to: '/admin/inventory', label: 'Atur stok', icon: Boxes },
              { to: '/admin/prescriptions', label: 'Verifikasi resep', icon: FileCheck2 },
            ].map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="flex items-center gap-2.5 rounded-2xl bg-cream p-3 text-xs font-semibold transition hover:bg-primary-soft"
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-primary shadow-clay-sm">
                  <q.icon className="h-4 w-4" />
                </span>
                {q.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-primary-soft/60 p-3 text-[11px] leading-relaxed text-primary-dark">
            Tips: gunakan laporan penjualan untuk melihat kategori dengan pendapatan tertinggi
            sebelum menambah stok baru.
          </div>
        </section>
      </div>
    </div>
  )
}
