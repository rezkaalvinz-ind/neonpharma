import { Link } from 'react-router-dom'
import { Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react'
import { useCatalog } from '@/lib/store'

export default function Footer() {
  const categories = useCatalog((s) => s.categories)
  return (
    <footer className="mt-16 px-3 pb-4 sm:px-4 sm:mt-24">
      <div className="page-container">
        <div className="clay-lg overflow-hidden p-6 sm:p-10">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className="grid h-10 w-10 place-items-center rounded-2xl"
                  style={{
                    backgroundImage:
                      'linear-gradient(145deg, #A78BFA 0%, #8B5CF6 60%, #7C4CE0 100%)',
                    boxShadow:
                      '0 8px 16px rgba(139,92,246,0.32), inset 0 2px 3px rgba(255,255,255,0.5)',
                  }}
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="3.4" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-display text-lg font-extrabold">
                  NEON <span className="text-primary">PHARMA</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
                Apotek digital yang membantu kamu mendapatkan obat dan produk kesehatan
                terpercaya dengan pengalaman belanja yang nyaman.
              </p>
              <p className="mt-3 font-display text-sm font-bold text-primary-dark">
                Your Health, Our Little Care.
              </p>
              <div className="mt-5 flex gap-2">
                {[
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Twitter, label: 'Twitter' },
                  { icon: Youtube, label: 'YouTube' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white text-muted shadow-clay-sm transition hover:-translate-y-0.5 hover:text-primary"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                Tautan cepat
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted">
                {[
                  { to: '/shop', label: 'Belanja' },
                  { to: '/categories', label: 'Kategori' },
                  { to: '/about', label: 'Tentang kami' },
                  { to: '/contact', label: 'Kontak' },
                  { to: '/orders', label: 'Lacak pesanan' },
                ].map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="transition hover:text-primary-dark">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                Kategori produk
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to={`/shop?category=${c.slug}`}
                      className="transition hover:text-primary-dark"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                Hubungi kami
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li className="flex gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Jl. Kesehatan Raya No. 88, Bandung, Jawa Barat 40131
                </li>
                <li className="flex gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href="tel:+622212345678" className="hover:text-primary-dark">
                    (022) 1234-5678
                  </a>
                </li>
                <li className="flex gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href="mailto:halo@neonpharma.id" className="hover:text-primary-dark">
                    halo@neonpharma.id
                  </a>
                </li>
              </ul>
              <div className="clay-inset mt-4 rounded-2xl p-3">
                <p className="font-display text-xs font-bold text-ink">Jam operasional</p>
                <p className="mt-1 text-xs text-muted">Senin–Minggu, 08.00–22.00 WIB</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-primary/10 pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} NEON PHARMA. Seluruh hak cipta dilindungi.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link to="/privacy" className="hover:text-primary-dark">Kebijakan Privasi</Link>
              <Link to="/terms" className="hover:text-primary-dark">Syarat & Ketentuan</Link>
              <span>Nomor Izin Apotek: SIPA/2025/0088</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
