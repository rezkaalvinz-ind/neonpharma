import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui'
import { useCatalog } from '@/lib/store'
import { cx, formatIDR } from '@/lib/utils'
import type { Product } from '@/lib/types'

const toneOptions = [
  { value: 'bg-primary-soft', label: 'Ungu lembut' },
  { value: 'bg-primary-light/40', label: 'Lavender' },
  { value: 'bg-mint/60', label: 'Mint' },
  { value: 'bg-blush/60', label: 'Pink' },
  { value: 'bg-sky/60', label: 'Biru' },
]

const schema = z.object({
  name: z.string().min(3, 'Nama produk minimal 3 karakter'),
  brand: z.string().min(2, 'Merek wajib diisi'),
  category: z.string().min(1, 'Pilih kategori'),
  price: z.coerce.number().min(500, 'Harga minimal Rp500'),
  originalPrice: z.coerce.number().optional(),
  stock: z.coerce.number().min(0, 'Stok tidak boleh negatif'),
  requiresPrescription: z.boolean(),
  emoji: z.string().min(1, 'Emoji wajib diisi'),
  tone: z.string().min(1),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  ingredients: z.string().optional(),
  usage: z.string().optional(),
  storage: z.string().optional(),
  warning: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  name: '',
  brand: '',
  category: 'obat',
  price: 10000,
  originalPrice: undefined,
  stock: 0,
  requiresPrescription: false,
  emoji: '💊',
  tone: 'bg-primary-soft',
  description: '',
  ingredients: '',
  usage: '',
  storage: '',
  warning: '',
}

export default function AdminProducts() {
  const products = useCatalog((s) => s.products)
  const categories = useCatalog((s) => s.categories)
  const upsertProduct = useCatalog((s) => s.upsertProduct)
  const deleteProduct = useCatalog((s) => s.deleteProduct)

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (!q) return true
      return `${p.name} ${p.brand}`.toLowerCase().includes(q)
    })
  }, [products, query, categoryFilter])

  const openCreate = () => {
    setEditing(null)
    reset(emptyValues)
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    reset({
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      requiresPrescription: product.requiresPrescription,
      emoji: product.emoji,
      tone: product.tone,
      description: product.description,
      ingredients: product.ingredients ?? '',
      usage: product.usage ?? '',
      storage: product.storage ?? '',
      warning: product.warning ?? '',
    })
    setModalOpen(true)
  }

  const onSubmit = (values: FormValues) => {
    const id = editing
      ? editing.id
      : values.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 40)

    if (!editing && products.some((p) => p.id === id)) {
      toast.error('Produk dengan nama serupa sudah ada. Ubah nama produk.')
      return
    }

    const product: Product = {
      id,
      name: values.name,
      brand: values.brand,
      category: values.category,
      price: values.price,
      originalPrice: values.originalPrice || undefined,
      stock: values.stock,
      requiresPrescription: values.requiresPrescription,
      description: values.description,
      ingredients: values.ingredients,
      usage: values.usage,
      storage: values.storage,
      warning: values.warning,
      emoji: values.emoji,
      tone: values.tone,
      rating: editing?.rating ?? 4.7,
      reviews: editing?.reviews ?? 0,
      sold: editing?.sold ?? 0,
      createdAt: editing?.createdAt ?? new Date().toISOString().slice(0, 10),
      badges: values.requiresPrescription ? ['Resep'] : editing?.badges,
    }

    upsertProduct(product)
    setModalOpen(false)
    toast.success(editing ? 'Produk diperbarui' : 'Produk ditambahkan')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Manajemen produk</h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            {products.length} produk dalam katalog apotek.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah produk
        </Button>
      </div>

      <div className="clay p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="product-search" className="sr-only">Cari produk</label>
            <input
              id="product-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama produk atau merek…"
              className="input-clay pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter kategori"
            className="sm:w-56"
          >
            <option value="all">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </Select>
        </div>

        <div className="mt-4 space-y-2">
          <div className="hidden grid-cols-[2.4fr_1fr_1fr_0.8fr_auto] gap-3 px-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted lg:grid">
            <span>Produk</span>
            <span>Kategori</span>
            <span>Harga</span>
            <span>Stok</span>
            <span className="text-right">Aksi</span>
          </div>
          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-cream px-4 py-8 text-center text-sm text-muted">
              Tidak ada produk yang cocok dengan pencarian.
            </p>
          ) : (
            filtered.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-cream/70 px-3 py-2.5 lg:grid-cols-[2.4fr_1fr_1fr_0.8fr_auto]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg', product.tone)}>
                    {product.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{product.name}</p>
                    <p className="truncate text-[10px] text-muted">
                      {product.brand}
                      {product.requiresPrescription && ' · Perlu resep'}
                    </p>
                  </div>
                </div>
                <p className="hidden truncate text-[11px] text-muted lg:block">
                  {categories.find((c) => c.slug === product.category)?.name}
                </p>
                <p className="hidden text-xs font-semibold lg:block">{formatIDR(product.price)}</p>
                <p
                  className={cx(
                    'hidden text-xs font-bold lg:block',
                    product.stock === 0 ? 'text-error' : product.stock <= 10 ? 'text-warning' : 'text-success',
                  )}
                >
                  {product.stock}
                </p>
                <div className="col-span-3 flex items-center gap-1.5 lg:col-span-1 lg:justify-end">
                  <p className="mr-auto text-xs font-semibold lg:hidden">
                    {formatIDR(product.price)} · stok {product.stock}
                  </p>
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    aria-label={`Ubah ${product.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full bg-white text-muted shadow-clay-sm transition hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(product)}
                    aria-label={`Hapus ${product.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full bg-white text-muted shadow-clay-sm transition hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Ubah produk' : 'Tambah produk'}
        description="Data produk langsung tampil di toko setelah disimpan."
        size="lg"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)}>Simpan produk</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <Field label="Nama produk" htmlFor="p-name" error={errors.name?.message} required>
              <Input id="p-name" {...register('name')} />
            </Field>
          </div>
          <Field label="Merek" htmlFor="p-brand" error={errors.brand?.message} required>
            <Input id="p-brand" {...register('brand')} />
          </Field>
          <Field label="Kategori" htmlFor="p-category" error={errors.category?.message} required>
            <Select id="p-category" {...register('category')}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Harga jual (Rp)" htmlFor="p-price" error={errors.price?.message} required>
            <Input id="p-price" type="number" min={500} {...register('price')} />
          </Field>
          <Field label="Harga sebelum diskon (Rp)" htmlFor="p-original" error={errors.originalPrice?.message}>
            <Input id="p-original" type="number" min={0} placeholder="Opsional" {...register('originalPrice')} />
          </Field>
          <Field label="Stok" htmlFor="p-stock" error={errors.stock?.message} required>
            <Input id="p-stock" type="number" min={0} {...register('stock')} />
          </Field>
          <Field label="Emoji produk" htmlFor="p-emoji" error={errors.emoji?.message} hint="Contoh: 💊 🧴 🩺" required>
            <Input id="p-emoji" maxLength={4} {...register('emoji')} />
          </Field>
          <Field label="Warna latar" htmlFor="p-tone">
            <Select id="p-tone" {...register('tone')}>
              {toneOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 self-end rounded-2xl bg-cream px-3 py-2.5 text-xs">
            <input type="checkbox" className="h-4 w-4 accent-primary" {...register('requiresPrescription')} />
            Memerlukan resep dokter
          </label>
          <div className="sm:col-span-2">
            <Field label="Deskripsi" htmlFor="p-desc" error={errors.description?.message} required>
              <Textarea id="p-desc" rows={3} {...register('description')} />
            </Field>
          </div>
          <Field label="Bahan aktif / komposisi" htmlFor="p-ingredients">
            <Input id="p-ingredients" {...register('ingredients')} />
          </Field>
          <Field label="Aturan pakai" htmlFor="p-usage">
            <Input id="p-usage" {...register('usage')} />
          </Field>
          <Field label="Cara penyimpanan" htmlFor="p-storage">
            <Input id="p-storage" {...register('storage')} />
          </Field>
          <Field label="Peringatan" htmlFor="p-warning">
            <Input id="p-warning" {...register('warning')} />
          </Field>
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Hapus produk?"
        description="Produk akan hilang dari katalog. Riwayat pesanan lama tidak berubah."
        size="sm"
        footer={
          <>
            <Button variant="soft" size="sm" onClick={() => setDeleting(null)}>Batal</Button>
            <Button
              size="sm"
              className="bg-gradient-to-br from-red-500 to-error shadow-[0_8px_18px_rgba(185,28,28,0.3)]"
              onClick={() => {
                if (deleting) deleteProduct(deleting.id)
                setDeleting(null)
                toast.success('Produk dihapus dari katalog')
              }}
            >
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          {deleting?.name} · {deleting?.brand}
        </p>
      </Modal>
    </div>
  )
}
