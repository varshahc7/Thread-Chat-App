import { memo } from 'react'
import type { Conversation } from '../../types'
import { listTime, previewText } from '../../utils/format'
import { Avatar } from '../ui/Avatar'

export const ConversationItem = memo(function ConversationItem({ conv, active, meId, typing, onOpen }: { conv: Conversation; active: boolean; meId: number; typing: boolean; onOpen: (id: number) => void }) {
  const last = conv.last_message
  const unread = conv.unread_count
  return (
    <li>
      <button
        onClick={() => onOpen(conv.id)}
        aria-current={active ? 'true' : undefined}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? 'bg-accent/10' : 'hover:bg-raised'}`}
      >
        <Avatar user={conv.other_user} size={46} showStatus />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={`truncate ${unread ? 'font-bold' : 'font-semibold'}`}>{conv.other_user.display_name}</span>
            {last && <time className={`shrink-0 text-xs ${unread ? 'font-semibold text-accent' : 'text-muted'}`}>{listTime(last.created_at)}</time>}
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className={`truncate text-sm ${typing ? 'font-semibold text-accent' : unread ? 'text-ink' : 'text-muted'}`}>
              {typing ? 'typing…' : last ? `${last.sender_id === meId ? 'You: ' : ''}${previewText(last)}` : 'No messages yet'}
            </span>
            {unread > 0 && (
              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-fg" aria-label={`${unread} unread`}>{unread > 99 ? '99+' : unread}</span>
            )}
          </span>
        </span>
      </button>
    </li>
  )
})
