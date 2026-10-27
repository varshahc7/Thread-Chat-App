import { Paperclip, SendHorizontal, Smile } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../store/chatStore'
import { useUiStore } from '../../store/uiStore'
import { EmojiPicker } from './EmojiPicker'

const ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.doc,.docx'
const MAX_MB = 10

export function MessageInput({ convId, otherName }: { convId: number; otherName: string }) {
  const [text, setText] = useState('')
  const [emoji, setEmoji] = useState(false)
  const area = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const typingOn = useRef(false)
  const lastPing = useRef(0)
  const idle = useRef<number | undefined>(undefined)
  const { sendText, sendFile, sendTyping } = useChatStore.getState()

  const stopTyping = () => { window.clearTimeout(idle.current); if (typingOn.current) { typingOn.current = false; sendTyping(convId, false) } }
  useEffect(() => () => stopTyping(), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { area.current?.focus() }, [convId])
  useEffect(() => {
    const el = area.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px' }
  }, [text])

  const onChange = (v: string) => {
    setText(v)
    if (!v.trim()) return stopTyping()
    if (!typingOn.current || Date.now() - lastPing.current > 3000) { typingOn.current = true; lastPing.current = Date.now(); sendTyping(convId, true) }
    window.clearTimeout(idle.current)
    idle.current = window.setTimeout(stopTyping, 2500)
  }

  const submit = () => {
    if (!text.trim()) return
    stopTyping()
    void sendText(convId, text)
    setText('')
    setEmoji(false)
  }

  const pickFile = (f: File | undefined) => {
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) return useUiStore.getState().toast({ title: `File is too large (max ${MAX_MB} MB)`, kind: 'error' })
    void sendFile(convId, f, text)
    setText('')
    if (file.current) file.current.value = ''
  }

  return (
    <div className="relative border-t border-line bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {emoji && <EmojiPicker onPick={(e) => { setText((t) => t + e); area.current?.focus() }} />}
      <div className="flex items-end gap-1.5 rounded-2xl border border-line bg-bg px-2 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
        <button type="button" onClick={() => setEmoji((v) => !v)} aria-label="Emoji" aria-expanded={emoji} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"><Smile size={20} /></button>
        <button type="button" onClick={() => file.current?.click()} aria-label="Attach a file" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"><Paperclip size={20} /></button>
        <input ref={file} type="file" accept={ACCEPT} hidden onChange={(e) => pickFile(e.target.files?.[0])} />
        <textarea
          ref={area}
          rows={1}
          value={text}
          maxLength={5000}
          placeholder={`Message ${otherName}`}
          aria-label="Type a message"
          onChange={(e) => onChange(e.target.value)}
          onBlur={stopTyping}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }}
          className="max-h-36 min-h-[2.25rem] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-snug outline-none placeholder:text-muted/70 focus-visible:ring-0"
        />
        <button type="button" onClick={submit} disabled={!text.trim()} aria-label="Send message" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-accent-fg transition hover:opacity-90 disabled:bg-raised disabled:text-muted"><SendHorizontal size={18} /></button>
      </div>
    </div>
  )
}
