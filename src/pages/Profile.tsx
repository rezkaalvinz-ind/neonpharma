import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bell, Heart, LogOut, MapPin, Package, ShieldCheck, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Field, Input } from '@/components/ui'
import { useAuth, useCommerce, useCurrentUser } from '@/lib/store'
import { formatDate, roleLabel } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[0-9+\-\s]{9,16}$/.test(v), 'Nomor telepon tidak valid'),
})

type FormValues = z.infer<typeof schema>

export default function Profile() {
  const user = useCurrentUser()
  const updateProfile = useAuth((s) => s.updateProfile)
  const logout = useAuth((s) => s.logout)
  const orders = useCommerce((s) => s.orders)
  const wishlist = useCommerce((s) => s.wishlist)
  const notifications = useCommerce((s) => s.notifications)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  })

  if (!user) return null

  const myOrders = orders.filter((o) => o.userId === user.id)
  const unread = notifications.filter((n) => n.userId === user.id && !n.read).length

  const onSubmit = async (values: FormValues) => {
    const emailTaken = useAuth
      .getState()
      .users.some(
        (u) => u.id !== user.id && u.email.toLowerCase() === values.email.toLowerCase(),
      )
    if (emailTaken) {
      toast.error('Email sudah digunakan akun lain')
      return
    }
    await new Promise((r) => setTimeout(r, 300))
    updateProfile(values)
    toast.success('Profil berhasil diperbarui')
  }

  return (
    <div className="page-container pt-8">
      <h1 className="text-3xl font-extrabold">Profil saya</h1>
      <p className="mt-1 text-sm text-muted">Kelola data akun dan preferensi belanja kamu.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="clay p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary-soft font-display text-2xl font-extrabold text-primary-dark shadow-clay-in">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
                <p className="mt-1 chip bg-mint/70 text-success">{roleLabel[user.role]}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
              <Field label="Nama lengkap" htmlFor="name" error={errors.name?.message} required>
                <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="email" error={errors.email?.message} required>
                  <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
                </Field>
                <Field label="Nomor telepon" htmlFor="phone" error={errors.phone?.message}>
                  <Input id="phone" inputMode="tel" placeholder="0812-xxxx-xxxx" {...register('phone')} />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={isSubmitting || !isDirty} className="btn-clay px-6 py-3">
                  {isSubmitting ? 'Menyimpan…' : 'Simpan perubahan'}
                </button>
                <p className="text-[11px] text-muted">
                  Perubahan email akan dipakai untuk masuk berikutnya.
                </p>
              </div>
            </form>
          </section>

          <section className="clay p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Keamanan akun
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
                <div>
                  <p className="font-semibold">Password</p>
                  <p className="text-[11px] text-muted">Terakhir diubah saat pendaftaran</p>
                </div>
                <Link to="/forgot-password" className="btn-soft px-4 py-2 text-[11px]">
                  Ubah
                </Link>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
                <div>
                  <p className="font-semibold">Alamat tersimpan</p>
                  <p className="text-[11px] text-muted">{user.addresses.length} alamat terdaftar</p>
                </div>
                <Link to="/addresses" className="btn-soft px-4 py-2 text-[11px]">
                  Kelola
                </Link>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="clay p-5">
            <h2 className="font-display text-base font-bold">Ringkasan aktivitas</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Pesanan', value: myOrders.length, icon: Package, to: '/orders' },
                { label: 'Wishlist', value: wishlist.length, icon: Heart, to: '/wishlist' },
                { label: 'Notifikasi', value: unread, icon: Bell, to: '/notifications' },
              ].map((stat) => (
                <Link key={stat.label} to={stat.to} className="clay-inset rounded-2xl px-2 py-3 transition hover:bg-primary-soft/60">
                  <stat.icon className="mx-auto h-4 w-4 text-primary" />
                  <p className="mt-1 font-display text-lg font-extrabold">{stat.value}</p>
                  <p className="text-[10px] text-muted">{stat.label}</p>
                </Link>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted">
              Bergabung sejak {formatDate(user.createdAt)}
            </p>
          </section>

          <section className="clay p-3">
            {[
              { to: '/orders', label: 'Riwayat pesanan', icon: Package },
              { to: '/addresses', label: 'Alamat pengiriman', icon: MapPin },
              { to: '/wishlist', label: 'Wishlist', icon: Heart },
              { to: '/notifications', label: 'Notifikasi', icon: Bell },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition hover:bg-cream"
              >
                <item.icon className="h-4 w-4 text-primary" /> {item.label}
              </Link>
            ))}
            {user.role !== 'customer' && (
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition hover:bg-cream"
              >
                <UserRound className="h-4 w-4 text-primary" /> Dashboard apotek
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                logout()
                toast.success('Kamu telah keluar')
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-error transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Keluar dari akun
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
