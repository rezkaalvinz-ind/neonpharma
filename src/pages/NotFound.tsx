import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="page-container pt-12">
      <div className="clay-lg mx-auto max-w-lg p-8 text-center sm:p-10">
        <div className="flex justify-center gap-2" aria-hidden>
          {['💊', '🩺', '🧴'].map((emoji, i) => (
            <span
              key={emoji}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-2xl shadow-clay-sm"
              style={{ transform: `rotate(${i === 1 ? 8 : i === 2 ? -8 : 0}deg)` }}
            >
              {emoji}
            </span>
          ))}
        </div>
        <p className="mt-6 font-display text-5xl font-extrabold text-primary">404</p>
        <h1 className="mt-2 font-display text-xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Tautan yang kamu buka mungkin sudah dipindahkan. Coba kembali ke beranda atau cari
          produk yang kamu butuhkan.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link to="/" className="btn-clay px-5 py-2.5 text-xs">
            <Home className="h-4 w-4" /> Beranda
          </Link>
          <Link to="/shop" className="btn-soft px-5 py-2.5 text-xs">
            <Search className="h-4 w-4" /> Cari produk
          </Link>
        </div>
      </div>
    </div>
  )
}
