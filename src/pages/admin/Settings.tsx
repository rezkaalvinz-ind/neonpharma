import { useState } from 'react'
import { Bell, Database, Save, Store, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Field, Input, Modal, Textarea } from '@/components/ui'
import { useCommerce, useSettings } from '@/lib/store'
import { isSupabaseConfigured, supabaseProjectUrl } from '@/lib/supabase'
import { cx } from '@/lib/utils'

export default function AdminSettings() {
  const settings = useSettings()
  const update = useSettings((s) => s.update)
  const resetDemoData = useCommerce((s) => s.resetDemoData)

  const [form, setForm] = useState({
    storeName: settings.storeName,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    hours: settings.hours,
    lowStockThreshold: settings.lowStockThreshold,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmReset, setConfirmReset] = useState(false)

  const save = () => {
    const nextErrors: Record<string, string> = {}
    if (form.storeName.trim().length < 3) nextErrors.storeName = 'Nama apotek minimal 3 karakter'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Email tidak valid'
    if (form.phone.trim().length < 7) nextErrors.phone = 'Nomor telepon tidak valid'
    if (form.address.trim().length < 10) nextErrors.address = 'Alamat minimal 10 karakter'
    if (!form.hours.trim()) nextErrors.hours = 'Jam operasional wajib diisi'
    if (form.lowStockThreshold < 1) nextErrors.lowStockThreshold = 'Minimal 1 unit'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Periksa kembali data yang diisi')
      return
    }
    update(form)
    toast.success('Pengaturan apotek disimpan')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Pengaturan apotek</h1>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          Informasi operasional dan preferensi notifikasi internal.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <section className="clay p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <Store className="h-4 w-4 text-primary" /> Profil apotek
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nama apotek" htmlFor="s-name" error={errors.storeName} required>
              <Input
                id="s-name"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              />
            </Field>
            <Field label="Email layanan" htmlFor="s-email" error={errors.email} required>
              <Input
                id="s-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Telepon" htmlFor="s-phone" error={errors.phone} required>
              <Input
                id="s-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Jam operasional" htmlFor="s-hours" error={errors.hours} required>
              <Input
                id="s-hours"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Alamat apotek" htmlFor="s-address" error={errors.address} required>
                <Textarea
                  id="s-address"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </Field>
            </div>
            <Field
              label="Ambang stok menipis"
              htmlFor="s-threshold"
              error={errors.lowStockThreshold}
              hint="Dipakai pada dashboard dan inventori"
              required
            >
              <Input
                id="s-threshold"
                type="number"
                min={1}
                value={form.lowStockThreshold}
                onChange={(e) =>
                  setForm({ ...form, lowStockThreshold: Number(e.target.value) })
                }
              />
            </Field>
          </div>
          <Button className="mt-4" onClick={save}>
            <Save className="h-4 w-4" /> Simpan pengaturan
          </Button>
        </section>

        <div className="space-y-4">
          <section className="clay p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <Bell className="h-4 w-4 text-primary" /> Notifikasi internal
            </h2>
            <div className="mt-3 space-y-2">
              {[
                {
                  key: 'notifyOrders' as const,
                  label: 'Pesanan baru',
                  description: 'Tampilkan notifikasi saat pesanan masuk.',
                },
                {
                  key: 'notifyStock' as const,
                  label: 'Peringatan stok',
                  description: 'Ingatkan saat stok berada di bawah ambang.',
                },
                {
                  key: 'notifyPromo' as const,
                  label: 'Pengingat promo',
                  description: 'Saran pengiriman promo ke pelanggan.',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cream px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={(e) => update({ [item.key]: e.target.checked })}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span>
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="block text-[10px] text-muted">{item.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="clay p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <Database className="h-4 w-4 text-primary" /> Data aplikasi
            </h2>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              {isSupabaseConfigured
                ? 'Aplikasi terhubung ke Supabase: autentikasi, katalog, pesanan, resep, dan notifikasi disimpan di PostgreSQL.'
                : 'Supabase belum dikonfigurasi, sehingga pesanan, produk, dan akun disimpan di browser. Isi .env.local lalu jalankan supabase/schema.sql untuk memakai database asli.'}
            </p>
            <div className="mt-3 rounded-2xl bg-cream p-3 text-[11px]">
              <p className="flex justify-between gap-3">
                <span className="text-muted">Data</span>
                <span className="truncate font-semibold">
                  {isSupabaseConfigured ? 'Supabase Postgres' : 'localStorage'}
                </span>
              </p>
              <p className="mt-1 flex justify-between gap-3">
                <span className="text-muted">Autentikasi</span>
                <span className="truncate font-semibold">
                  {isSupabaseConfigured ? 'Supabase Auth' : 'Sesi lokal'}
                </span>
              </p>
              {isSupabaseConfigured && (
                <p className="mt-1 flex justify-between gap-3">
                  <span className="text-muted">Project</span>
                  <span className="truncate font-semibold">{supabaseProjectUrl}</span>
                </p>
              )}
            </div>
          </section>

          <section className="clay border border-error/20 p-5">
            <h2 className={cx('flex items-center gap-2 font-display text-base font-bold text-error')}>
              <Trash2 className="h-4 w-4" /> Zona berbahaya
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Mengatur ulang data demo akan menghapus pesanan, resep, dan notifikasi yang dibuat
              selama pengujian, lalu memulihkan data contoh.
            </p>
            <Button
              variant="soft"
              className="mt-3 text-error"
              onClick={() => setConfirmReset(true)}
            >
              Reset data demo
            </Button>
          </section>
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset data demo?"
        description="Tindakan ini tidak dapat dibatalkan."
        size="sm"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setConfirmReset(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-br from-red-500 to-error shadow-[0_8px_18px_rgba(185,28,28,0.3)]"
              onClick={() => {
                resetDemoData()
                setConfirmReset(false)
                toast.success('Data demo telah dipulihkan')
              }}
            >
              Ya, reset
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Pesanan baru, verifikasi resep, dan notifikasi akan dikembalikan ke data contoh awal.
        </p>
      </Modal>
    </div>
  )
}
