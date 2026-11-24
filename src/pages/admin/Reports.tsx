import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Receipt, ShoppingBag, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Select } from '@/components/ui'
import { useCatalog, useCommerce } from '@/lib/store'
import { cx, formatIDR, formatNumber, orderStatusLabel } from '@/lib/utils'

const pieColors = ['#8B5CF6', '#A7F3D0', '#FBCFE8', '#BFDBFE', '#C4B5FD', '#FCD34D']

export default function AdminReports() {
  const orders = useCommerce((s) => s.orders)
  const products = useCatalog((s) => s.products)
  const categories = useCatalog((s) => s.categories)
  const [range, setRange] = useState('30')

  const days = Number(range)
  const scoped = useMemo(() => {
    const cutoff = Date.now() - days * 86400000
    return orders
      .filter((o) => o.status !== 'cancelled')
      .filter((o) => new Date(o.createdAt).getTime() >= cutoff)
  }, [orders, days])

  const revenue = scoped.reduce((acc, o) => acc + o.total, 0)
  const units = scoped.reduce(
    (acc, o) => acc + o.items.reduce((s, i) => s + i.qty, 0),
    0,
  )
  const average = scoped.length ? Math.round(revenue / scoped.length) : 0

  const dailyData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (days - 1 - i))
      const key = d.toISOString().slice(0, 10)
      const dayOrders = scoped.filter((o) => o.createdAt.slice(0, 10) === key)
      return {
        label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        pendapatan: dayOrders.reduce((acc, o) => acc + o.total, 0),
      }
    })
  }, [scoped, days])

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; emoji: string }>()
    scoped.forEach((o) =>
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
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }, [scoped])

  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    scoped.forEach((o) =>
      o.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId)
        const slug = product?.category ?? 'lainnya'
        map.set(slug, (map.get(slug) ?? 0) + item.price * item.qty)
      }),
    )
    return Array.from(map.entries()).map(([slug, value]) => ({
      name: categories.find((c) => c.slug === slug)?.name ?? 'Lainnya',
      value,
    }))
  }, [scoped, products, categories])

  const exportCsv = () => {
    const header = ['ID Pesanan', 'Tanggal', 'Pelanggan', 'Email', 'Status', 'Subtotal', 'Ongkir', 'Diskon', 'Total']
    const rows = scoped.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleString('id-ID'),
      o.customerName,
      o.email,
      orderStatusLabel[o.status],
      o.subtotal,
      o.shipping,
      o.discount,
      o.total,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-neon-pharma-${days}hari.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Laporan CSV diunduh')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Laporan penjualan</h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Ringkasan performa {days} hari terakhir, tidak termasuk pesanan dibatalkan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            aria-label="Rentang laporan"
            className="w-36"
          >
            <option value="7">7 hari</option>
            <option value="30">30 hari</option>
            <option value="90">90 hari</option>
          </Select>
          <button type="button" onClick={exportCsv} className="btn-clay px-4 py-2.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Ekspor CSV
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pendapatan', value: formatIDR(revenue), icon: Wallet, tone: 'bg-primary-soft text-primary-dark' },
          { label: 'Pesanan', value: formatNumber(scoped.length), icon: Receipt, tone: 'bg-sky/60 text-ink' },
          { label: 'Rata-rata pesanan', value: formatIDR(average), icon: TrendingUp, tone: 'bg-mint/60 text-success' },
          { label: 'Unit terjual', value: formatNumber(units), icon: ShoppingBag, tone: 'bg-blush/70 text-ink' },
        ].map((s) => (
          <div key={s.label} className="clay flex items-center gap-3 p-4">
            <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-clay-sm', s.tone)}>
              <s.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{s.label}</p>
              <p className="truncate font-display text-base font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="clay p-4 sm:p-5">
        <h2 className="font-display text-base font-bold">Tren pendapatan</h2>
        <div className="mt-3 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" stroke="#EEE9FB" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#77738A' }}
                axisLine={false}
                tickLine={false}
                interval={days > 30 ? Math.floor(days / 10) : 0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#77738A' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              />
              <Tooltip
                formatter={(value) => formatIDR(Number(value))}
                contentStyle={{ borderRadius: 16, border: 'none', fontSize: 12 }}
              />
              <Bar dataKey="pendapatan" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <section className="clay p-4 sm:p-5">
          <h2 className="font-display text-base font-bold">Pendapatan per kategori</h2>
          <div className="mt-2 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  stroke="none"
                  paddingAngle={2}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatIDR(Number(value))}
                  contentStyle={{ borderRadius: 16, border: 'none', fontSize: 12 }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="clay p-4 sm:p-5">
          <h2 className="font-display text-base font-bold">Produk dengan pendapatan tertinggi</h2>
          {topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Belum ada penjualan pada rentang ini.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {topProducts.map((p) => (
                <div key={p.name} className="flex items-center gap-2.5 rounded-2xl bg-cream/70 px-3 py-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-base shadow-clay-sm">
                    {p.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{p.name}</p>
                    <p className="text-[10px] text-muted">{p.qty} unit terjual</p>
                  </div>
                  <p className="shrink-0 font-display text-xs font-bold text-primary-dark">
                    {formatIDR(p.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <p className="text-[11px] text-muted">
        Laporan dihitung dari data pesanan pada sistem ini. Ekspor CSV dapat dibuka di aplikasi
        spreadsheet untuk analisis lanjutan.
      </p>
    </div>
  )
}
