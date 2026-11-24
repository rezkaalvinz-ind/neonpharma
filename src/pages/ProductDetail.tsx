import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  FileCheck2,
  Heart,
  Info,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProductGrid, ProductVisual } from '@/components/ProductCard'
import { Badge, Button, SectionHeading } from '@/components/ui'
import { useCatalog, useCommerce } from '@/lib/store'
import { cx, discountPercent, formatIDR } from '@/lib/utils'
import NotFound from './NotFound'

const tones = ['bg-primary-soft', 'bg-mint/60', 'bg-blush/60', 'bg-sky/60']

export default function ProductDetail() {
  const { id } = useParams()
  const products = useCatalog((s) => s.products)
  const categories = useCatalog((s) => s.categories)
  const addToCart = useCommerce((s) => s.addToCart)
  const wishlist = useCommerce((s) => s.wishlist)
  const toggleWishlist = useCommerce((s) => s.toggleWishlist)
  const navigate = useNavigate()

  const product = products.find((p) => p.id === id)
  const [qty, setQty] = useState(1)
  const [activeTone, setActiveTone] = useState(0)
  const [tab, setTab] = useState<'deskripsi' | 'komposisi' | 'penggunaan' | 'peringatan'>('deskripsi')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setQty(1)
    setActiveTone(0)
  }, [id])

  const related = useMemo(
    () =>
      products
        .filter((p) => p.id !== id && p.category === product?.category)
        .slice(0, 4),
    [products, id, product?.category],
  )

  if (!product) return <NotFound />

  const category = categories.find((c) => c.slug === product.category)
  const off = discountPercent(product.price, product.originalPrice)
  const liked = wishlist.includes(product.id)
  const maxQty = Math.max(1, Math.min(product.stock, 10))

  const handleAdd = () => {
    addToCart(product.id, qty)
    toast.success(`${qty} × ${product.name} ditambahkan ke keranjang`)
  }

  const handleBuyNow = () => {
    addToCart(product.id, qty)
    navigate('/checkout')
  }

  const tabs = [
    { id: 'deskripsi', label: 'Deskripsi' },
    { id: 'komposisi', label: 'Komposisi' },
    { id: 'penggunaan', label: 'Aturan pakai' },
    { id: 'peringatan', label: 'Peringatan' },
  ] as const

  return (
    <div className="page-container pt-6 sm:pt-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted">
        <Link to="/" className="hover:text-primary-dark">Beranda</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" className="hover:text-primary-dark">Toko</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/shop?category=${product.category}`} className="hover:text-primary-dark">
          {category?.name ?? 'Kategori'}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate font-semibold text-ink">{product.name}</span>
      </nav>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr] xl:gap-10">
        {/* GALLERY */}
        <div>
          <div className="clay p-3 sm:p-4">
            <div
              className={cx(
                'relative grid aspect-square place-items-center overflow-hidden rounded-clay',
                tones[activeTone],
              )}
            >
              <span className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/40 blur-lg" />
              <span className="absolute -bottom-12 -right-6 h-40 w-40 rounded-full bg-white/30 blur-lg" />
              <span
                className="relative text-[112px] drop-shadow-[4px_10px_16px_rgba(41,36,58,0.2)] sm:text-[150px]"
                aria-hidden
              >
                {product.emoji}
              </span>
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {off > 0 && <Badge tone="bg-error text-white">Diskon {off}%</Badge>}
                {product.requiresPrescription && (
                  <Badge tone="bg-white text-primary-dark">Perlu resep</Badge>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {tones.map((tone, i) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setActiveTone(i)}
                  aria-label={`Tampilan produk ${i + 1}`}
                  aria-pressed={activeTone === i}
                  className={cx(
                    'grid h-16 place-items-center rounded-2xl text-2xl transition sm:h-20',
                    tone,
                    activeTone === i
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-white'
                      : 'opacity-80 hover:opacity-100',
                  )}
                >
                  {product.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="clay-sm flex items-center gap-2.5 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint/70 text-success">
                <Truck className="h-4 w-4" />
              </span>
              <p className="text-[11px] leading-snug text-muted">
                Gratis ongkir belanja <span className="font-bold text-ink">min. Rp150.000</span>
              </p>
            </div>
            <div className="clay-sm flex items-center gap-2.5 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-dark">
                <Check className="h-4 w-4" />
              </span>
              <p className="text-[11px] leading-snug text-muted">
                Produk dari <span className="font-bold text-ink">distributor resmi</span>
              </p>
            </div>
          </div>
        </div>

        {/* INFO */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="bg-primary-soft text-primary-dark">{product.brand}</Badge>
            <Badge tone="bg-cream text-muted">{category?.name ?? 'Lainnya'}</Badge>
            {product.stock > 0 ? (
              <Badge tone="bg-mint/70 text-success">Stok {product.stock}</Badge>
            ) : (
              <Badge tone="bg-red-100 text-error">Stok habis</Badge>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <span className="text-amber-500">★</span>
              <span className="font-display font-bold">{product.rating.toFixed(1)}</span>
              <span className="text-muted">({product.reviews} ulasan)</span>
            </span>
            <span className="text-muted">·</span>
            <span className="text-muted">{product.sold} terjual</span>
          </div>

          <div className="clay-inset mt-5 rounded-3xl p-4">
            <div className="flex flex-wrap items-end gap-3">
              <span className="font-display text-3xl font-extrabold text-primary-dark">
                {formatIDR(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="pb-1 text-sm text-muted line-through">
                    {formatIDR(product.originalPrice)}
                  </span>
                  <span className="mb-1 chip bg-error text-white">
                    Hemat {formatIDR(product.originalPrice - product.price)}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">Harga sudah termasuk PPN.</p>
          </div>

          {product.requiresPrescription && (
            <div className="mt-4 rounded-3xl border border-primary/25 bg-primary-soft/70 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-primary-dark">
                  <FileCheck2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold">Prescription Required</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Produk ini hanya dapat dibeli dengan resep dokter. Unggah foto resep saat
                    checkout, lalu apoteker kami akan memverifikasi sebelum pesanan diproses.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-clay-sm">
              <button
                type="button"
                onClick={() => setQty((v) => Math.max(1, v - 1))}
                disabled={qty <= 1}
                aria-label="Kurangi jumlah"
                className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-cream disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span aria-live="polite" className="w-8 text-center font-display text-sm font-bold">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((v) => Math.min(maxQty, v + 1))}
                disabled={qty >= maxQty}
                aria-label="Tambah jumlah"
                className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-cream disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-muted">Maks. {maxQty} per transaksi</span>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <Button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="flex-1 py-3.5"
            >
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
            <Button
              variant="soft"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 py-3.5"
            >
              Buy Now
            </Button>
          </div>
          <button
            type="button"
            onClick={() => {
              toggleWishlist(product.id)
              toast(liked ? 'Dihapus dari wishlist' : 'Ditambahkan ke wishlist', { icon: '💜' })
            }}
            aria-pressed={liked}
            className="btn-ghost mt-2 w-full"
          >
            <Heart className={cx('h-4 w-4', liked && 'fill-current text-primary')} />
            {liked ? 'Tersimpan di wishlist' : 'Add to Wishlist'}
          </button>

          {/* TABS */}
          <div className="clay mt-6 overflow-hidden">
            <div className="flex overflow-x-auto border-b border-primary/10 hide-scrollbar" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cx(
                    'shrink-0 px-4 py-3 font-display text-xs font-bold transition',
                    tab === t.id
                      ? 'border-b-2 border-primary text-primary-dark'
                      : 'text-muted hover:text-ink',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-4 sm:p-5">
              {tab === 'deskripsi' && (
                <p className="text-sm leading-relaxed text-muted">{product.description}</p>
              )}
              {tab === 'komposisi' && (
                <div className="space-y-3 text-sm leading-relaxed text-muted">
                  <p>
                    <span className="font-display font-bold text-ink">Bahan aktif: </span>
                    {product.ingredients || 'Informasi bahan aktif belum tersedia.'}
                  </p>
                  <p>
                    <span className="font-display font-bold text-ink">Penyimpanan: </span>
                    {product.storage || 'Simpan pada suhu ruang, kering, dan jauh dari sinar matahari.'}
                  </p>
                </div>
              )}
              {tab === 'penggunaan' && (
                <div className="space-y-3 text-sm leading-relaxed text-muted">
                  <p>{product.usage || 'Ikuti petunjuk pada kemasan atau anjuran tenaga kesehatan.'}</p>
                  <p className="rounded-2xl bg-cream p-3 text-xs">
                    <Info className="mr-1 inline h-3.5 w-3.5 text-primary" />
                    Informasi aturan pakai bersifat umum. Untuk dosis yang sesuai kondisimu,
                    konsultasikan dengan dokter atau apoteker.
                  </p>
                </div>
              )}
              {tab === 'peringatan' && (
                <div className="flex gap-3 rounded-2xl bg-amber-50 p-3 text-sm leading-relaxed text-ink/90">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p>{product.warning || 'Baca petunjuk kemasan sebelum digunakan.'}</p>
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Informasi produk disajikan untuk keperluan edukasi dan bukan pengganti konsultasi
            medis. Selalu baca label kemasan dan hubungi tenaga kesehatan bila keluhan berlanjut.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeading
            eyebrow="Rekomendasi"
            title="Produk terkait"
            description={`Produk lain dalam kategori ${category?.name ?? 'ini'}.`}
            action={
              <Link to={`/shop?category=${product.category}`} className="btn-soft px-5 py-2.5 text-xs">
                Lihat kategori
              </Link>
            }
          />
          <div className="mt-5">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  )
}
