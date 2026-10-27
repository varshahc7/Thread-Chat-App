import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { Button, Card, Field } from '../components/ui/controls'
import { api, ApiError } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { PageShell } from './PageShell'

export default function Profile() {
  const user = useAuthStore((s) => s.user)!
  const setUser = useAuthStore((s) => s.setUser)
  const toast = useUiStore((s) => s.toast)
  const [name, setName] = useState(user.display_name)
  const [bio, setBio] = useState(user.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [upl, setUpl] = useState(false)
  const [error, setError] = useState('')
  const file = useRef<HTMLInputElement>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Display name is required.')
    setError(''); setSaving(true)
    try {
      setUser(await api.updateUser(user.id, { display_name: name.trim(), bio }))
      toast({ title: 'Profile saved', kind: 'success' })
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not save.') }
    finally { setSaving(false) }
  }

  const pick = async (f?: File) => {
    if (!f) return
    setUpl(true)
    try { setUser(await api.uploadAvatar(f)); toast({ title: 'Photo updated', kind: 'success' }) }
    catch (err) { toast({ title: err instanceof ApiError ? err.message : 'Upload failed', kind: 'error' }) }
    finally { setUpl(false); if (file.current) file.current.value = '' }
  }

  return (
    <PageShell title="Profile">
      <Card title="Your profile">
        <div className="mb-5 flex items-center gap-4">
          <div className="relative">
            <Avatar user={user} size={80} />
            <button type="button" onClick={() => file.current?.click()} disabled={upl} aria-label="Change photo" className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-fg shadow disabled:opacity-50"><Camera size={15} /></button>
            <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
          </div>
          <div><p className="font-bold">{user.display_name}</p><p className="text-sm text-muted">@{user.username}</p></div>
        </div>
        <form onSubmit={save} className="space-y-4">
          {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">{error}</div>}
          <Field label="Display name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <div>
            <label htmlFor="bio" className="mb-1.5 block text-sm font-medium">Bio</label>
            <textarea id="bio" value={bio} maxLength={200} rows={3} onChange={(e) => setBio(e.target.value)} className="w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25" />
            <p className="mt-1 text-right text-xs text-muted">{bio.length}/200</p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>Save changes</Button>
            <Link to="/settings" className="text-sm font-semibold text-accent hover:underline">More settings</Link>
          </div>
        </form>
      </Card>
    </PageShell>
  )
}
