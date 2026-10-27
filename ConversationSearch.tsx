import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDebounced } from '../../hooks/useDebounced'
import { api } from '../../services/api'
import { useChatStore } from '../../store/chatStore'
import { formatTime, previewText } from '../../utils/format'
import { IconButton, Spinner } from '../ui/controls'

/** Search inside the open conversation; picking a result jumps to that message. */
export function ConversationSearch({ convId, onClose }: { convId: number; onClose: () => void }) {
  const [q, setQ] = useState('')
  const dq = useDebounced(q.trim(), 250)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => input.current?.focus(), [])
  const { data, isFetching } = useQuery({ queryKey: ['convsearch', dq], queryFn: () => api.searchMessages(dq), enabled: dq.length >= 2 })
  const results = (data ?? []).filter((m) => m.conversation_id === convId)
  return (
    <div className="animate-fade border-b border-line bg-surface px-3 py-2">
      <div className="flex items-center gap-2">
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this conversation" aria-label="Search this conversation" className="flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent" onKeyDown={(e) => e.key === 'Escape' && onClose()} />
        {isFetching && <Spinner />}
        <IconButton label="Close search" onClick={onClose}><X size={18} /></IconButton>
      </div>
      {dq.length >= 2 && !isFetching && (
        <ul className="mt-2 max-h-48 overflow-y-auto">
          {results.length === 0 && <li className="px-2 py-2 text-sm text-muted">No messages match “{dq}”.</li>}
          {results.map((m) => (
            <li key={m.id}>
              <button onClick={() => { void useChatStore.getState().openConversation(convId, m.id); onClose() }} className="flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-raised">
                <span className="truncate text-sm">{previewText(m)}</span>
                <span className="shrink-0 text-xs text-muted">{new Date(m.created_at).toLocaleDateString()} {formatTime(m.created_at)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
