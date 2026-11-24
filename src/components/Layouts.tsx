import { useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileCheck2,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import Navbar from './Navbar'
import Footer from './Footer'
import { useAuth, useCurrentUser } from '@/lib/store'
import { cx, roleLabel } from '@/lib/utils'
import type { Role } from '@/lib/types'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:font-bold"
      >
        Lewati ke konten utama
      </a>
      <Navbar />
      <main id="main" className="flex-1 pb-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[]
  children?: ReactNode
}) {
  const user = useCurrentUser()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="page-container py-16">
        <div className="clay mx-auto max-w-md p-8 text-center">
          <h1 className="font-display text-xl font-bold">Akses terbatas</h1>
          <p className="mt-2 text-sm text-muted">
            Halaman ini hanya dapat dibuka oleh tim apotek dengan peran yang sesuai.
          </p>
          <Link to="/" className="btn-clay mt-5 px-5 py-2.5 text-xs">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    )
  }

  return <>{children ?? <Outlet />}</>
}

const adminNav: Array<{
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles: Role[]
  end?: boolean
}> = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'pharmacist'], end: true },
  { to: '/admin/products', label: 'Produk', icon: Package, roles: ['admin', 'staff'] },
  { to: '/admin/categories', label: 'Kategori', icon: Layers, roles: ['admin', 'staff'] },
  { to: '/admin/orders', label: 'Pesanan', icon: ClipboardList, roles: ['admin', 'staff'] },
  { to: '/admin/inventory', label: 'Inventori', icon: Boxes, roles: ['admin', 'staff'] },
  { to: '/admin/prescriptions', label: 'Verifikasi Resep', icon: FileCheck2, roles: ['admin', 'pharmacist'] },
  { to: '/admin/customers', label: 'Pelanggan', icon: Users, roles: ['admin', 'staff'] },
  { to: '/admin/reports', label: 'Laporan', icon: BarChart3, roles: ['admin'] },
  { to: '/admin/settings', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useCurrentUser()
  const logout = useAuth((s) => s.logout)
  const location = useLocation()
  if (!user) return null
  const items = adminNav.filter((item) => item.roles.includes(user.role))

  return (
    <div className="flex h-full flex-col">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-1">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{
            backgroundImage: 'linear-gradient(145deg, #A78BFA 0%, #8B5CF6 60%, #7C4CE0 100%)',
            boxShadow: '0 6px 14px rgba(139,92,246,0.32), inset 0 2px 3px rgba(255,255,255,0.5)',
          }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
        </span>
        <span className="font-display text-sm font-extrabold leading-none">
          NEON <span className="text-primary">PHARMA</span>
          <span className="mt-1 block text-[10px] font-medium text-muted">Panel Apotek</span>
        </span>
      </Link>

      <nav aria-label="Navigasi admin" className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 font-display text-sm font-semibold transition',
                isActive
                  ? 'bg-primary text-white shadow-clay-btn'
                  : 'text-muted hover:bg-white hover:text-ink',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 space-y-2 border-t border-primary/10 pt-4">
        <Link
          to="/shop"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 font-display text-sm font-semibold text-muted transition hover:bg-white hover:text-ink"
        >
          <ShoppingBag className="h-4 w-4" /> Lihat toko
        </Link>
        <div className="clay-inset rounded-2xl p-3">
          <p className="truncate font-display text-xs font-bold">{user.name}</p>
          <p className="mt-0.5 text-[11px] text-muted">{roleLabel[user.role]}</p>
          <button
            type="button"
            onClick={() => {
              logout()
              toast.success('Kamu telah keluar dari panel')
            }}
            className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-error hover:underline"
          >
            <LogOut className="h-3 w-3" /> Keluar
          </button>
        </div>
        <p className="px-1 text-[10px] text-muted">
          {location.pathname.startsWith('/admin') ? 'Mode manajemen apotek' : ''}
        </p>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const user = useCurrentUser()

  return (
    <div className="min-h-screen bg-cream px-3 py-3 sm:px-4">
      <div className="mx-auto flex w-full max-w-[1500px] gap-4">
        <aside className="clay sticky top-3 hidden h-[calc(100vh-1.5rem)] w-60 shrink-0 p-4 lg:block xl:w-64">
          <SidebarContent />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="clay mb-4 flex items-center justify-between rounded-full px-4 py-2.5 lg:hidden">
            <div className="flex items-center gap-2">
              <span
                className="grid h-8 w-8 place-items-center rounded-xl"
                style={{ backgroundImage: 'linear-gradient(145deg, #A78BFA, #7C4CE0)' }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="3.4" strokeLinecap="round" />
                </svg>
              </span>
              <span className="font-display text-sm font-extrabold">Panel Apotek</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Buka menu admin"
              className="grid place-items-center rounded-full bg-white p-2.5 text-ink shadow-clay-sm"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <header className="mb-4 hidden items-center justify-between rounded-3xl bg-white/60 px-5 py-3 shadow-clay-sm backdrop-blur lg:flex">
            <div>
              <p className="font-display text-sm font-bold">
                Halo, {user?.name.split(' ')[0]} 👋
              </p>
              <p className="text-xs text-muted">
                Kelola produk, pesanan, dan verifikasi resep dari satu tempat.
              </p>
            </div>
            <Link to="/shop" className="btn-soft px-4 py-2 text-xs">
              <ShoppingBag className="h-3.5 w-3.5" /> Toko
            </Link>
          </header>

          <div className="pb-8">
            <Outlet />
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[65] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="presentation"
          />
          <div className="clay-lg absolute bottom-3 left-3 top-3 flex w-[min(85vw,300px)] flex-col overflow-y-auto p-4">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu admin"
                className="rounded-full bg-cream p-2 text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
