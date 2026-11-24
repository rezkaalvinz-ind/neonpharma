import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui'
import { useCatalog } from '@/lib/store'
import { cx, formatIDR } from '@/lib/utils'
import type { Category } from '@/lib/types'

const toneOptions = [
  { value: 'bg-primary-soft', label: 'Ungu lembut' },
  { value: 'bg-primary-light/40', label: 'Lavender' },
  { value: 'bg-mint/60', label: 'Mint' },
  { value: 'bg-mint/40', label: 'Mint pucat' },
  { value: 'bg-blush/70', label: 'Pink' },
  { value: 'bg-sky/60', label: 'Biru' },
]

const schema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter'),
  short: z.string().min(2, 'Nama pendek wajib diisi'),
  emoji: z.string().min(1, 'Emoji wajib diisi'),
  tone: z.string().min(1),
  blurb: z.string().min(5, 'Deskripsi minimal 5 karakter'),
})

type FormValues = z.infer<typeof schema>

export default function AdminCategories() {
  const categories = useCatalog((s) => s.categories)
  const products = useCatalog((s) => s.products)
  const upsertCategory = useCatalog((s) => s.upsertCategory)
  const deleteCategory = useCatalog((s) => s.deleteCategory)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', short: '', emoji: '💊', tone: 'bg-primary-soft', blurb: '' },
  })

  const stats = useMemo(
    () =>
      categories.map((c) => {
        const items = products.filter((p) => p.category === c.slug)
        return {
          ...c,
          count: items.length,
          value: items.reduce((acc, p) => acc + p.price * Math.max(1, p.sold), 0),
        }
      }),
    [categories, products],
  )

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', short: '', emoji: '💊', tone: 'bg-primary-soft', blurb: '' })
    setModalOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    reset({
      name: category.name,
      short: category.short,
      emoji: category.emoji,
      tone: category.tone,
      blurb: category.blurb,
    })
    setModalOpen(true)
  }

  const onSubmit = (values: FormValues) => {
    const slug = editing
      ? editing.slug
      : values.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

    if (!editing && categories.some((c) => c.slug === slug)) {
      toast.error('Kategori dengan nama serupa sudah ada.')
      return
    }

    upsertCategory({ slug, ...values })
    setModalOpen(false)
    toast.success(editing ? 'Kategori diperbarui' : 'Kategori ditambahkan')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Manajemen kategori</h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            {categories.length} kategori digunakan pada katalog produk.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah kategori
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((category) => (
          <article key={category.slug} className="clay p-4">
            <div className="flex items-start gap-3">
              <span className={cx('grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl shadow-clay-sm', category.tone)}>
                {category.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-sm font-bold">{category.name}</h2>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">{category.blurb}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(category)}
                  aria-label={`Ubah kategori ${category.name}`}
                  className="grid h-7 w-7 place-items-center rounded-full bg-cream text-muted transition hover:text-primary"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(category)}
                  aria-label={`Hapus kategori ${category.name}`}
                  className="grid h-7 w-7 place-items-center rounded-full bg-cream text-muted transition hover:text-error"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="clay-inset rounded-xl px-3 py-2">
                <p className="font-display text-sm font-extrabold">{category.count}</p>
                <p className="text-[10px] text-muted">Produk</p>
              </div>
              <div className="clay-inset rounded-xl px-3 py-2">
                <p className="truncate font-display text-xs font-extrabold">
                  {formatIDR(category.value)}
                </p>
                <p className="text-[10px] text-muted">Nilai penjualan</p>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-muted">Slug: {category.slug}</p>
          </article>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Ubah kategori' : 'Tambah kategori'}
        description="Kategori baru langsung muncul di halaman toko."
        size="md"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Nama kategori" htmlFor="c-name" error={errors.name?.message} required>
            <Input id="c-name" {...register('name')} />
          </Field>
          <Field label="Nama pendek" htmlFor="c-short" error={errors.short?.message} hint="Dipakai pada kartu produk" required>
            <Input id="c-short" {...register('short')} />
          </Field>
          <Field label="Emoji" htmlFor="c-emoji" error={errors.emoji?.message} required>
            <Input id="c-emoji" maxLength={4} {...register('emoji')} />
          </Field>
          <Field label="Warna latar" htmlFor="c-tone">
            <Select id="c-tone" {...register('tone')}>
              {toneOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Deskripsi singkat" htmlFor="c-blurb" error={errors.blurb?.message} required>
              <Textarea id="c-blurb" rows={2} {...register('blurb')} />
            </Field>
          </div>
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Hapus kategori?"
        description="Kategori hanya dapat dihapus bila tidak ada produk yang memakainya."
        size="sm"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setDeleting(null)}>Batal</Button>
            <Button
              size="sm"
              className="bg-gradient-to-br from-red-500 to-error shadow-[0_8px_18px_rgba(185,28,28,0.3)]"
              onClick={() => {
                if (!deleting) return
                const result = deleteCategory(deleting.slug)
                if (!result.ok) {
                  toast.error(result.error)
                  return
                }
                toast.success('Kategori dihapus')
                setDeleting(null)
              }}
            >
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          {deleting?.name} ·{' '}
          {products.filter((p) => p.category === deleting?.slug).length} produk terkait
        </p>
      </Modal>
    </div>
  )
}
