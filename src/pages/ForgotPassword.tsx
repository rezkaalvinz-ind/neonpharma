import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MailCheck, Send } from 'lucide-react'
import { Field, Input } from '@/components/ui'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <div className="page-container pt-10 sm:pt-16">
      <div className="clay-lg mx-auto max-w-md p-6 sm:p-8">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary-dark">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke halaman masuk
        </Link>

        {sent ? (
          <div className="mt-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-mint/70 text-success shadow-clay-sm">
              <MailCheck className="h-7 w-7" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold">Periksa emailmu</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Jika <span className="font-semibold text-ink">{email}</span> terdaftar, kami telah
              mengirim tautan untuk mengatur ulang password. Tautan berlaku selama 60 menit.
            </p>
            <Link to="/login" className="btn-clay mt-6 w-full py-3">
              Kembali ke halaman masuk
            </Link>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-2 w-full text-xs font-semibold text-muted hover:text-primary-dark"
            >
              Gunakan email lain
            </button>
          </div>
        ) : (
          <>
            <h1 className="mt-5 font-display text-2xl font-extrabold">Lupa password?</h1>
            <p className="mt-1.5 text-sm text-muted">
              Masukkan email akunmu. Kami akan mengirim tautan untuk membuat password baru.
            </p>

            <form
              className="mt-6 space-y-4"
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                  setError('Masukkan alamat email yang valid.')
                  return
                }
                setError('')
                setSent(true)
              }}
            >
              <Field label="Email" htmlFor="reset-email" error={error} required>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  aria-invalid={!!error}
                />
              </Field>
              <button type="submit" className="btn-clay w-full py-3.5">
                <Send className="h-4 w-4" /> Kirim tautan reset
              </button>
            </form>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">
              Pada demo ini tautan reset tidak benar-benar dikirim melalui email. Hubungkan
              layanan email transaksional untuk mengaktifkannya.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
