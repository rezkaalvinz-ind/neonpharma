import { Link } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import { ProductGrid } from '@/components/ProductCard'
import { EmptyState } from '@/components/ui'
import { useCatalog, useCommerce } from '@/lib/store'

export default function Wishlist() {
  const wishlist = useCommerce((s) => s.wishlist)
  const products = useCatalog((s) => s.products)
  const items = products.filter((p) => wishlist.includes(p.id))

  return (
    <div className="page-container pt-8">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link to="/" className="hover:text-primary-dark">Beranda</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-ink">Wishlist</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Wishlist</h1>
          <p className="mt-1 text-sm text-muted">
            {items.length} produk disimpan untuk nanti.
          </p>
        </div>
        {items.length > 0 && (
          <Link to="/shop" className="btn-soft px-5 py-2.5 text-xs">
            <ShoppingBag className="h-4 w-4" /> Cari produk lain
          </Link>
        )}
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-6 w-6" />}
            title="Wishlist masih kosong"
            description="Tekan ikon hati pada produk untuk menyimpannya di sini dan membelinya nanti."
            action={
              <Link to="/shop" className="btn-clay px-6 py-3">
                Jelajahi produk
              </Link>
            }
          />
        ) : (
          <ProductGrid products={items} />
        )}
      </div>
    </div>
  )
}
