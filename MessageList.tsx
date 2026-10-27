import { ArrowDown } from 'lucide-react'
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Message } from '../../types'
import { dayLabel } from '../../utils/format'
import { Button, Spinner } from '../ui/controls'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

interface Props {
  convId: number
  meId: number
  otherName: string
  messages: Message[]
  loading: boolean
  hasMore: boolean
  detached: boolean
  typing: boolean
  highlightId: number | null
  onLoadOlder: () => Promise<void>
  onJumpLatest: () => void
  onRetry: (clientId: string) => void
}

export function MessageList({ convId, meId, otherName, messages, loading, hasMore, detached, typing, highlightId, onLoadOlder, onJumpLatest, onRetry }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)
  const lastConv = useRef<number | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const last = messages[messages.length - 1]

  useLayoutEffect(() => {
    const el = box.current
    if (!el || (highlightId && messages.some((m) => m.id === highlightId))) return
    const changed = lastConv.current !== convId
    lastConv.current = convId
    if (changed || atBottom.current || last?.sender_id === meId) {
      el.scrollTo({ top: el.scrollHeight, behavior: changed ? 'auto' : 'smooth' })
    }
  }, [convId, messages.length, last?.id, typing, highlightId, meId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!highlightId) return
    box.current?.querySelector(`[data-mid="${highlightId}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlightId, messages.length])

  const older = async () => {
    const el = box.current
    if (!el) return
    setLoadingOlder(true)
    const prev = el.scrollHeight
    await onLoadOlder()
    requestAnimationFrame(() => { el.scrollTop += el.scrollHeight - prev })
    setLoadingOlder(false)
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 space-y-3 p-4" aria-busy>
        {[60, 40, 72, 48].map((w, i) => (
          <div key={i} className={`flex ${i % 2 ? 'justify-end' : ''}`}><div className="skeleton h-11 rounded-2xl" style={{ width: `${w}%`, maxWidth: 360 }} /></div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={box}
        onScroll={(e) => { const el = e.currentTarget; atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120 }}
        className="h-full space-y-1 overflow-y-auto px-3 py-4 sm:px-6"
      >
        {hasMore && messages.length > 0 && (
          <div className="flex justify-center pb-2">
            <Button variant="soft" className="!py-1.5 text-xs" onClick={older} disabled={loadingOlder}>{loadingOlder ? <Spinner /> : null} Load earlier messages</Button>
          </div>
        )}
        {messages.length === 0 && (
          <p className="pt-16 text-center text-sm text-muted">No messages yet. Say hello to {otherName}.</p>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
          const gap = prev && prev.sender_id !== m.sender_id ? 'pt-2.5' : ''
          return (
            <Fragment key={m.client_id && m.id < 0 ? m.client_id : m.id}>
              {newDay && (
                <div className="sticky top-0 z-10 flex justify-center py-2">
                  <span className="rounded-full bg-raised/95 px-3 py-1 text-xs font-medium text-muted shadow-sm">{dayLabel(m.created_at)}</span>
                </div>
              )}
              <div className={gap}><MessageBubble m={m} mine={m.sender_id === meId} highlighted={m.id === highlightId} onRetry={onRetry} /></div>
            </Fragment>
          )
        })}
        {typing && <TypingIndicator name={otherName} />}
      </div>
      {detached && (
        <Button onClick={onJumpLatest} className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg"><ArrowDown size={16} /> Jump to latest</Button>
      )}
    </div>
  )
}
