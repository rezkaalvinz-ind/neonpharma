import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Home, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, EmptyState, Field, Input, Modal, Textarea } from '@/components/ui'
import { useAuth, useCurrentUser } from '@/lib/store'
import { cx } from '@/lib/utils'
import type { Address } from '@/lib/types'

const schema = z.object({
  label: z.string().min(1, 'Label wajib diisi'),
  recipient: z.string().min(3, 'Nama penerima minimal 3 karakter'),
  phone: z
    .string()
    .min(9, 'Nomor telepon minimal 9 digit')
    .regex(/^[0-9+\-\s]+$/, 'Nomor telepon tidak valid'),
  detail: z.string().min(10, 'Alamat minimal 10 karakter'),
  city: z.string().min(2, 'Kota wajib diisi'),
  province: z.string().min(2, 'Provinsi wajib diisi'),
  postal: z.string().regex(/^\d{5}$/, 'Kode pos harus 5 digit'),
  isDefault: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export default function Addresses() {
  const user = useCurrentUser()
  const addAddress = useAuth((s) => s.addAddress)
  const updateAddress = useAuth((s) => s.updateAddress)
  const removeAddress = useAuth((s) => s.removeAddress)
  const setDefaultAddress = useAuth((s) => s.setDefaultAddress)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [deleting, setDeleting] = useState<Address | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: 'Rumah',
      recipient: user?.name ?? '',
      phone: user?.phone ?? '',
      detail: '',
      city: '',
      province: '',
      postal: '',
      isDefault: false,
    },
  })

  if (!user) return null

  const openCreate = () => {
    setEditing(null)
    reset({
      label: 'Rumah',
      recipient: user.name,
      phone: user.phone ?? '',
      detail: '',
      city: '',
      province: '',
      postal: '',
      isDefault: user.addresses.length === 0,
    })
    setModalOpen(true)
  }

  const openEdit = (address: Address) => {
    setEditing(address)
    reset({ ...address })
    setModalOpen(true)
  }

  const onSubmit = (values: FormValues) => {
    if (editing) {
      updateAddress(editing.id, values)
      toast.success('Alamat diperbarui')
    } else {
      addAddress(values)
      toast.success('Alamat ditambahkan')
    }
    setModalOpen(false)
  }

  return (
    <div className="page-container pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Alamat pengiriman</h1>
          <p className="mt-1 text-sm text-muted">
            Simpan beberapa alamat agar checkout lebih cepat.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah alamat
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {user.addresses.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="Belum ada alamat tersimpan"
              description="Tambahkan alamat pengiriman pertamamu supaya pesanan bisa diproses lebih cepat."
              action={<Button onClick={openCreate}>Tambah alamat</Button>}
            />
          </div>
        ) : (
          user.addresses.map((address) => (
            <article
              key={address.id}
              className={cx('clay flex flex-col p-5', address.isDefault && 'ring-1 ring-primary/30')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary-dark">
                    <Home className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold">{address.label}</p>
                    {address.isDefault && (
                      <span className="chip mt-1 bg-mint/70 text-success">Utama</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    aria-label={`Ubah alamat ${address.label}`}
                    className="grid h-8 w-8 place-items-center rounded-full bg-cream text-muted transition hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(address)}
                    aria-label={`Hapus alamat ${address.label}`}
                    className="grid h-8 w-8 place-items-center rounded-full bg-cream text-muted transition hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold">{address.recipient}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">
                {address.detail}
                <br />
                {address.city}, {address.province} {address.postal}
                <br />
                {address.phone}
              </p>

              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => {
                    setDefaultAddress(address.id)
                    toast.success('Alamat utama diperbarui')
                  }}
                  className="btn-soft mt-3 px-4 py-2 text-[11px]"
                >
                  <Star className="h-3.5 w-3.5" /> Jadikan alamat utama
                </button>
              )}
            </article>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Ubah alamat' : 'Tambah alamat'}
        description="Pastikan alamat lengkap dan nomor telepon aktif."
        size="lg"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)}>
              Simpan alamat
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Label" htmlFor="label" error={errors.label?.message} required>
            <Input id="label" placeholder="Rumah / Kantor" {...register('label')} />
          </Field>
          <Field label="Nama penerima" htmlFor="recipient" error={errors.recipient?.message} required>
            <Input id="recipient" {...register('recipient')} />
          </Field>
          <Field label="Nomor telepon" htmlFor="phone" error={errors.phone?.message} required>
            <Input id="phone" inputMode="tel" {...register('phone')} />
          </Field>
          <Field label="Kode pos" htmlFor="postal" error={errors.postal?.message} required>
            <Input id="postal" inputMode="numeric" maxLength={5} {...register('postal')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Alamat lengkap" htmlFor="detail" error={errors.detail?.message} required>
              <Textarea id="detail" rows={2} {...register('detail')} />
            </Field>
          </div>
          <Field label="Kota / Kabupaten" htmlFor="city" error={errors.city?.message} required>
            <Input id="city" {...register('city')} />
          </Field>
          <Field label="Provinsi" htmlFor="province" error={errors.province?.message} required>
            <Input id="province" {...register('province')} />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-primary" {...register('isDefault')} />
            Jadikan alamat utama
          </label>
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Hapus alamat?"
        description="Alamat ini akan dihapus dari daftar alamat pengirimanmu."
        size="sm"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-br from-red-500 to-error shadow-[0_8px_18px_rgba(185,28,28,0.3)]"
              onClick={() => {
                if (deleting) removeAddress(deleting.id)
                setDeleting(null)
                toast.success('Alamat dihapus')
              }}
            >
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          {deleting?.label} · {deleting?.detail}
        </p>
      </Modal>
    </div>
  )
}
