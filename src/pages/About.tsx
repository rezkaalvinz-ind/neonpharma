import { Link } from 'react-router-dom'
import { HandHeart, Leaf, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { SectionHeading } from '@/components/ui'

export default function About() {
  return (
    <div className="page-container pt-8 sm:pt-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link to="/" className="hover:text-primary-dark">Beranda</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-ink">Tentang</span>
      </nav>

      <section className="mt-5 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="chip bg-white text-primary-dark shadow-clay-sm">
            <Sparkles className="h-3.5 w-3.5" /> Sejak 2021
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            Apotek digital yang tumbuh dari kepedulian kecil.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            NEON PHARMA lahir dari satu keyakinan sederhana: mendapatkan obat dan produk
            kesehatan seharusnya tidak membingungkan. Kami menggabungkan layanan apotek
            konvensional dengan pengalaman belanja digital yang hangat, jelas, dan dapat
            dipercaya.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Setiap produk melewati pemeriksaan ketersediaan dan penyimpanan. Obat resep tidak
            pernah diproses tanpa verifikasi apoteker berlisensi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/shop" className="btn-clay px-6 py-3">Lihat produk</Link>
            <Link to="/contact" className="btn-soft px-6 py-3">Hubungi kami</Link>
          </div>
        </div>

        <div className="clay-lg relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-primary-soft blur-2xl" />
          <div className="relative grid grid-cols-2 gap-3">
            {[
              { emoji: '💊', label: 'Obat', tone: 'bg-primary-soft' },
              { emoji: '🍊', label: 'Vitamin', tone: 'bg-mint/60' },
              { emoji: '🧴', label: 'Skincare', tone: 'bg-blush/60' },
              { emoji: '🩺', label: 'Alat kesehatan', tone: 'bg-sky/60' },
            ].map((item) => (
              <div key={item.label} className={`${item.tone} rounded-3xl p-4 shadow-clay-in`}>
                <span className="text-3xl" aria-hidden>{item.emoji}</span>
                <p className="mt-2 font-display text-xs font-bold">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="clay-sm mt-3 flex items-center gap-3 p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-mint/70 text-success">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <p className="text-[11px] leading-snug text-muted">
              Diawasi apoteker berlisensi dan bekerja sama dengan distributor resmi.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          { value: '12.400+', label: 'Pelanggan terlayani' },
          { value: '6 kategori', label: 'Produk kesehatan' },
          { value: '4.8/5', label: 'Rata-rata rating' },
        ].map((stat) => (
          <div key={stat.label} className="clay p-6 text-center">
            <p className="font-display text-3xl font-extrabold text-primary-dark">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Nilai kami"
          title="Cara kami menjaga kepercayaan"
          description="Tiga prinsip yang menjadi dasar setiap keputusan di NEON PHARMA."
        />
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: HandHeart,
              title: 'Peduli lebih dulu',
              text: 'Kami menjelaskan produk dengan bahasa yang mudah dipahami, termasuk peringatan dan aturan pakainya.',
              tone: 'bg-blush/70 text-ink',
            },
            {
              icon: ShieldCheck,
              title: 'Aman dan sesuai aturan',
              text: 'Obat resep diverifikasi apoteker, stok dicatat rapi, dan produk disimpan sesuai standar.',
              tone: 'bg-primary-soft text-primary-dark',
            },
            {
              icon: Leaf,
              title: 'Sederhana dan nyaman',
              text: 'Antarmuka yang bersih, alur checkout singkat, dan informasi status pesanan yang jelas.',
              tone: 'bg-mint/60 text-success',
            },
          ].map((v) => (
            <div key={v.title} className="clay p-6">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl shadow-clay-sm ${v.tone}`}>
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="clay-lg grid gap-6 p-6 sm:p-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="chip bg-primary-soft text-primary-dark">
              <Users className="h-3.5 w-3.5" /> Tim apotek
            </span>
            <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
              Didampingi apoteker, bukan sekadar mesin.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Tim kami terdiri dari apoteker dan tenaga kefarmasian yang memeriksa resep,
              menjawab pertanyaan produk, serta memastikan setiap pesanan sesuai kebutuhan
              pelanggan. Pertanyaan medis mendesak tetap harus diarahkan ke fasilitas
              kesehatan terdekat.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { name: 'apt. Bimo Saputra', role: 'Apoteker Penanggung Jawab', emoji: '👨‍⚕️', tone: 'bg-sky/60' },
              { name: 'apt. Rani Puspita', role: 'Apoteker Layanan Resep', emoji: '👩‍⚕️', tone: 'bg-blush/60' },
              { name: 'Nadia Rahma', role: 'Tenaga Kefarmasian', emoji: '🧑‍🔬', tone: 'bg-mint/60' },
              { name: 'Rangga Admin', role: 'Operasional Apotek', emoji: '🧑‍💼', tone: 'bg-primary-soft' },
            ].map((person) => (
              <div key={person.name} className="clay-sm flex items-center gap-3 p-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl ${person.tone}`} aria-hidden>
                  {person.emoji}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-xs font-bold">{person.name}</p>
                  <p className="truncate text-[11px] text-muted">{person.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
