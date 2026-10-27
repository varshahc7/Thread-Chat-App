import { MessageSquarePlus } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { ConversationItem } from './ConversationItem'

export function ConversationList({ meId, onOpen, onFind }: { meId: number; onOpen: (id: number) => void; onFind: () => void }) {
  const conversations = useChatStore((s) => s.conversations)
  const loading = useChatStore((s) => s.loadingConvs)
  const activeId = useChatStore((s) => s.activeId)
  const typing = useChatStore((s) => s.typing)

  if (loading && conversations.length === 0) {
    return (
      <div className="space-y-2 p-3" aria-busy>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2"><div className="skeleton h-11 w-11 rounded-full" /><div className="flex-1 space-y-2"><div className="skeleton h-3 w-1/2" /><div className="skeleton h-3 w-4/5" /></div></div>
        ))}
      </div>
    )
  }
  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-raised text-muted"><MessageSquarePlus size={22} /></span>
        <p className="font-semibold">No conversations yet</p>
        <p className="text-sm text-muted">Search for a person by name or username to send your first private message.</p>
        <button onClick={onFind} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-fg">Find people</button>
      </div>
    )
  }
  return (
    <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
      {conversations.map((c) => (
        <ConversationItem key={c.id} conv={c} active={c.id === activeId} meId={meId} typing={!!typing[c.id]} onOpen={onOpen} />
      ))}
    </ul>
  )
}
