import { Link } from 'react-router-dom'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { ProductVisual } from '@/components/ProductCard'
import { Button, EmptyState } from '@/components/ui'
import { useCatalog, useCommerce } from '@/lib/store'
import { FREE_SHIPPING_MIN, formatIDR, shippingFor } from '@/lib/utils'

export default function Cart() {
  const cart = useCommerce((s) => s.cart)
  const products = useCatalog((s) => s.products)
  const setQty = useCommerce((s) => s.setQty)
  const removeFromCart = useCommerce((s) => s.removeFromCart)
  const clearCart = useCommerce((s) => s.clearCart)

  const lines = cart
    .map((line) => ({ ...line, product: products.find((p) => p.id === line.productId) }))
    .filter((l) => l.product)

  const subtotal = lines.reduce((acc, l) => acc + (l.product?.price ?? 0) * l.qty, 0)
  const shipping = shippingFor(subtotal)
  const remaining = Math.max(0, FREE_SHIPPING_MIN - subtotal)
  const hasRx = lines.some((l) => l.product?.requiresPrescription)

  if (lines.length === 0) {
    return (
      <div className="page-container pt-8">
        <h1 className="text-3xl font-extrabold">Keranjang belanja</h1>
        <div className="mt-6">
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6" />}
            title="Keranjangmu masih kosong"
            description="Yuk mulai belanja kebutuhan kesehatanmu. Produk yang ditambahkan akan muncul di sini."
            action={
              <Link to="/shop" className="btn-clay px-6 py-3">
                Mulai belanja <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Keranjang belanja</h1>
          <p className="mt-1 text-sm text-muted">
            {lines.length} produk · {lines.reduce((a, l) => a + l.qty, 0)} item
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearCart()
            toast.success('Keranjang dikosongkan')
          }}
          className="btn-ghost text-error hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" /> Kosongkan
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {lines.map(({ product, qty }) => (
            <article key={product!.id} className="clay flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link to={`/product/${product!.id}`} className="shrink-0">
                <ProductVisual product={product!} size="sm" className="h-20 w-20 text-3xl sm:h-24 sm:w-24 sm:text-4xl" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {product!.brand}
                    </p>
                    <Link
                      to={`/product/${product!.id}`}
                      className="line-clamp-2 font-display text-sm font-bold hover:text-primary-dark"
                    >
                      {product!.name}
                    </Link>
                    {product!.requiresPrescription && (
                      <span className="chip mt-1 bg-primary-soft text-primary-dark">Perlu resep</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeFromCart(product!.id)
                      toast.success('Produk dihapus dari keranjang')
                    }}
                    aria-label={`Hapus ${product!.name}`}
                    className="rounded-full p-1.5 text-muted transition hover:bg-red-50 hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1 rounded-full bg-cream p-1">
                    <button
                      type="button"
                      onClick={() => setQty(product!.id, qty - 1)}
                      disabled={qty <= 1}
                      aria-label="Kurangi jumlah"
                      className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink shadow-clay-sm disabled:opacity-40"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center font-display text-xs font-bold" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(product!.id, qty + 1)}
                      disabled={qty >= product!.stock}
                      aria-label="Tambah jumlah"
                      className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink shadow-clay-sm disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-extrabold">
                      {formatIDR(product!.price * qty)}
                    </p>
                    {qty > 1 && (
                      <p className="text-[10px] text-muted">
                        {formatIDR(product!.price)} / item
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}

          <Link to="/shop" className="btn-soft inline-flex px-5 py-2.5 text-xs">
            Lanjut belanja
          </Link>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="clay p-5">
            <h2 className="font-display text-base font-bold">Ringkasan pesanan</h2>

            <div className="mt-4 rounded-2xl bg-mint/50 p-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-success">
                <Truck className="h-3.5 w-3.5" />
                {remaining > 0
                  ? `Tambah ${formatIDR(remaining)} untuk gratis ongkir`
                  : 'Selamat! Kamu mendapat gratis ongkir'}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full bg-success/70 transition-all"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100)}%` }}
                />
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold">{formatIDR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Ongkos kirim</dt>
                <dd className="font-semibold">{shipping === 0 ? 'Gratis' : formatIDR(shipping)}</dd>
              </div>
              <div className="my-2 h-px bg-primary/10" />
              <div className="flex justify-between text-base">
                <dt className="font-display font-bold">Total</dt>
                <dd className="font-display font-extrabold text-primary-dark">
                  {formatIDR(subtotal + shipping)}
                </dd>
              </div>
            </dl>

            {hasRx && (
              <p className="mt-3 rounded-xl bg-primary-soft/70 p-2.5 text-[11px] leading-relaxed text-primary-dark">
                Keranjangmu memuat obat resep. Kamu akan diminta mengunggah resep pada langkah
                checkout.
              </p>
            )}

            <Link to="/checkout" className="btn-clay mt-4 w-full py-3.5">
              Checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-2 text-center text-[11px] text-muted">
              Pembayaran diproses melalui kanal resmi NEON PHARMA.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
