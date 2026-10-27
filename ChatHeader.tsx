import { ArrowLeft, Info, Search } from 'lucide-react'
import type { Conversation } from '../../types'
import { lastSeenText } from '../../utils/format'
import { Avatar } from '../ui/Avatar'
import { IconButton } from '../ui/controls'

export function ChatHeader({ conv, typing, onBack, onSearch, onInfo, infoOpen }: { conv: Conversation; typing: boolean; onBack: () => void; onSearch: () => void; onInfo: () => void; infoOpen: boolean }) {
  const u = conv.other_user
  const status = typing ? 'typing…' : u.status === 'online' ? 'Online' : u.status === 'away' ? 'Away' : lastSeenText(u.last_seen)
  return (
    <header className="flex items-center gap-2 border-b border-line bg-surface px-2 py-2.5 sm:px-4">
      <IconButton label="Back to conversations" onClick={onBack} className="md:hidden"><ArrowLeft size={20} /></IconButton>
      <button onClick={onInfo} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left" aria-label={`View ${u.display_name}'s profile`}>
        <Avatar user={u} size={40} showStatus />
        <span className="min-w-0">
          <span className="block truncate font-bold leading-tight">{u.display_name}</span>
          <span className={`block truncate text-xs ${typing || u.status === 'online' ? 'font-semibold text-accent' : 'text-muted'}`}>{status}</span>
        </span>
      </button>
      <IconButton label="Search in conversation" onClick={onSearch}><Search size={19} /></IconButton>
      <IconButton label={infoOpen ? 'Hide details' : 'Show details'} onClick={onInfo} className={infoOpen ? '!bg-raised !text-ink' : ''}><Info size={19} /></IconButton>
    </header>
  )
}
