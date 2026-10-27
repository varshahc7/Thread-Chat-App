import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field } from '../components/ui/controls'
import { ApiError } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { AuthLayout } from './AuthLayout'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validate(f: { name: string; username: string; email: string; password: string; confirm: string }) {
  const e: Record<string, string> = {}
  if (!f.name.trim()) e.display_name = 'Enter your name'
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(f.username)) e.username = 'Use 3–32 letters, numbers or underscores'
  if (!EMAIL.test(f.email)) e.email = 'Enter a valid email address'
  if (f.password.length < 8) e.password = 'Use at least 8 characters'
  else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Include at least one letter and one number'
  if (f.confirm !== f.password) e.confirm = "Passwords don't match"
  return e
}

function Strength({ pw }: { pw: string }) {
  const score = useMemo(() => [pw.length >= 8, /[A-Z]/.test(pw) && /[a-z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw) || pw.length >= 12].filter(Boolean).length, [pw])
  if (!pw) return null
  const label = ['Weak', 'Weak', 'Okay', 'Good', 'Strong'][score]
  return (
    <div className="-mt-2 flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= score ? (score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-line'}`} />)}</div>
      <span className="w-11 text-xs text-muted">{label}</span>
    </div>
  )
}

export default function Register() {
  const register = useAuthStore((s) => s.register)
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate(f)
    setErrors(v); setFormError('')
    if (Object.keys(v).length) return
    setLoading(true)
    try { await register({ display_name: f.name.trim(), username: f.username, email: f.email, password: f.password }); nav('/chat', { replace: true }) }
    catch (err) {
      if (err instanceof ApiError) { setErrors(err.errors); if (!Object.keys(err.errors).length) setFormError(err.status === 0 ? 'Unable to connect. Please try again.' : err.message) }
      else setFormError('Something went wrong.')
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout title="Create your account" subtitle="It takes less than a minute.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">{formError}</div>}
        <Field label="Full name" autoComplete="name" value={f.name} onChange={set('name')} error={errors.display_name} autoFocus />
        <Field label="Username" autoComplete="username" value={f.username} onChange={set('username')} error={errors.username} hint="Others find you by this. Letters, numbers and underscores." />
        <Field label="Email" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={errors.email} />
        <Field label="Password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} error={errors.password} />
        <Strength pw={f.password} />
        <Field label="Confirm password" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link to="/login" className="font-semibold text-accent hover:underline">Sign in</Link></p>
    </AuthLayout>
  )
}
