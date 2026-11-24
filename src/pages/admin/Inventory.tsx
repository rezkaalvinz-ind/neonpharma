import { useMemo, useState } from 'react'
import { AlertTriangle, Boxes, PackageCheck, PackageX, Search, Warehouse } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Field, Input, Modal, Select } from '@/components/ui'
import { useCatalog, useSettings } from '@/lib/store'
import { cx, formatIDR } from '@/lib/utils'
import type { Product } from '@/lib/types'

export default function AdminInventory() {
  const products = useCatalog((s) => s.products)
  const setStock = useCatalog((s) => s.setStock)
  const adjustStock = useCatalog((s) => s.adjustStock)
  const threshold = useSettings((s) => s.lowStockThreshold)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [editing, setEditing] = useState<Product | null>(null)
  const [stockValue, setStockValue] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => (!q ? true : `${p.name} ${p.brand}`.toLowerCase().includes(q)))
      .filter((p) => {
        if (filter === 'low') return p.stock > 0 && p.stock <= threshold
        if (filter === 'out') return p.stock === 0
        return true
      })
      .sort((a, b) => a.stock - b.stock)
  }, [products, query, filter, threshold])

  const inventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0)
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= threshold).length
  const outCount = products.filter((p) => p.stock === 0).length

  const openEdit = (product: Product) => {
    setEditing(product)
    setStockValue(product.stock)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Inventori & stok</h1>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          Pantau ketersediaan produk dan nilai persediaan apotek.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Nilai persediaan', value: formatIDR(inventoryValue), icon: Warehouse, tone: 'bg-primary-soft text-primary-dark' },
          { label: 'Total unit', value: products.reduce((a, p) => a + p.stock, 0).toLocaleString('id-ID'), icon: Boxes, tone: 'bg-sky/60 text-ink' },
          { label: 'Stok menipis', value: `${lowCount}`, icon: AlertTriangle, tone: 'bg-amber-100 text-warning' },
          { label: 'Stok habis', value: `${outCount}`, icon: PackageX, tone: 'bg-red-100 text-error' },
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="inventory-search" className="sr-only">Cari produk</label>
            <input
              id="inventory-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari produk untuk mengatur stok…"
              className="input-clay pl-10"
            />
          </div>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'low' | 'out')}
            aria-label="Filter stok"
            className="sm:w-52"
          >
            <option value="all">Semua stok</option>
            <option value="low">Stok menipis (≤ {threshold})</option>
            <option value="out">Stok habis</option>
          </Select>
        </div>

        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-cream px-4 py-8 text-center text-sm text-muted">
              Tidak ada produk pada filter ini.
            </p>
          ) : (
            filtered.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream/70 px-3 py-2.5"
              >
                <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg', product.tone)}>
                  {product.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{product.name}</p>
                  <p className="text-[10px] text-muted">
                    {product.brand} · {formatIDR(product.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cx(
                      'font-display text-sm font-extrabold',
                      product.stock === 0 ? 'text-error' : product.stock <= threshold ? 'text-warning' : 'text-success',
                    )}
                  >
                    {product.stock}
                  </p>
                  <p className="text-[10px] text-muted">unit</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      adjustStock(product.id, 10)
                      toast.success(`+10 stok untuk ${product.name}`)
                    }}
                    className="rounded-full bg-white px-2.5 py-1.5 text-[10px] font-bold text-primary-dark shadow-clay-sm transition hover:bg-primary-soft"
                  >
                    +10
                  </button>
                  <Button variant="soft" size="sm" className="px-3 py-1.5 text-[10px]" onClick={() => openEdit(product)}>
                    Atur
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Atur stok"
        description={editing ? editing.name : undefined}
        size="sm"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setEditing(null)}>Batal</Button>
            <Button
              size="sm"
              onClick={() => {
                if (!editing) return
                setStock(editing.id, stockValue)
                toast.success(`Stok ${editing.name} diperbarui menjadi ${stockValue}`)
                setEditing(null)
              }}
            >
              Simpan stok
            </Button>
          </>
        }
      >
        <Field label="Jumlah stok" htmlFor="stock-input" required>
          <Input
            id="stock-input"
            type="number"
            min={0}
            value={stockValue}
            onChange={(e) => setStockValue(Math.max(0, Number(e.target.value)))}
          />
        </Field>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-mint/40 p-3 text-[11px] text-success">
          <PackageCheck className="h-4 w-4 shrink-0" />
          Stok minimum yang disarankan: {threshold} unit.
        </div>
      </Modal>
    </div>
  )
}
