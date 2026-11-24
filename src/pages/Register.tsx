import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { toast } from 'sonner'
import { Field, Input } from '@/components/ui'
import { useAuth } from '@/lib/store'

const schema = z
  .object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirm: z.string().min(1, 'Konfirmasi password wajib diisi'),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'Kamu harus menyetujui syarat dan ketentuan' }),
    }),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Konfirmasi password tidak sama',
  })

type FormValues = z.infer<typeof schema>

export default function Register() {
  const registerUser = useAuth((s) => s.register)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  })

  const onSubmit = async (values: FormValues) => {
    const result = await registerUser({
      name: values.name,
      email: values.email,
      password: values.password,
    })
    if (!result.ok) {
      setServerError(result.error ?? 'Gagal mendaftar.')
      return
    }
    if (result.needsConfirmation) {
      toast.success('Akun dibuat. Periksa email untuk konfirmasi sebelum masuk.')
      navigate('/login', { replace: true })
      return
    }
    toast.success('Akun berhasil dibuat. Selamat berbelanja!')
    navigate('/', { replace: true })
  }

  return (
    <div className="page-container pt-8 sm:pt-12">
      <div className="mx-auto grid max-w-5xl items-stretch gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="clay-lg relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-center">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-blush/60 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-primary-soft blur-2xl" />
          <div className="relative">
            <div className="flex gap-3" aria-hidden>
              {['💊', '🧴', '🩺'].map((emoji, i) => (
                <span
                  key={emoji}
                  className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-3xl shadow-clay-sm"
                  style={{ transform: `rotate(${i === 1 ? 5 : i === 2 ? -6 : 0}deg)` }}
                >
                  {emoji}
                </span>
              ))}
            </div>
            <h1 className="mt-6 text-3xl font-extrabold leading-tight">
              Mulai perjalanan sehatmu bersama NEON PHARMA
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Satu akun untuk belanja obat, menyimpan resep, dan memantau pesanan. Gratis dan
              tanpa biaya langganan.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              {[
                'Checkout lebih cepat dengan alamat tersimpan',
                'Riwayat pembelian dan resep tersusun rapi',
                'Notifikasi status pesanan',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="clay-lg p-6 sm:p-8">
          <h2 className="font-display text-2xl font-extrabold">Daftar akun</h2>
          <p className="mt-1 text-sm text-muted">Lengkapi data di bawah ini.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <Field label="Nama lengkap" htmlFor="name" error={errors.name?.message} required>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Nama sesuai identitas"
                  className="pl-11"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
              </div>
            </Field>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Password"
                htmlFor="password"
                error={errors.password?.message}
                hint="Minimal 8 karakter"
                required
              >
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="pl-11 pr-10"
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field
                label="Konfirmasi"
                htmlFor="confirm"
                error={errors.confirm?.message}
                required
              >
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                  <Input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Ulangi password"
                    className="pl-11"
                    aria-invalid={!!errors.confirm}
                    {...register('confirm')}
                  />
                </div>
              </Field>
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded accent-primary"
                  aria-invalid={!!errors.terms}
                  {...register('terms')}
                />
                <span>
                  Saya menyetujui{' '}
                  <Link to="/terms" className="font-semibold text-primary hover:underline">
                    Syarat & Ketentuan
                  </Link>{' '}
                  serta{' '}
                  <Link to="/privacy" className="font-semibold text-primary hover:underline">
                    Kebijakan Privasi
                  </Link>{' '}
                  NEON PHARMA.
                </span>
              </label>
              {errors.terms && (
                <p role="alert" className="mt-1 text-xs font-semibold text-error">
                  {errors.terms.message}
                </p>
              )}
            </div>

            {serverError && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-error">
                {serverError}
              </p>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-clay w-full py-3.5">
              {isSubmitting ? 'Memproses…' : 'Buat akun'}
            </button>

            <p className="text-center text-xs text-muted">
              Sudah punya akun?{' '}
              <Link to="/login" className="font-bold text-primary hover:underline">
                Masuk di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
