import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field } from '../components/ui/controls'
import { ApiError } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { AuthLayout } from './AuthLayout'

export default function Login() {
  const login = useAuthStore((s) => s.login)
  const nav = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try { await login(identifier, password, remember); nav('/chat', { replace: true }) }
    catch (err) { setError(err instanceof ApiError ? (err.status === 0 ? 'Unable to connect. Trying again may help.' : err.message) : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up your conversations.">
      <form onSubmit={submit} className="space-y-4">
        {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">{error}</div>}
        <Field label="Email or username" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus />
        <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" /> Keep me signed in</label>
          <Link to="/forgot-password" className="font-semibold text-accent hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New here? <Link to="/register" className="font-semibold text-accent hover:underline">Create an account</Link></p>
    </AuthLayout>
  )
}
