import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  User as UserIcon,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth, useCatalog, useCommerce, useCurrentUser } from '@/lib/store'
import { cx, formatIDR } from '@/lib/utils'
import { ProductVisual } from './ProductCard'

const navLinks = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/shop', label: 'Toko' },
  { to: '/categories', label: 'Kategori' },
  { to: '/about', label: 'Tentang' },
  { to: '/contact', label: 'Kontak' },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="NEON PHARMA beranda">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white"
        style={{
          backgroundImage: 'linear-gradient(145deg, #A78BFA 0%, #8B5CF6 60%, #7C4CE0 100%)',
          boxShadow:
            '0 8px 16px rgba(139,92,246,0.35), inset 0 2px 3px rgba(255,255,255,0.5), inset 0 -4px 8px rgba(85,40,170,0.25)',
        }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="3.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-base font-extrabold tracking-tight text-ink">
          NEON <span className="text-primary">PHARMA</span>
        </span>
        <span className="mt-0.5 block text-[10px] font-medium tracking-wide text-muted">
          Your Health, Our Little Care.
        </span>
      </span>
    </Link>
  )
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [term, setTerm] = useState('')
  const navigate = useNavigate()
  const products = useCatalog((s) => s.products)
  const categories = useCatalog((s) => s.categories)
  const recent = useCommerce((s) => s.recentSearches)
  const addRecent = useCommerce((s) => s.addRecentSearch)
  const clearRecent = useCommerce((s) => s.clearRecentSearches)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = useMemo(() => {
    const q = term.trim().toLowerCase()
    if (q.length < 2) return []
    return products
      .filter((p) =>
        [p.name, p.brand, p.category, ...categories.filter((c) => c.slug === p.category).map((c) => c.name)]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 5)
  }, [term, products])

  const submit = (value: string) => {
    const q = value.trim()
    if (!q) return
    addRecent(q)
    onClose()
    navigate(`/shop?q=${encodeURIComponent(q)}`)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/35 p-4 pt-20 backdrop-blur-sm sm:pt-28"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="clay-lg w-full max-w-2xl animate-pop-in p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Pencarian produk"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(term)
          }}
          className="flex items-center gap-3"
        >
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search medicines, vitamins, and healthcare products..."
            aria-label="Cari produk"
            className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted/80"
          />
          <button type="button" onClick={onClose} aria-label="Tutup pencarian" className="rounded-full p-1.5 text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-3 border-t border-primary/10 pt-3">
          {results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      addRecent(term)
                      onClose()
                      navigate(`/product/${p.id}`)
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-primary-soft/60"
                  >
                    <ProductVisual product={p} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-sm font-bold">{p.name}</span>
                      <span className="block text-xs text-muted">
                        {p.brand} · {p.stock > 0 ? 'Stok tersedia' : 'Stok habis'}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-sm font-bold text-primary-dark">
                      {formatIDR(p.price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : term.trim().length >= 2 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">
              Tidak ada produk yang cocok dengan “{term}”.
            </p>
          ) : (
            <div className="space-y-3 px-1 pb-1">
              <div className="flex items-center justify-between">
                <p className="font-display text-xs font-bold uppercase tracking-wide text-muted">
                  Pencarian terakhir
                </p>
                {recent.length > 0 && (
                  <button type="button" onClick={clearRecent} className="text-xs font-semibold text-primary hover:underline">
                    Hapus
                  </button>
                )}
              </div>
              {recent.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => submit(r)}
                      className="chip bg-cream text-ink normal-case tracking-normal hover:bg-primary-soft"
                    >
                      <Search className="h-3 w-3" /> {r}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Mulai cari obat, vitamin, atau merek favoritmu.
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {categories.slice(0, 4).map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(`/shop?category=${c.slug}`)
                    }}
                    className="chip bg-primary-soft text-primary-dark normal-case tracking-normal"
                  >
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const user = useCurrentUser()
  const logout = useAuth((s) => s.logout)
  const notifications = useCommerce((s) => s.notifications)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) {
    return (
      <Link
        to="/login"
        className="hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 font-display text-xs font-bold text-ink shadow-clay-sm transition hover:text-primary-dark sm:inline-flex"
      >
        <UserIcon className="h-4 w-4" /> Masuk
      </Link>
    )
  }

  const unread = notifications.filter((n) => n.userId === user.id && !n.read).length
  const isStaff = user.role !== 'customer'

  const items = [
    { to: '/profile', label: 'Profil saya', icon: UserIcon },
    { to: '/orders', label: 'Riwayat pesanan', icon: Package },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/notifications', label: 'Notifikasi', icon: Bell },
  ]

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-clay-sm transition hover:shadow-clay"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft font-display text-xs font-bold text-primary-dark">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[96px] truncate font-display text-xs font-bold">
          {user.name.split(' ')[0]}
        </span>
        {unread > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
        <ChevronDown className={cx('h-3.5 w-3.5 text-muted transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          role="menu"
          className="clay absolute right-0 top-12 w-60 animate-pop-in p-2"
        >
          <div className="px-3 py-2">
            <p className="truncate font-display text-sm font-bold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-primary/10" />
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-primary-soft/70"
            >
              <item.icon className="h-4 w-4 text-primary" /> {item.label}
            </Link>
          ))}
          {isStaff && (
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-primary-soft/70"
            >
              <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard apotek
            </Link>
          )}
          <div className="my-1 h-px bg-primary/10" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              logout()
              setOpen(false)
              toast.success('Kamu telah keluar')
              navigate('/')
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-error transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const cart = useCommerce((s) => s.cart)
  const wishlist = useCommerce((s) => s.wishlist)
  const user = useCurrentUser()
  const logout = useAuth((s) => s.logout)
  const cartCount = cart.reduce((acc, l) => acc + l.qty, 0)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <div className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-4">
        <header className="page-container">
          <div className="clay flex items-center gap-2 rounded-full px-3 py-2 sm:gap-4 sm:px-5">
            <Logo />

            <nav aria-label="Navigasi utama" className="ml-4 hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cx(
                      'rounded-full px-3.5 py-2 font-display text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-primary-soft text-primary-dark'
                        : 'text-muted hover:bg-cream hover:text-ink',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 rounded-full bg-cream px-3 py-2.5 text-muted transition hover:text-primary-dark sm:w-56 sm:justify-start lg:w-64"
                aria-label="Cari produk"
              >
                <Search className="h-4 w-4 shrink-0" />
                <span className="hidden truncate text-xs sm:inline">Cari obat atau vitamin…</span>
              </button>

              <Link
                to="/wishlist"
                aria-label={`Wishlist, ${wishlist.length} produk`}
                className="relative hidden place-items-center rounded-full bg-white p-2.5 text-muted shadow-clay-sm transition hover:text-primary sm:grid"
              >
                <Heart className="h-4 w-4" />
                {wishlist.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-blush px-1 text-[10px] font-bold text-ink">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                aria-label={`Keranjang, ${cartCount} item`}
                className="relative grid place-items-center rounded-full bg-primary-soft p-2.5 text-primary-dark transition hover:bg-primary hover:text-white"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              <ProfileMenu />

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="grid place-items-center rounded-full bg-white p-2.5 text-ink shadow-clay-sm lg:hidden"
                aria-label="Buka menu navigasi"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}

      {mobileOpen && (
        <div className="fixed inset-0 z-[65] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            role="presentation"
          />
          <div className="clay-lg absolute right-3 top-3 bottom-3 flex w-[min(88vw,360px)] animate-pop-in flex-col overflow-y-auto p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full bg-cream p-2 text-muted"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {user ? (
              <div className="clay-sm mt-5 flex items-center gap-3 p-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-dark">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-clay flex-1 px-4 py-2.5 text-xs">
                  Masuk
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-soft flex-1 px-4 py-2.5 text-xs">
                  Daftar
                </Link>
              </div>
            )}

            <nav aria-label="Navigasi mobile" className="mt-5 flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cx(
                      'rounded-2xl px-4 py-3 font-display text-sm font-semibold transition',
                      isActive ? 'bg-primary-soft text-primary-dark' : 'text-ink hover:bg-cream',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="my-4 h-px bg-primary/10" />

            <div className="flex flex-col gap-1">
              {[
                { to: '/cart', label: `Keranjang (${cartCount})`, icon: ShoppingCart },
                { to: '/wishlist', label: 'Wishlist', icon: Heart },
                { to: '/orders', label: 'Pesanan saya', icon: Package },
                { to: '/notifications', label: 'Notifikasi', icon: Bell },
                { to: '/profile', label: 'Profil', icon: UserIcon },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-ink transition hover:bg-cream"
                >
                  <item.icon className="h-4 w-4 text-primary" /> {item.label}
                </Link>
              ))}
              {user && user.role !== 'customer' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-ink transition hover:bg-cream"
                >
                  <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard apotek
                </Link>
              )}
            </div>

            {user && (
              <>
                <div className="my-4 h-px bg-primary/10" />
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setMobileOpen(false)
                    toast.success('Kamu telah keluar')
                  }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-error transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </>
            )}

            <div className="mt-auto pt-6">
              <div className="clay-inset rounded-2xl p-4">
                <p className="font-display text-sm font-bold">Butuh bantuan?</p>
                <p className="mt-1 text-xs text-muted">
                  Apoteker kami siap membantu setiap hari, 08.00–22.00 WIB.
                </p>
                <Link
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 inline-block text-xs font-bold text-primary link-underline"
                >
                  Hubungi kami
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
