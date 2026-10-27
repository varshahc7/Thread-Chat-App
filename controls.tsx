import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path d="M9 11h14M9 16h9M9 21h11" className="stroke-accent-fg" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export const Spinner = ({ className = 'h-4 w-4' }: { className?: string }) => <Loader2 className={`animate-spin ${className}`} />

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'soft'; loading?: boolean }
export function Button({ variant = 'primary', loading, className = '', children, disabled, ...p }: BtnProps) {
  const styles = {
    primary: 'bg-accent text-accent-fg hover:opacity-90',
    soft: 'bg-raised text-ink hover:bg-line',
    ghost: 'text-ink hover:bg-raised',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant]
  return (
    <button
      {...p}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export function IconButton({ label, className = '', children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...p} aria-label={label} title={label} className={`grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-raised hover:text-ink disabled:opacity-40 ${className}`}>
      {children}
    </button>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }
export function Field({ label, error, hint, type = 'text', className = '', ...p }: FieldProps) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPw && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? id + 'e' : undefined}
          {...p}
          className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25 ${error ? 'border-red-500' : 'border-line'} ${isPw ? 'pr-11' : ''}`}
        />
        {isPw && (
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-1.5 my-auto grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-ink">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? <p id={id + 'e'} role="alert" className="mt-1.5 text-xs text-red-500">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-4 py-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden className="relative h-6 w-11 shrink-0 rounded-full bg-line transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  )
}

export const Card = ({ title, children, description }: { title: string; description?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
    <h2 className="text-base font-bold">{title}</h2>
    {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
    <div className="mt-3">{children}</div>
  </section>
)
