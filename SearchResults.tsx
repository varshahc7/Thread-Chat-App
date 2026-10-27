import { useQuery } from '@tanstack/react-query'
import { useDebounced } from '../../hooks/useDebounced'
import { api } from '../../services/api'
import { useChatStore } from '../../store/chatStore'
import { listTime, previewText } from '../../utils/format'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/controls'
import { ConversationItem } from './ConversationItem'

interface Props {
  query: string
  meId: number
  onOpenConversation: (id: number) => void
  onOpenUser: (userId: number) => void
  onOpenMessage: (convId: number, messageId: number) => void
}

const Heading = ({ children }: { children: React.ReactNode }) => <h3 className="px-3 pb-1 pt-3 text-xs font-semibold text-muted">{children}</h3>

export function SearchResults({ query, meId, onOpenConversation, onOpenUser, onOpenMessage }: Props) {
  const q = useDebounced(query.trim(), 250)
  const conversations = useChatStore((s) => s.conversations)
  const users = useQuery({ queryKey: ['user-search', q], queryFn: () => api.searchUsers(q), enabled: q.length >= 1 })
  const msgs = useQuery({ queryKey: ['msg-search', q], queryFn: () => api.searchMessages(q), enabled: q.length >= 2 })
  const ql = q.toLowerCase()
  const convMatches = conversations.filter((c) => c.other_user.display_name.toLowerCase().includes(ql) || c.other_user.username.includes(ql))
  const busy = users.isFetching || msgs.isFetching
  const nothing = !busy && convMatches.length === 0 && !(users.data?.length) && !(msgs.data?.length)

  return (
    <div className="flex-1 overflow-y-auto p-2" aria-live="polite">
      {convMatches.length > 0 && (
        <>
          <Heading>Conversations</Heading>
          <ul>{convMatches.map((c) => <ConversationItem key={c.id} conv={c} active={false} meId={meId} typing={false} onOpen={onOpenConversation} />)}</ul>
        </>
      )}
      {!!users.data?.length && (
        <>
          <Heading>People</Heading>
          <ul>
            {users.data.map((u) => (
              <li key={u.id}>
                <button onClick={() => onOpenUser(u.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-raised">
                  <Avatar user={u} size={40} showStatus />
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{u.display_name}</span><span className="block truncate text-sm text-muted">@{u.username}</span></span>
                  <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">Message</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {!!msgs.data?.length && (
        <>
          <Heading>Messages</Heading>
          <ul>
            {msgs.data.map((m) => (
              <li key={m.id}>
                <button onClick={() => onOpenMessage(m.conversation_id, m.id)} className="w-full rounded-xl px-3 py-2.5 text-left hover:bg-raised">
                  <span className="flex items-baseline justify-between gap-2"><span className="truncate font-semibold">{m.sender_id === meId ? `You → ${m.other_name}` : m.other_name}</span><time className="shrink-0 text-xs text-muted">{listTime(m.created_at)}</time></span>
                  <span className="line-clamp-2 text-sm text-muted">{previewText(m)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {busy && <div className="flex justify-center p-4"><Spinner className="h-5 w-5 text-muted" /></div>}
      {nothing && <p className="p-6 text-center text-sm text-muted">No people or messages match “{q}”.</p>}
    </div>
  )
}
