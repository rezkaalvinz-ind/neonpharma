import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Field, Input } from '@/components/ui'
import { useAuth } from '@/lib/store'
import { isSupabaseConfigured } from '@/lib/supabase'

const schema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type FormValues = z.infer<typeof schema>

const demoAccounts = [
  { label: 'Pelanggan', email: 'sari@example.com', password: 'customer123' },
  { label: 'Admin', email: 'admin@neonpharma.id', password: 'admin123' },
  { label: 'Apoteker', email: 'apoteker@neonpharma.id', password: 'apoteker123' },
  { label: 'Pegawai', email: 'pegawai@neonpharma.id', password: 'pegawai123' },
]

export default function Login() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const from = (location.state as { from?: string } | null)?.from

  const onSubmit = async (values: FormValues) => {
    const result = await login(values.email, values.password)
    if (!result.ok) {
      setServerError(result.error ?? 'Gagal masuk.')
      return
    }
    setServerError('')
    toast.success('Selamat datang kembali di NEON PHARMA')
    const target = from ?? (result.role === 'customer' ? '/' : '/admin')
    navigate(target, { replace: true })
  }

  return (
    <div className="page-container pt-8 sm:pt-12">
      <div className="mx-auto grid max-w-5xl items-stretch gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="clay-lg relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-soft blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-mint/50 blur-2xl" />
          <div className="relative">
            <span className="chip bg-white text-primary-dark">
              <ShieldCheck className="h-3.5 w-3.5" /> Akun aman & terverifikasi
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight">
              Selamat datang kembali di{' '}
              <span className="text-primary">NEON PHARMA</span>
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Masuk untuk melihat riwayat pesanan, menyimpan alamat, dan melanjutkan
              belanja kebutuhan kesehatanmu.
            </p>
          </div>
          <div className="relative mt-8 space-y-3">
            {[
              'Riwayat pesanan dan status pengiriman',
              'Wishlist dan alamat tersimpan',
              'Verifikasi resep oleh apoteker',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-mint/70 text-success">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <p className="text-xs font-medium text-ink">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="clay-lg p-6 sm:p-8">
          <h2 className="font-display text-2xl font-extrabold">Masuk</h2>
          <p className="mt-1 text-sm text-muted">
            Gunakan email dan password akunmu.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <Field label="Email" htmlFor="email" error={errors.email?.message} required>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  className="pl-11"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
              </div>
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
              required
            >
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-11 pr-11"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {serverError && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-error">
                {serverError}
              </p>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Belum punya akun?</span>
              <Link to="/register" className="font-bold text-primary hover:underline">
                Daftar gratis
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-clay w-full py-3.5">
              {isSubmitting ? 'Memproses…' : 'Masuk ke akun'}
            </button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-muted hover:text-primary-dark hover:underline"
              >
                Lupa password?
              </Link>
            </div>
          </form>

          {!isSupabaseConfigured && (
          <div className="mt-6 rounded-2xl bg-cream p-3">
            <p className="font-display text-[11px] font-bold uppercase tracking-wide text-muted">
              Akun demo
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setValue('email', acc.email)
                    setValue('password', acc.password)
                    setServerError('')
                    toast.info(`Akun ${acc.label} terisi otomatis`)
                  }}
                  className="chip bg-white text-ink normal-case tracking-normal shadow-clay-sm transition hover:text-primary-dark"
                >
                  {acc.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              Data demo tersimpan lokal di browser. Jangan gunakan password asli.
            </p>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
