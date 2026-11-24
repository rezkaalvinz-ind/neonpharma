import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  FileCheck2,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react'
import { ProductGrid } from '@/components/ProductCard'
import { SectionHeading } from '@/components/ui'
import { useCatalog } from '@/lib/store'
import { testimonials } from '@/lib/seed'
import { cx, formatNumber } from '@/lib/utils'

function HeroArt() {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-lg select-none" aria-hidden>
      <div className="absolute inset-[6%] rounded-[46%_54%_52%_48%/48%_44%_56%_52%] bg-gradient-to-br from-white via-primary-soft to-blush/80 shadow-clay-lg" />
      <div className="absolute inset-[16%] rounded-[54%_46%_44%_56%/52%_56%_44%_48%] bg-white/50 blur-sm" />

      {/* capsule */}
      <div className="absolute left-[6%] top-[10%] flex h-12 w-32 -rotate-[26deg] animate-float overflow-hidden rounded-full bg-white shadow-clay sm:h-14 sm:w-40">
        <div className="h-full w-1/2 bg-gradient-to-br from-primary to-primary-light" />
        <div className="h-full w-1/2 bg-white" />
      </div>

      {/* vitamin bottle */}
      <div className="absolute right-[4%] top-[16%] w-24 animate-float-slow sm:w-28">
        <div className="mx-auto h-5 w-10 rounded-t-lg bg-mint shadow-inner sm:h-6 sm:w-12" />
        <div className="clay grid h-28 w-full place-items-center rounded-[26px] sm:h-32">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-xl text-primary-dark shadow-clay-in sm:h-14 sm:w-14 sm:text-2xl">
            ✚
          </div>
        </div>
      </div>

      {/* medical kit */}
      <div className="clay absolute bottom-[6%] left-[10%] w-32 rounded-3xl p-3 sm:w-40">
        <div className="mx-auto -mt-6 h-3 w-14 rounded-full bg-primary-light shadow-clay-sm" />
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-blush/60 px-3 py-2">
          <span className="text-xl">🩺</span>
          <div className="space-y-1">
            <span className="block h-1.5 w-10 rounded-full bg-white" />
            <span className="block h-1.5 w-7 rounded-full bg-white/70" />
          </div>
        </div>
        <p className="mt-2 text-center font-display text-[10px] font-bold uppercase tracking-wide text-muted">
          First aid kit
        </p>
      </div>

      {/* pills */}
      <div className="absolute bottom-[16%] right-[8%] grid h-16 w-16 rotate-12 place-items-center rounded-2xl bg-white shadow-clay sm:h-20 sm:w-20">
        <span className="text-2xl">💊</span>
      </div>

      {/* floating deco */}
      <div className="absolute left-[46%] top-[2%] grid h-10 w-10 place-items-center rounded-full bg-white text-primary shadow-clay-sm">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="absolute bottom-[4%] right-[34%] h-6 w-6 rounded-full bg-mint shadow-clay-sm" />
      <div className="absolute left-[8%] top-[48%] h-4 w-4 rounded-full bg-primary-light" />

      {/* rating chip */}
      <div className="clay absolute right-[2%] bottom-[34%] flex items-center gap-2 rounded-2xl px-3 py-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-mint/70 text-success">
          <BadgeCheck className="h-4 w-4" />
        </span>
        <span className="leading-tight">
          <span className="block font-display text-[11px] font-bold">Apoteker</span>
          <span className="block text-[10px] text-muted">berlisensi</span>
        </span>
      </div>
    </div>
  )
}

