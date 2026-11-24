import { useMemo, useState } from 'react'
import { Bell, CheckCheck, FileCheck2, Megaphone, Package, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, EmptyState } from '@/components/ui'
import { useCommerce, useCurrentUser } from '@/lib/store'
import { cx, formatDateTime } from '@/lib/utils'

const icons = {
  order: Package,
  promo: Megaphone,
  system: Settings2,
  prescription: FileCheck2,
}

const tones = {
  order: 'bg-sky/60 text-ink',
  promo: 'bg-blush/70 text-ink',
  system: 'bg-primary-soft text-primary-dark',
  prescription: 'bg-mint/70 text-success',
}

export default function Notifications() {
  const user = useCurrentUser()
  const notifications = useCommerce((s) => s.notifications)
  const markRead = useCommerce((s) => s.markNotificationRead)
  const markAll = useCommerce((s) => s.markAllNotificationsRead)
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const mine = useMemo(() => {
    if (!user) return []
    return notifications
      .filter((n) => n.userId === user.id)
      .filter((n) => (tab === 'unread' ? !n.read : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notifications, user, tab])

  if (!user) return null
  const unreadTotal = notifications.filter((n) => n.userId === user.id && !n.read).length

  return (
    <div className="page-container pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Notifikasi</h1>
          <p className="mt-1 text-sm text-muted">
            {unreadTotal > 0 ? `${unreadTotal} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>
        {unreadTotal > 0 && (
          <Button
            variant="soft"
            onClick={() => {
              markAll(user.id)
              toast.success('Semua notifikasi ditandai sudah dibaca')
            }}
          >
            <CheckCheck className="h-4 w-4" /> Tandai semua dibaca
          </Button>
        )}
      </div>

      <div className="mt-5 flex gap-2" role="tablist" aria-label="Filter notifikasi">
        {[
          { id: 'all' as const, label: 'Semua' },
          { id: 'unread' as const, label: 'Belum dibaca' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              'rounded-full px-4 py-2 font-display text-xs font-bold transition',
              tab === t.id
                ? 'bg-primary text-white shadow-clay-btn'
                : 'bg-white text-muted shadow-clay-sm hover:text-primary-dark',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {mine.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="Tidak ada notifikasi"
            description="Pembaruan status pesanan, verifikasi resep, dan promo terbaru akan muncul di sini."
          />
        ) : (
          mine.map((n) => {
            const Icon = icons[n.type]
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => !n.read && markRead(n.id)}
                className={cx(
                  'clay flex w-full items-start gap-3 p-4 text-left transition hover:shadow-clay-hover',
                  !n.read && 'ring-1 ring-primary/25',
                )}
              >
                <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-clay-sm', tones[n.type])}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold">{n.title}</span>
                    {!n.read && (
                      <span className="chip bg-primary text-white">Baru</span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{n.body}</span>
                  <span className="mt-1.5 block text-[11px] text-muted/80">
                    {formatDateTime(n.createdAt)}
                  </span>
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
