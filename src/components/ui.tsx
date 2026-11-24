import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cx } from '@/lib/utils'

/* ------------------------------------------------------------------ form */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  required,
}: {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block font-display text-xs font-bold uppercase tracking-wide text-muted"
      >
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-semibold text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cx('input-clay', className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cx('input-clay min-h-[96px]', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cx('input-clay appearance-none pr-10', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronRight
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted"
      />
    </div>
  ),
)
Select.displayName = 'Select'

/* ----------------------------------------------------------------- cards */

export function Badge({
  children,
  tone = 'bg-primary-soft text-primary-dark',
  className,
}: {
  children: ReactNode
  tone?: string
  className?: string
}) {
  return <span className={cx('chip', tone, className)}>{children}</span>
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const width =
    size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl'

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-ink/35 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cx(
          'clay-lg relative my-0 w-full animate-pop-in p-5 sm:my-8 sm:p-7',
          width,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className="absolute right-4 top-4 rounded-full bg-cream/80 p-2 text-muted transition hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-10 font-display text-xl font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="clay flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary-dark shadow-clay-in">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  align?: 'left' | 'center'
}) {
  return (
    <div
      className={cx(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
      )}
    >
      <div className={cx('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-fluid-h2 font-extrabold">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx('animate-pulse rounded-2xl bg-[#E9E4F7]/80', className)}
    />
  )
}

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number
  pages: number
  onChange: (page: number) => void
}) {
  if (pages <= 1) return null
  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Navigasi halaman">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="grid h-10 w-10 place-items-center rounded-full bg-white text-muted shadow-clay-sm transition disabled:opacity-40"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={cx(
            'h-10 min-w-10 rounded-full px-3 font-display text-sm font-bold transition',
            n === page
              ? 'bg-primary text-white shadow-clay-btn'
              : 'bg-white text-muted shadow-clay-sm hover:text-primary-dark',
          )}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page === pages}
        className="grid h-10 w-10 place-items-center rounded-full bg-white text-muted shadow-clay-sm transition disabled:opacity-40"
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}

/* --------------------------------------------------------------- buttons */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'clay' | 'soft' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'clay',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const base = variant === 'clay' ? 'btn-clay' : variant === 'soft' ? 'btn-soft' : 'btn-ghost'
  return (
    <button
      type={type}
      className={cx(base, size === 'sm' && 'px-4 py-2 text-xs', className)}
      {...props}
    />
  )
}