const tabs = [
  { id: 'populer', label: 'Populer' },
  { id: 'terlaris', label: 'Terlaris' },
  { id: 'baru', label: 'Terbaru' },
  { id: 'rekomendasi', label: 'Rekomendasi' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function Home() {
  const products = useCatalog((s) => s.products)
  const categories = useCatalog((s) => s.categories)
  const [tab, setTab] = useState<TabId>('populer')
  const [term, setTerm] = useState('')
  const navigate = useNavigate()

  const featured = useMemo(() => {
    const list = [...products]
    switch (tab) {
      case 'terlaris':
        return list.sort((a, b) => b.sold - a.sold).slice(0, 8)
      case 'baru':
        return list
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 8)
      case 'rekomendasi':
        return list
          .filter((p) => !p.requiresPrescription)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 8)
      default:
        return list.sort((a, b) => b.rating * b.sold - a.rating * a.sold).slice(0, 8)
    }
  }, [products, tab])

  const catCount = (slug: string) => products.filter((p) => p.category === slug).length

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* HERO */}
      <section className="page-container pt-6 sm:pt-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <div>
            <span className="chip bg-white text-primary-dark shadow-clay-sm">
              <Sparkles className="h-3.5 w-3.5" /> Apotek digital terpercaya
            </span>
            <h1 className="mt-5 text-fluid-hero font-extrabold leading-[1.03]">
              Your Health,
              <br />
              <span className="bg-gradient-to-r from-primary-dark via-primary to-[#B98BF7] bg-clip-text text-transparent">
                Our Little Care.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              Discover trusted healthcare essentials and pharmacy products with a simple
              and comfortable shopping experience.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-clay px-7 py-3.5">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/categories" className="btn-soft px-7 py-3.5">
                Explore Products
              </Link>
            </div>

            <dl className="mt-9 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: 'Produk kesehatan', value: `${formatNumber(products.length)}+` },
                { label: 'Pelanggan puas', value: '12.400+' },
                { label: 'Rating rata-rata', value: '4.8/5' },
              ].map((stat) => (
                <div key={stat.label} className="clay-sm px-3 py-2.5">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-base font-extrabold text-ink">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroArt />
        </div>
      </section>

      {/* SEARCH */}
      <section className="page-container">
        <div className="clay-lg overflow-hidden p-5 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="font-display text-xl font-bold sm:text-2xl">
                Cari kebutuhan kesehatanmu
              </h2>
              <p className="mt-1 text-sm text-muted">
                Cari berdasarkan nama produk, kategori, atau merek.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                navigate(term.trim() ? `/shop?q=${encodeURIComponent(term.trim())}` : '/shop')
              }}
              className="flex w-full items-center gap-2 rounded-full bg-cream p-1.5 shadow-clay-in lg:w-[420px]"
              role="search"
            >
              <Search className="ml-3 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <label htmlFor="home-search" className="sr-only">
                Cari produk kesehatan
              </label>
              <input
                id="home-search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search medicines, vitamins, and healthcare products..."
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted/80"
              />
              <button type="submit" className="btn-clay shrink-0 px-4 py-2.5 text-xs">
                Cari
              </button>
            </form>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">Populer:</span>
            {['Paracetamol', 'Vitamin C', 'Sunscreen', 'Termometer', 'Popok bayi'].map((t) => (
              <Link
                key={t}
                to={`/shop?q=${encodeURIComponent(t)}`}
                className="chip bg-white text-ink shadow-clay-sm normal-case tracking-normal transition hover:text-primary-dark"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="page-container">
        <SectionHeading
          eyebrow="Kategori"
          title="Temukan produk sesuai kebutuhan"
          description="Dari obat harian sampai alat kesehatan, semuanya tersusun rapi dalam kategori yang mudah dijelajahi."
          action={
            <Link to="/categories" className="btn-soft px-5 py-2.5 text-xs">
              Semua kategori <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="mt-7 grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/shop?category=${cat.slug}`}
              className={cx('clay clay-hover group flex flex-col items-center p-4 text-center sm:p-5')}
            >
              <span
                className={cx(
                  'grid h-16 w-16 place-items-center rounded-3xl text-3xl shadow-clay-sm transition-transform group-hover:-translate-y-1 sm:h-20 sm:w-20 sm:text-4xl',
                  cat.tone,
                )}
                aria-hidden
              >
                {cat.emoji}
              </span>
              <span className="mt-3 font-display text-sm font-bold leading-snug">{cat.name}</span>
              <span className="mt-1 text-[11px] text-muted">{catCount(cat.slug)} produk</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="page-container">
        <SectionHeading
          eyebrow="Pilihan untukmu"
          title="Featured products"
          description="Produk favorit pelanggan NEON PHARMA, dipilih dari yang paling sering dibeli."
          action={
            <Link to="/shop" className="btn-soft px-5 py-2.5 text-xs">
              Lihat semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div
          className="mt-6 flex gap-2 overflow-x-auto pb-2 hide-scrollbar"
          role="tablist"
          aria-label="Jenis produk unggulan"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                'shrink-0 rounded-full px-5 py-2.5 font-display text-xs font-bold transition',
                tab === t.id
                  ? 'bg-primary text-white shadow-clay-btn'
                  : 'bg-white text-muted shadow-clay-sm hover:text-primary-dark',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-5">
          <ProductGrid products={featured} />
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="page-container">
        <div className="relative overflow-hidden rounded-clay-lg bg-gradient-to-br from-primary via-[#9A6BF0] to-[#7C4CE0] p-6 shadow-clay-lg sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-mint/25 blur-2xl" />
          <div className="relative grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <span className="chip bg-white/20 text-white">
                <Star className="h-3.5 w-3.5 fill-current" /> Promo bulan ini
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                Take Care of Yourself
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">
                Discover everyday healthcare essentials. Gunakan kode{' '}
                <span className="font-display font-bold text-white">NEON10</span> untuk diskon
                10% dengan minimum belanja Rp50.000.
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-display text-sm font-bold text-primary-dark shadow-clay-sm transition hover:-translate-y-0.5"
              >
                Explore Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-3 md:justify-end" aria-hidden>
              {[
                { emoji: '💊', className: 'bg-white/90' },
                { emoji: '🧴', className: 'bg-mint/80' },
                { emoji: '🩺', className: 'bg-blush/90' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={cx(
                    'grid h-20 w-20 place-items-center rounded-3xl text-4xl shadow-clay-lg',
                    item.className,
                  )}
                  style={{ transform: `rotate(${i === 1 ? 6 : i === 2 ? -5 : 0}deg)` }}
                >
                  {item.emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="page-container">
        <SectionHeading
          eyebrow="Layanan"
          title="Kenapa berbelanja di NEON PHARMA?"
          description="Kami menjaga setiap langkah, dari pemilihan produk sampai paket tiba di tanganmu."
          align="center"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: 'Produk apotek terpercaya',
              text: 'Seluruh produk berasal dari distributor resmi dan disimpan sesuai standar penyimpanan.',
              tone: 'bg-primary-soft text-primary-dark',
            },
            {
              icon: Lock,
              title: 'Pemesanan aman',
              text: 'Data pesanan dan alamat dilindungi, pembayaran diproses melalui kanal resmi.',
              tone: 'bg-mint/70 text-success',
            },
            {
              icon: FileCheck2,
              title: 'Verifikasi resep',
              text: 'Obat resep diperiksa apoteker sebelum diproses, sesuai ketentuan yang berlaku.',
              tone: 'bg-blush/80 text-ink',
            },
            {
              icon: Truck,
              title: 'Pengiriman mudah',
              text: 'Gratis ongkir untuk belanja minimal Rp150.000 ke seluruh Indonesia.',
              tone: 'bg-sky/70 text-ink',
            },
          ].map((s) => (
            <div key={s.title} className="clay clay-hover flex flex-col p-5 sm:p-6">
              <span className={cx('grid h-12 w-12 place-items-center rounded-2xl shadow-clay-sm', s.tone)}>
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="page-container">
        <SectionHeading
          eyebrow="Testimoni"
          title="Cerita dari pelanggan kami"
          description="Contoh ulasan pelanggan sebagai gambaran pengalaman berbelanja di NEON PHARMA."
        />
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.id} className="clay flex h-full flex-col p-5 sm:p-6">
              <div className="flex items-center gap-1" aria-label={`Rating ${t.rating} dari 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cx(
                      'h-4 w-4',
                      i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-primary/20',
                    )}
                  />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/90">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className={cx('grid h-10 w-10 place-items-center rounded-full text-lg shadow-clay-sm', t.tone)}>
                  {t.emoji}
                </span>
                <span>
                  <span className="block font-display text-sm font-bold">{t.name}</span>
                  <span className="block text-xs text-muted">{t.city}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="page-container">
        <div className="clay-lg flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-10">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary-dark shadow-clay-in">
            <Sparkles className="h-6 w-6" />
          </span>
          <h2 className="max-w-xl text-2xl font-extrabold sm:text-3xl">
            Kebutuhan kesehatanmu, satu klik saja.
          </h2>
          <p className="max-w-lg text-sm text-muted">
            Buat akun untuk menyimpan alamat, melacak pesanan, dan mendapatkan penawaran
            khusus pelanggan NEON PHARMA.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-clay px-6 py-3">
              Daftar sekarang
            </Link>
            <Link to="/shop" className="btn-soft px-6 py-3">
              Mulai belanja
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
