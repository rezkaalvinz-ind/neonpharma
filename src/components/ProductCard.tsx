import { Link } from 'react-router-dom'
import { Heart, Plus, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { useCatalog, useCommerce } from '@/lib/store'
import { cx, discountPercent, formatIDR } from '@/lib/utils'

export function ProductVisual({
  product,
  size = 'md',
  className,
}: {
  product: Pick<Product, 'emoji' | 'tone' | 'name'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizing =
    size === 'sm' ? 'h-14 w-14 text-2xl' : size === 'lg' ? 'h-64 text-[96px]' : 'h-36 text-6xl'
  return (
    <div
      className={cx(
        'relative grid place-items-center overflow-hidden rounded-3xl',
        product.tone,
        sizing,
        className,
      )}
      aria-hidden
    >
      <span className="absolute -left-6 -top-8 h-20 w-20 rounded-full bg-white/40 blur-md" />
      <span className="absolute -bottom-8 -right-4 h-24 w-24 rounded-full bg-white/30 blur-md" />
      <span className="relative drop-shadow-[2px_6px_10px_rgba(41,36,58,0.18)]">
        {product.emoji}
      </span>
    </div>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useCommerce((s) => s.addToCart)
  const wishlist = useCommerce((s) => s.wishlist)
  const toggleWishlist = useCommerce((s) => s.toggleWishlist)
  const categories = useCatalog((s) => s.categories)
  const liked = wishlist.includes(product.id)
  const off = discountPercent(product.price, product.originalPrice)
  const category = categories.find((c) => c.slug === product.category)

  const handleAdd = () => {
    addToCart(product.id, 1)
    toast.success(`${product.name} ditambahkan ke keranjang`)
  }

  return (
    <article className="clay clay-hover group flex h-full flex-col p-3 sm:p-4">
      <div className="relative">
        <Link
          to={`/product/${product.id}`}
          className="block rounded-3xl focus-visible:outline-offset-4"
          aria-label={`Lihat detail ${product.name}`}
        >
          <ProductVisual product={product} />
        </Link>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {off > 0 && (
            <span className="chip bg-error text-white">-{off}%</span>
          )}
          {product.requiresPrescription && (
            <span className="chip bg-white/90 text-primary-dark">Resep</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            toggleWishlist(product.id)
            toast(liked ? 'Dihapus dari wishlist' : 'Disimpan ke wishlist', {
              icon: '💜',
            })
          }}
          aria-label={liked ? `Hapus ${product.name} dari wishlist` : `Simpan ${product.name} ke wishlist`}
          aria-pressed={liked}
          className={cx(
            'absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full transition',
            liked ? 'bg-primary text-white shadow-clay-btn' : 'bg-white/90 text-muted hover:text-primary',
          )}
        >
          <Heart className={cx('h-4 w-4', liked && 'fill-current')} />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span className="truncate">{product.brand}</span>
          <span className="shrink-0 text-primary">{category?.short ?? 'Lainnya'}</span>
        </div>
        <Link
          to={`/product/${product.id}`}
          className="mt-1 line-clamp-2 font-display text-sm font-bold leading-snug text-ink transition-colors hover:text-primary-dark sm:text-base"
        >
          {product.name}
        </Link>

        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
          <span className="text-amber-500">★</span>
          <span className="font-semibold text-ink">{product.rating.toFixed(1)}</span>
          <span>({product.reviews})</span>
          <span className="ml-auto inline-flex items-center gap-1">
            <ShoppingBag className="h-3 w-3" /> {product.sold}
          </span>
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-end gap-2">
            <span className="font-display text-base font-extrabold text-ink sm:text-lg">
              {formatIDR(product.price)}
            </span>
            {product.originalPrice && (
              <span className="pb-0.5 text-xs text-muted line-through">
                {formatIDR(product.originalPrice)}
              </span>
            )}
          </div>
          <p
            className={cx(
              'mt-1 text-[11px] font-semibold',
              product.stock === 0
                ? 'text-error'
                : product.stock <= 10
                  ? 'text-warning'
                  : 'text-success',
            )}
          >
            {product.stock === 0
              ? 'Stok habis'
              : product.stock <= 10
                ? `Stok terbatas · ${product.stock} tersisa`
                : 'Stok tersedia'}
          </p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="btn-clay mt-3 w-full px-4 py-2.5 text-xs"
            aria-label={`Tambahkan ${product.name} ke keranjang`}
          >
            <Plus className="h-4 w-4" />
            {product.stock === 0 ? 'Stok Habis' : 'Tambah'}
          </button>
        </div>
      </div>
    </article>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
