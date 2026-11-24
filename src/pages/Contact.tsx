import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Field, Input, SectionHeading, Textarea } from '@/components/ui'

const schema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  subject: z.string().min(3, 'Subjek minimal 3 karakter'),
  message: z.string().min(10, 'Pesan minimal 10 karakter'),
})

type FormValues = z.infer<typeof schema>

const faqs = [
  {
    q: 'Bagaimana cara membeli obat resep?',
    a: 'Tambahkan obat resep ke keranjang, lalu unggah foto resep pada halaman checkout. Apoteker akan memverifikasi sebelum pesanan diproses.',
  },
  {
    q: 'Apakah pengiriman tersedia di seluruh Indonesia?',
    a: 'Ya. Gratis ongkir untuk belanja minimal Rp150.000. Estimasi pengiriman 1–3 hari kerja untuk area Jawa dan 2–5 hari kerja untuk luar Jawa.',
  },
  {
    q: 'Metode pembayaran apa saja yang diterima?',
    a: 'Transfer bank, dompet digital, dan bayar di tempat (COD) untuk area tertentu.',
  },
  {
    q: 'Bagaimana jika produk yang saya terima rusak?',
    a: 'Hubungi kami maksimal 2×24 jam setelah paket diterima dengan menyertakan foto produk dan nomor pesanan.',
  },
]

export default function Contact() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  })

  const onSubmit = async (values: FormValues) => {
    await new Promise((r) => setTimeout(r, 400))
    toast.success('Pesanmu sudah dicatat. Tim kami akan menghubungi melalui email.')
    reset()
  }

  return (
    <div className="page-container pt-8 sm:pt-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link to="/" className="hover:text-primary-dark">Beranda</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-ink">Kontak</span>
      </nav>

      <div className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Ada yang bisa kami bantu?</h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Tanyakan seputar produk, pesanan, atau resep. Tim apoteker kami membalas pada jam
          operasional.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {[
            {
              icon: MapPin,
              title: 'Kunjungi apotek',
              value: 'Jl. Kesehatan Raya No. 88, Bandung, Jawa Barat 40131',
              tone: 'bg-primary-soft text-primary-dark',
            },
            {
              icon: Phone,
              title: 'Telepon / WhatsApp',
              value: '(022) 1234-5678 · 0812-9000-1234',
              tone: 'bg-mint/70 text-success',
            },
            {
              icon: Mail,
              title: 'Email',
              value: 'halo@neonpharma.id',
              tone: 'bg-blush/70 text-ink',
            },
            {
              icon: Clock,
              title: 'Jam operasional',
              value: 'Senin–Minggu, 08.00–22.00 WIB',
              tone: 'bg-sky/70 text-ink',
            },
          ].map((item) => (
            <div key={item.title} className="clay flex items-start gap-3 p-4">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-clay-sm ${item.tone}`}>
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-bold">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.value}</p>
              </div>
            </div>
          ))}

          <div className="clay-inset rounded-3xl p-4">
            <p className="font-display text-xs font-bold uppercase tracking-wide text-muted">
              Catatan penting
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Untuk kondisi darurat atau keluhan medis serius, segera hubungi layanan gawat
              darurat atau kunjungi fasilitas kesehatan terdekat. Kami tidak menyediakan
              layanan diagnosis darurat.
            </p>
          </div>
        </div>

        <div className="clay-lg p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <MessageSquare className="h-5 w-5 text-primary" /> Kirim pesan
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama" htmlFor="name" error={errors.name?.message} required>
                <Input id="name" placeholder="Nama lengkap" aria-invalid={!!errors.name} {...register('name')} />
              </Field>
              <Field label="Email" htmlFor="email" error={errors.email?.message} required>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
              </Field>
            </div>
            <Field label="Subjek" htmlFor="subject" error={errors.subject?.message} required>
              <Input
                id="subject"
                placeholder="Contoh: Pertanyaan tentang pesanan NP20265001"
                aria-invalid={!!errors.subject}
                {...register('subject')}
              />
            </Field>
            <Field label="Pesan" htmlFor="message" error={errors.message?.message} required>
              <Textarea
                id="message"
                rows={5}
                placeholder="Tulis pertanyaan atau keluhanmu di sini…"
                aria-invalid={!!errors.message}
                {...register('message')}
              />
            </Field>
            <button type="submit" disabled={isSubmitting} className="btn-clay w-full py-3.5">
              <Send className="h-4 w-4" /> {isSubmitting ? 'Mengirim…' : 'Kirim pesan'}
            </button>
            <p className="text-center text-[11px] text-muted">
              Dengan mengirim pesan, kamu menyetujui pengolahan data sesuai kebijakan privasi.
            </p>
          </form>
        </div>
      </div>

      <section className="mt-14">
        <SectionHeading eyebrow="FAQ" title="Pertanyaan yang sering diajukan" />
        <div className="mt-6 space-y-2.5">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="clay overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-sm font-bold"
              >
                {faq.q}
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-dark transition ${openFaq === i ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              {openFaq === i && (
                <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
