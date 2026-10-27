import { Bug, LogOut, Moon, Settings, SquarePen, Sun } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import { useUiStore } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { IconButton, Logo } from '../ui/controls'
import { ConversationList } from './ConversationList'
import { SearchBar } from './SearchBar'
import { SearchResults } from './SearchResults'

export function Sidebar() {
  const me = useAuthStore((s) => s.user)!
  const logout = useAuthStore((s) => s.logout)
  useUiStore((s) => s.theme) // re-render when the theme changes
  const setTheme = useUiStore((s) => s.setTheme)
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const dark = document.documentElement.classList.contains('dark')

  const done = (path: string) => { setQ(''); nav(path) }
  const openUser = async (userId: number) => {
    try { done(`/chat/${await useChatStore.getState().startConversationWith(userId)}`) }
    catch { useUiStore.getState().toast({ title: 'User not found', kind: 'error' }) }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <Logo size={30} />
        <span className="flex-1 text-lg font-extrabold tracking-tight">Thread</span>
        <IconButton label="New message" onClick={() => input.current?.focus()}><SquarePen size={18} /></IconButton>
        <IconButton label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(dark ? 'light' : 'dark')}>{dark ? <Sun size={18} /> : <Moon size={18} />}</IconButton>
        <Link to="/settings" aria-label="Settings" title="Settings" className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-raised hover:text-ink"><Settings size={18} /></Link>
      </div>
      <div className="px-3 pb-2"><SearchBar ref={input} value={q} onChange={setQ} /></div>
      {q.trim() ? (
        <SearchResults query={q} meId={me.id} onOpenConversation={(id) => done(`/chat/${id}`)} onOpenUser={openUser} onOpenMessage={(c, m) => done(`/chat/${c}?m=${m}`)} />
      ) : (
        <ConversationList meId={me.id} onOpen={(id) => nav(`/chat/${id}`)} onFind={() => input.current?.focus()} />
      )}
      <div className="flex items-center gap-3 border-t border-line p-3">
        <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 hover:bg-raised" aria-label="Your profile">
          <Avatar user={{ ...me, status: 'online' }} size={38} showStatus />
          <span className="min-w-0"><span className="block truncate text-sm font-bold leading-tight">{me.display_name}</span><span className="block truncate text-xs text-muted">@{me.username}</span></span>
        </Link>
        {me.is_admin && <Link to="/debug" aria-label="Debug panel" title="Debug panel" className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-raised hover:text-ink"><Bug size={18} /></Link>}
        <IconButton label="Log out" onClick={() => void logout()}><LogOut size={18} /></IconButton>
      </div>
    </div>
  )
}
