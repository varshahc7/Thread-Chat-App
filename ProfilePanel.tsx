import { useQuery } from '@tanstack/react-query'
import { FileText, X } from 'lucide-react'
import { downloadAttachment, useAuthedBlob } from '../../hooks/useAuthedBlob'
import { api } from '../../services/api'
import type { Conversation } from '../../types'
import { fileSize, lastSeenText } from '../../utils/format'
import { Avatar } from '../ui/Avatar'
import { IconButton } from '../ui/controls'

function Thumb({ id, name }: { id: number; name: string }) {
  const { url } = useAuthedBlob(id)
  return url ? <img src={url} alt={name} className="aspect-square w-full rounded-lg object-cover" loading="lazy" /> : <div className="skeleton aspect-square w-full" />
}

export function ProfilePanel({ conv, onClose }: { conv: Conversation; onClose: () => void }) {
  const u = conv.other_user
  const { data: media } = useQuery({ queryKey: ['media', conv.id, conv.last_message?.id], queryFn: () => api.media(conv.id), staleTime: 10000 })
  const images = media?.filter((m) => m.is_image) ?? []
  const files = media?.filter((m) => !m.is_image) ?? []
  const status = u.status === 'online' ? 'Online' : u.status === 'away' ? 'Away' : lastSeenText(u.last_seen)
  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-bold">Contact</h2>
        <IconButton label="Close details" onClick={onClose}><X size={18} /></IconButton>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col items-center text-center">
          <Avatar user={u} size={96} showStatus />
          <h3 className="mt-3 text-lg font-extrabold">{u.display_name}</h3>
          <p className="text-sm text-muted">@{u.username}</p>
          <p className={`mt-1 text-sm ${u.status === 'online' ? 'font-semibold text-accent' : 'text-muted'}`}>{status}</p>
        </div>
        <section className="mt-6"><h4 className="text-sm font-bold">About</h4><p className="mt-1 text-sm text-muted">{u.bio || 'No bio yet.'}</p></section>
        <section className="mt-6">
          <h4 className="text-sm font-bold">Shared media</h4>
          {images.length === 0 ? <p className="mt-1 text-sm text-muted">Photos you share will appear here.</p> : (
            <div className="mt-2 grid grid-cols-3 gap-1.5">{images.map((m) => <Thumb key={m.id} id={m.id} name={m.filename} />)}</div>
          )}
        </section>
        <section className="mt-6">
          <h4 className="text-sm font-bold">Shared files</h4>
          {files.length === 0 ? <p className="mt-1 text-sm text-muted">Documents you share will appear here.</p> : (
            <ul className="mt-2 space-y-1">
              {files.map((f) => (
                <li key={f.id}>
                  <button onClick={() => void downloadAttachment(f.id, f.filename)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-raised">
                    <FileText size={20} className="shrink-0 text-muted" />
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold">{f.filename}</span><span className="block text-xs text-muted">{fileSize(f.file_size)}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
