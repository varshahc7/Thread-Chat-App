import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, Card, Field, Toggle } from '../components/ui/controls'
import { api, ApiError, tokens } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useUiStore, type Theme } from '../store/uiStore'
import type { User } from '../types'
import { PageShell } from './PageShell'

function AccountCard({ user }: { user: User }) {
  const setUser = useAuthStore((s) => s.setUser)
  const toast = useUiStore((s) => s.toast)
  const [name, setName] = useState(user.display_name)
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [busy, setBusy] = useState(false)

  const saveName = async () => {
    try { setUser(await api.updateUser(user.id, { display_name: name.trim() })); toast({ title: 'Name updated', kind: 'success' }) }
    catch (e) { toast({ title: e instanceof ApiError ? e.message : 'Failed', kind: 'error' }) }
  }
  const changePw = async (e: React.FormEvent) => {
    e.preventDefault(); setPwErr('')
    if (next.length < 8) return setPwErr('New password must be at least 8 characters.')
    setBusy(true)
    try { await api.changePassword(cur, next); setCur(''); setNext(''); toast({ title: 'Password changed', body: 'Other devices were signed out.', kind: 'success' }) }
    catch (err) { setPwErr(err instanceof ApiError ? err.errors.new_password ?? err.errors.current_password ?? err.message : 'Failed') }
    finally { setBusy(false) }
  }
  return (
    <Card title="Account">
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <Field className="flex-1" label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button variant="soft" onClick={() => void saveName()} disabled={!name.trim() || name === user.display_name}>Save</Button>
        </div>
        <Field label="Username" value={`@${user.username}`} readOnly disabled />
        <Field label="Email" value={user.email ?? ''} readOnly disabled />
        <form onSubmit={changePw} className="space-y-3 border-t border-line pt-4">
          <h3 className="text-sm font-bold">Change password</h3>
          <Field label="Current password" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} required />
          <Field label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={pwErr} required />
          <Button type="submit" loading={busy}>Update password</Button>
        </form>
      </div>
    </Card>
  )
}

function SessionsCard() {
  const qc = useQueryClient()
  const toast = useUiStore((s) => s.toast)
  const clearLocal = useAuthStore((s) => s.clearLocal)
  const q = useQuery({ queryKey: ['sessions'], queryFn: api.sessions })
  const current = tokens.sessionId

  const revoke = async (id: number) => {
    try { await api.revokeSession(id); await qc.invalidateQueries({ queryKey: ['sessions'] }) }
    catch { toast({ title: 'Could not revoke session', kind: 'error' }) }
  }
  const all = async () => {
    try { await api.logoutAll() } catch { /* still clear locally */ }
    clearLocal()
  }
  return (
    <Card title="Security" description="Devices currently signed in to your account.">
      {q.isLoading ? <p className="text-sm text-muted">Loading…</p> : q.isError ? <p className="text-sm text-red-500">Could not load sessions.</p> : (
        <ul className="divide-y divide-line">
          {q.data!.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.user_agent || 'Unknown device'}{s.id === current && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">This device</span>}</p>
                <p className="text-xs text-muted">{s.ip ?? 'unknown IP'} · last active {new Date(s.last_used_at).toLocaleString()}</p>
              </div>
              {s.id !== current && <Button variant="soft" className="!px-3 !py-1.5" onClick={() => void revoke(s.id)}>Revoke</Button>}
            </li>
          ))}
        </ul>
      )}
      <Button variant="danger" className="mt-4" onClick={() => void all()}>Log out of all devices</Button>
    </Card>
  )
}

export default function Settings() {
  const user = useAuthStore((s) => s.user)!
  const setUser = useAuthStore((s) => s.setUser)
  const ui = useUiStore()

  const patch = async (p: Partial<User>) => {
    try { setUser(await api.updateUser(user.id, p)) }
    catch { ui.toast({ title: 'Could not save setting', kind: 'error' }) }
  }
  const desktop = async (v: boolean) => {
    if (v && 'Notification' in window && Notification.permission !== 'granted') {
      const r = await Notification.requestPermission()
      if (r !== 'granted') return ui.toast({ title: 'Desktop notifications blocked', body: 'Allow them in your browser settings.', kind: 'info' })
    }
    ui.setFlag('notifyDesktop', v)
  }

  return (
    <PageShell title="Settings">
      <AccountCard user={user} />
      <Card title="Appearance">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as Theme[]).map((t) => (
            <button key={t} role="radio" aria-checked={ui.theme === t} onClick={() => ui.setTheme(t)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ${ui.theme === t ? 'border-accent bg-accent/10 text-accent' : 'border-line hover:bg-raised'}`}>{t}</button>
          ))}
        </div>
      </Card>
      <Card title="Notifications">
        <div className="divide-y divide-line">
          <Toggle label="Message notifications" description="Show a toast for new messages in other chats." checked={ui.notifyMessages} onChange={(v) => ui.setFlag('notifyMessages', v)} />
          <Toggle label="Sound" checked={ui.notifySound} disabled={!ui.notifyMessages} onChange={(v) => ui.setFlag('notifySound', v)} />
          <Toggle label="Desktop notifications" description="When the tab is in the background." checked={ui.notifyDesktop} disabled={!ui.notifyMessages} onChange={(v) => void desktop(v)} />
        </div>
      </Card>
      <Card title="Privacy">
        <div className="divide-y divide-line">
          <Toggle label="Show online status" checked={user.show_online_status ?? true} onChange={(v) => void patch({ show_online_status: v })} />
          <Toggle label="Show last seen" checked={user.show_last_seen ?? true} onChange={(v) => void patch({ show_last_seen: v })} />
          <Toggle label="Read receipts" description="If off, you won't send or see read receipts." checked={user.read_receipts ?? true} onChange={(v) => void patch({ read_receipts: v })} />
        </div>
      </Card>
      <SessionsCard />
      {user.is_admin && <p className="text-center text-sm"><Link to="/debug" className="font-semibold text-accent hover:underline">Open debug panel</Link></p>}
    </PageShell>
  )
}
