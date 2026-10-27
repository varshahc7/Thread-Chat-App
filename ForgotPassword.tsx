import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Field } from '../components/ui/controls'
import { ApiError, api } from '../services/api'
import { AuthLayout } from './AuthLayout'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try { await api.forgot(email); setDone(true) } catch (err) { setError(err instanceof ApiError ? err.errors.email ?? err.message : 'Something went wrong.') } finally { setLoading(false) }
  }
  return (
    <AuthLayout title="Reset your password" subtitle="Enter your account email and we'll send reset instructions.">
      {done ? (
        <div role="status" className="rounded-xl bg-accent/10 p-4 text-sm">If an account exists for <b>{email}</b>, reset instructions are on their way. (Email delivery isn't configured in this project yet, see the README.)</div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div role="alert" className="text-sm text-red-500">{error}</div>}
          <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Button type="submit" loading={loading} className="w-full">Send instructions</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold text-accent hover:underline">Back to sign in</Link></p>
    </AuthLayout>
  )
}
