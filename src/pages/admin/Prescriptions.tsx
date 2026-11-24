import { useMemo, useState } from 'react'
import { Check, FileText, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Modal } from '@/components/ui'
import { useCommerce } from '@/lib/store'
import { cx, formatDateTime, prescriptionStatusLabel } from '@/lib/utils'
import type { Prescription, PrescriptionStatus } from '@/lib/types'

const tabs: Array<{ id: 'all' | PrescriptionStatus; label: string }> = [
  { id: 'pending', label: 'Menunggu' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'rejected', label: 'Ditolak' },
  { id: 'all', label: 'Semua' },
]

const tones: Record<PrescriptionStatus, string> = {
  pending: 'bg-amber-100 text-warning',
  approved: 'bg-mint/70 text-success',
  rejected: 'bg-red-100 text-error',
}

export default function AdminPrescriptions() {
  const prescriptions = useCommerce((s) => s.prescriptions)
  const orders = useCommerce((s) => s.orders)
  const setPrescriptionStatus = useCommerce((s) => s.setPrescriptionStatus)
  const [tab, setTab] = useState<'all' | PrescriptionStatus>('pending')
  const [review, setReview] = useState<{ rx: Prescription; action: PrescriptionStatus } | null>(null)

  const filtered = useMemo(
    () =>
      prescriptions
        .filter((p) => (tab === 'all' ? true : p.status === tab))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [prescriptions, tab],
  )

  const count = (status: PrescriptionStatus) =>
    prescriptions.filter((p) => p.status === status).length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Verifikasi resep</h1>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          Periksa dokumen resep sebelum pesanan obat keras diproses.
        </p>
      </div>

      <div className="clay flex flex-wrap items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary-dark">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <p className="flex-1 text-xs leading-relaxed text-muted">
          Pastikan nama pasien, nama dokter, tanggal resep, dan jenis obat sesuai. Tolak resep
          yang tidak terbaca atau kedaluwarsa.
        </p>
        <span className="chip bg-amber-100 text-warning">{count('pending')} menunggu</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar" role="tablist" aria-label="Filter resep">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              'shrink-0 rounded-full px-4 py-2 font-display text-xs font-bold transition',
              tab === t.id
                ? 'bg-primary text-white shadow-clay-btn'
                : 'bg-white text-muted shadow-clay-sm hover:text-primary-dark',
            )}
          >
            {t.label}
            {t.id !== 'all' && (
              <span className="ml-1.5 text-[10px] opacity-80">{count(t.id as PrescriptionStatus)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="clay p-8 text-center text-sm text-muted sm:col-span-2">
            Tidak ada resep pada filter ini.
          </p>
        ) : (
          filtered.map((rx) => {
            const relatedOrder = orders.find((o) => o.prescriptionId === rx.id)
            return (
              <article key={rx.id} className="clay p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-bold">{rx.id}</p>
                    <p className="text-[11px] text-muted">{formatDateTime(rx.createdAt)}</p>
                  </div>
                  <span className={cx('chip', tones[rx.status])}>
                    {prescriptionStatusLabel[rx.status]}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <p className="font-semibold">{rx.customerName}</p>
                  <p className="flex items-center gap-1.5 text-muted">
                    <FileText className="h-3.5 w-3.5" /> {rx.fileName}
                  </p>
                  <p className="text-muted">Dokter: {rx.doctorName ?? '—'}</p>
                  {rx.note && <p className="text-muted">Catatan: {rx.note}</p>}
                  {relatedOrder && (
                    <p className="text-[11px] text-muted">
                      Pesanan terkait: <span className="font-semibold text-ink">{relatedOrder.id}</span>{' '}
                      ({relatedOrder.status})
                    </p>
                  )}
                </div>

                {rx.status === 'pending' ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setReview({ rx, action: 'approved' })}
                    >
                      <Check className="h-3.5 w-3.5" /> Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="soft"
                      className="flex-1 text-error"
                      onClick={() => setReview({ rx, action: 'rejected' })}
                    >
                      <X className="h-3.5 w-3.5" /> Tolak
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="soft"
                      className="flex-1"
                      onClick={() => {
                        setPrescriptionStatus(rx.id, 'pending')
                        toast.info('Resep dikembalikan ke antrean verifikasi')
                      }}
                    >
                      Tinjau ulang
                    </Button>
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>

      <Modal
        open={!!review}
        onClose={() => setReview(null)}
        title={review?.action === 'approved' ? 'Setujui resep?' : 'Tolak resep?'}
        description={
          review?.action === 'approved'
            ? 'Pesanan terkait akan otomatis masuk ke tahap diproses.'
            : 'Pelanggan akan menerima notifikasi untuk menghubungi apoteker.'
        }
        size="sm"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setReview(null)}>Batal</Button>
            <Button
              size="sm"
              onClick={() => {
                if (!review) return
                setPrescriptionStatus(review.rx.id, review.action)
                toast.success(
                  review.action === 'approved' ? 'Resep disetujui' : 'Resep ditolak',
                )
                setReview(null)
              }}
            >
              Konfirmasi
            </Button>
          </>
        }
      >
        {review && (
          <div className="rounded-2xl bg-cream p-3 text-xs">
            <p className="font-display text-sm font-bold">{review.rx.id}</p>
            <p className="mt-0.5 text-muted">{review.rx.customerName}</p>
            <p className="text-muted">{review.rx.fileName}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
