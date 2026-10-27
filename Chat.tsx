import { Lock, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChatHeader } from '../components/chat/ChatHeader'
import { ConversationSearch } from '../components/chat/ConversationSearch'
import { MessageInput } from '../components/chat/MessageInput'
import { MessageList } from '../components/chat/MessageList'
import { ProfilePanel } from '../components/profile/ProfilePanel'
import { Sidebar } from '../components/sidebar/Sidebar'
import { useMe } from '../hooks/useAuth'
import { useActiveConversation } from '../hooks/useChat'
import { useChatStore } from '../store/chatStore'
import { useUiStore } from '../store/uiStore'

function EmptyState() {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-8 text-center md:flex">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-accent/10 text-accent"><Lock size={28} /></span>
      <h2 className="text-xl font-extrabold">Select a conversation</h2>
      <p className="max-w-xs text-sm text-muted">Choose someone from your conversations, or search for a person to start a private chat.</p>
      <button onClick={() => document.querySelector<HTMLInputElement>('input[aria-label="Search people and messages"]')?.focus()} className="mt-1 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg"><Search size={16} /> Find people</button>
    </div>
  )
}

function ChatView({ convId }: { convId: number }) {
  const me = useMe()
  const nav = useNavigate()
  const conv = useActiveConversation()
  const messages = useChatStore((s) => s.messages[convId])
  const loading = useChatStore((s) => !!s.loadingMsgs[convId])
  const hasMore = useChatStore((s) => !!s.hasMore[convId])
  const detached = useChatStore((s) => !!s.detached[convId])
  const typing = useChatStore((s) => !!s.typing[convId])
  const highlightId = useChatStore((s) => s.highlightId)
  const infoOpen = useUiStore((s) => s.infoOpen)
  const setInfoOpen = useUiStore((s) => s.setInfoOpen)
  const [searching, setSearching] = useState(false)
  useEffect(() => setSearching(false), [convId])
  if (!conv) return <div className="flex-1" aria-busy />
  const st = useChatStore.getState()

  return (
    <>
      <main className="flex min-w-0 flex-1 flex-col bg-bg">
        <ChatHeader conv={conv} typing={typing} onBack={() => nav('/chat')} onSearch={() => setSearching((v) => !v)} onInfo={() => setInfoOpen(!infoOpen)} infoOpen={infoOpen} />
        {searching && <ConversationSearch convId={convId} onClose={() => setSearching(false)} />}
        <MessageList
          convId={convId} meId={me.id} otherName={conv.other_user.display_name} messages={messages ?? []} loading={loading}
          hasMore={hasMore} detached={detached} typing={typing} highlightId={highlightId}
          onLoadOlder={() => st.loadOlder(convId)} onJumpLatest={() => void st.jumpToLatest(convId)} onRetry={(id) => st.retry(convId, id)}
        />
        {conv.other_user.status === 'offline' && (
          <p className="border-t border-line bg-surface px-4 pt-2 text-center text-xs text-muted">{conv.other_user.display_name} is offline. Messages are saved and delivered when they're back.</p>
        )}
        <MessageInput key={convId} convId={convId} otherName={conv.other_user.display_name} />
      </main>
      {infoOpen && (
        <aside className="fixed inset-0 z-30 animate-slideIn xl:static xl:z-auto xl:w-80 xl:shrink-0 xl:border-l xl:border-line">
          <ProfilePanel conv={conv} onClose={() => setInfoOpen(false)} />
        </aside>
      )}
    </>
  )
}

export default function Chat() {
  const { id } = useParams()
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const convId = id ? Number(id) : null

  useEffect(() => {
    const store = useChatStore.getState()
    if (!convId || Number.isNaN(convId)) { store.setActive(null); return }
    const around = Number(sp.get('m')) || undefined
    if (around) setSp({}, { replace: true })
    void store.openConversation(convId, around).then((ok) => { if (!ok) nav('/chat', { replace: true }) })
    return () => { if (useChatStore.getState().activeId === convId) useChatStore.getState().setActive(null) }
  }, [convId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-dvh min-h-0 flex-1 overflow-hidden bg-surface text-ink">
      <aside className={`${convId ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-line bg-surface md:w-[340px] lg:w-[370px]`}>
        <Sidebar />
      </aside>
      <div className={`${convId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1`}>
        {convId && !Number.isNaN(convId) ? <ChatView convId={convId} /> : <EmptyState />}
      </div>
    </div>
  )
}
