import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/ui'
import { useCatalog } from '@/lib/store'
import { cx, formatIDR } from '@/lib/utils'

export default function CategoriesPage() {
  const products = useCatalog((s) => s.products)
  const categories = useCatalog((s) => s.categories)

  return (
    <div className="page-container pt-7 sm:pt-10">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link to="/" className="hover:text-primary-dark">Beranda</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-ink">Kategori</span>
      </nav>

      <div className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Jelajahi kategori</h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Semua kebutuhan kesehatan tersusun dalam kategori yang mudah ditemukan. Pilih
          kategori untuk melihat produknya.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const items = products.filter((p) => p.category === cat.slug)
          const from = items.length ? Math.min(...items.map((p) => p.price)) : 0
          const rx = items.filter((p) => p.requiresPrescription).length
          return (
            <Link
              key={cat.slug}
              to={`/shop?category=${cat.slug}`}
              className="clay clay-hover group flex flex-col p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <span
                  className={cx(
                    'grid h-20 w-20 shrink-0 place-items-center rounded-3xl text-4xl shadow-clay-sm transition-transform group-hover:-translate-y-1',
                    cat.tone,
                  )}
                  aria-hidden
                >
                  {cat.emoji}
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold">{cat.name}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{cat.blurb}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="clay-inset rounded-xl px-2 py-2">
                  <p className="font-display text-sm font-extrabold">{items.length}</p>
                  <p className="text-[10px] text-muted">Produk</p>
                </div>
                <div className="clay-inset rounded-xl px-2 py-2">
                  <p className="font-display text-sm font-extrabold">{rx}</p>
                  <p className="text-[10px] text-muted">Perlu resep</p>
                </div>
                <div className="clay-inset rounded-xl px-2 py-2">
                  <p className="truncate font-display text-[11px] font-extrabold">
                    {from ? formatIDR(from) : '—'}
                  </p>
                  <p className="text-[10px] text-muted">Mulai dari</p>
                </div>
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 font-display text-xs font-bold text-primary">
                Lihat produk <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          )
        })}
      </div>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Bantuan"
          title="Belum yakin harus mulai dari mana?"
          description="Tim apoteker kami dapat membantu merekomendasikan kategori yang sesuai dengan kebutuhanmu."
          action={
            <Link to="/contact" className="btn-clay px-5 py-2.5 text-xs">
              Tanya apoteker
            </Link>
          }
        />
      </section>
    </div>
  )
}
