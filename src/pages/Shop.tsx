import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import { ProductGrid } from '@/components/ProductCard'
import { Button, EmptyState, Modal, Pagination, Select, Skeleton } from '@/components/ui'
import { useCatalog } from '@/lib/store'
import { cx, formatIDR } from '@/lib/utils'

type SortKey = 'populer' | 'termurah' | 'termahal' | 'terbaru'

const PAGE_SIZE = 8

export default function Shop() {
  const products = useCatalog((s) => s.products)
  const categories = useCatalog((s) => s.categories)
  const [params, setParams] = useSearchParams()

  const q = params.get('q') ?? ''
  const categoryParam = params.get('category') ?? ''
  const [search, setSearch] = useState(q)
  const [cats, setCats] = useState<string[]>(categoryParam ? [categoryParam] : [])
  const [brands, setBrands] = useState<string[]>([])
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [rxOnly, setRxOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('populer')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  const priceCap = useMemo(
    () => Math.ceil(Math.max(100000, ...products.map((p) => p.price)) / 50000) * 50000,
    [products],
  )
  const [maxPrice, setMaxPrice] = useState(priceCap)

  const allBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products],
  )

  useEffect(() => {
    setSearch(q)
    setPage(1)
  }, [q])

  useEffect(() => {
    setCats(categoryParam ? [categoryParam] : [])
    setPage(1)
  }, [categoryParam])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 320)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [cats, brands, onlyAvailable, rxOnly, maxPrice, sort, search])

  const filtered = useMemo(() => {
    const term = (search || q).trim().toLowerCase()
    let list = products.filter((p) => {
      const haystack = [p.name, p.brand, p.description, ...categories.filter((c) => c.slug === p.category).map((c) => c.name)]
        .join(' ')
        .toLowerCase()
      if (term && !haystack.includes(term)) return false
      if (cats.length && !cats.includes(p.category)) return false
      if (brands.length && !brands.includes(p.brand)) return false
      if (p.price > maxPrice) return false
      if (onlyAvailable && p.stock === 0) return false
      if (rxOnly && !p.requiresPrescription) return false
      return true
    })

    list = list.sort((a, b) => {
      if (sort === 'termurah') return a.price - b.price
      if (sort === 'termahal') return b.price - a.price
      if (sort === 'terbaru')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return b.sold - a.sold
    })
    return list
  }, [products, categories, search, q, cats, brands, maxPrice, onlyAvailable, rxOnly, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const activeFilters =
    cats.length + brands.length + (onlyAvailable ? 1 : 0) + (rxOnly ? 1 : 0) + (maxPrice < priceCap ? 1 : 0)

  const resetFilters = () => {
    setCats([])
    setBrands([])
    setOnlyAvailable(false)
    setRxOnly(false)
    setMaxPrice(priceCap)
    setSort('populer')
    setSearch('')
    setParams({})
  }

  const toggle = (value: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-bold">Kategori</h3>
        <div className="mt-2.5 space-y-2">
          {categories.map((cat) => (
            <label key={cat.slug} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={cats.includes(cat.slug)}
                onChange={() => toggle(cat.slug, cats, setCats)}
                className="h-4 w-4 rounded border-primary/30 accent-primary"
              />
              <span className="flex-1">{cat.name}</span>
              <span className="text-xs text-muted">
                {products.filter((p) => p.category === cat.slug).length}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-bold">Rentang harga</h3>
        <p className="mt-1 text-xs text-muted">
          Maksimal {formatIDR(maxPrice)}
        </p>
        <input
          type="range"
          min={10000}
          max={priceCap}
          step={5000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="mt-3 w-full accent-primary"
          aria-label="Harga maksimum"
        />
        <div className="flex justify-between text-[11px] text-muted">
          <span>{formatIDR(10000)}</span>
          <span>{formatIDR(priceCap)}</span>
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-bold">Merek</h3>
        <div className="mt-2.5 max-h-44 space-y-2 overflow-y-auto pr-1">
          {allBrands.map((brand) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={brands.includes(brand)}
                onChange={() => toggle(brand, brands, setBrands)}
                className="h-4 w-4 rounded border-primary/30 accent-primary"
              />
              <span className="flex-1 truncate">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-bold">Ketersediaan</h3>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Hanya produk tersedia
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={rxOnly}
            onChange={(e) => setRxOnly(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Memerlukan resep
        </label>
      </div>

      <Button variant="soft" size="sm" className="w-full" onClick={resetFilters}>
        <RotateCcw className="h-3.5 w-3.5" /> Reset filter
      </Button>
    </div>
  )

  return (
    <div className="page-container pt-6 sm:pt-8">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link to="/" className="hover:text-primary-dark">Beranda</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-ink">Toko</span>
      </nav>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Katalog produk</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {filtered.length} produk tersedia
            {q ? ` untuk pencarian “${q}”` : ''}. Gunakan filter untuk mempersempit pilihan.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="shop-search" className="sr-only">Cari produk</label>
            <input
              id="shop-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk atau merek…"
              className="input-clay w-full pl-10 sm:w-64"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Urutkan produk"
              className="sm:w-44"
            >
              <option value="populer">Paling populer</option>
              <option value="termurah">Harga terendah</option>
              <option value="termahal">Harga tertinggi</option>
              <option value="terbaru">Terbaru</option>
            </Select>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="btn-soft shrink-0 px-4 py-2.5 text-xs lg:hidden"
            >
              <Filter className="h-4 w-4" /> Filter
              {activeFilters > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-white">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="clay sticky top-28 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter
              </h2>
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            {filterPanel}
          </div>
        </aside>

        <div>
          {activeFilters > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {cats.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(c, cats, setCats)}
                  className="chip bg-primary-soft text-primary-dark normal-case tracking-normal"
                >
                  {categories.find((x) => x.slug === c)?.name ?? c}
                  <X className="h-3 w-3" />
                </button>
              ))}
              {brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggle(b, brands, setBrands)}
                  className="chip bg-white text-ink shadow-clay-sm normal-case tracking-normal"
                >
                  {b} <X className="h-3 w-3" />
                </button>
              ))}
              {maxPrice < priceCap && (
                <button
                  type="button"
                  onClick={() => setMaxPrice(priceCap)}
                  className="chip bg-white text-ink shadow-clay-sm normal-case tracking-normal"
                >
                  ≤ {formatIDR(maxPrice)} <X className="h-3 w-3" />
                </button>
              )}
              {onlyAvailable && (
                <button
                  type="button"
                  onClick={() => setOnlyAvailable(false)}
                  className="chip bg-mint/70 text-success normal-case tracking-normal"
                >
                  Tersedia <X className="h-3 w-3" />
                </button>
              )}
              {rxOnly && (
                <button
                  type="button"
                  onClick={() => setRxOnly(false)}
                  className="chip bg-blush/70 text-ink normal-case tracking-normal"
                >
                  Resep <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="clay space-y-3 p-4">
                  <Skeleton className="h-36 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-7 w-1/2" />
                  <Skeleton className="h-9 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : current.length > 0 ? (
            <>
              <ProductGrid products={current} />
              <div className="mt-8">
                <Pagination page={page} pages={pages} onChange={setPage} />
                <p className="mt-3 text-center text-xs text-muted">
                  Menampilkan {current.length} dari {filtered.length} produk
                </p>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="Produk tidak ditemukan"
              description="Coba ubah kata kunci atau longgarkan filter yang dipilih untuk melihat lebih banyak produk."
              action={
                <Button onClick={resetFilters} size="sm">
                  <RotateCcw className="h-4 w-4" /> Reset filter
                </Button>
              }
            />
          )}
        </div>
      </div>

      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter produk"
        size="sm"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button size="sm" onClick={() => setFilterOpen(false)}>
              Tampilkan {filtered.length} produk
            </Button>
          </>
        }
      >
        <div className={cx('max-h-[55vh] overflow-y-auto pr-1')}>{filterPanel}</div>
      </Modal>
    </div>
  )
}
