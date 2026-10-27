import { AlertCircle, Check, CheckCheck, Clock, Download, FileText } from 'lucide-react'
import { memo } from 'react'
import { downloadAttachment, useAuthedBlob } from '../../hooks/useAuthedBlob'
import type { Message } from '../../types'
import { fileSize, formatTime } from '../../utils/format'

function Ticks({ m }: { m: Message }) {
  if (m.local === 'pending') return <Clock size={12} aria-label="Sending" />
  if (m.status === 'sent') return <Check size={14} aria-label="Sent" />
  if (m.status === 'delivered') return <CheckCheck size={14} aria-label="Delivered" />
  return <CheckCheck size={14} aria-label="Read" className="text-sky-300" strokeWidth={2.6} />
}

function AttachmentImage({ m }: { m: Message }) {
  const { url, failed } = useAuthedBlob(m.preview_url ? null : m.attachment?.id)
  const src = m.preview_url ?? url
  if (!src) return <div className={`skeleton h-40 w-56 ${failed ? 'opacity-50' : ''}`} />
  return <img src={src} alt={m.attachment?.filename ?? 'Image'} className="max-h-72 w-full max-w-[16rem] rounded-xl object-cover" loading="lazy" />
}

function AttachmentFile({ m, mine }: { m: Message; mine: boolean }) {
  const a = m.attachment!
  return (
    <button
      type="button"
      disabled={!a.id}
      onClick={() => void downloadAttachment(a.id, a.filename)}
      className={`flex w-full max-w-[16rem] items-center gap-3 rounded-xl p-2.5 text-left transition ${mine ? 'bg-white/10 hover:bg-white/20' : 'bg-raised hover:bg-line'}`}
    >
      <FileText size={22} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{a.filename}</span>
        <span className="block text-xs opacity-70">{fileSize(a.file_size)}</span>
      </span>
      <Download size={16} className="shrink-0 opacity-70" />
    </button>
  )
}

export const MessageBubble = memo(function MessageBubble({ m, mine, highlighted, onRetry }: { m: Message; mine: boolean; highlighted: boolean; onRetry: (clientId: string) => void }) {
  const tone = mine ? 'bg-out text-out-fg rounded-br-md' : 'bg-inb text-ink border border-line rounded-bl-md'
  return (
    <div data-mid={m.id} className={`flex animate-pop ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] ${tone} ${highlighted ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-bg' : ''} ${m.local === 'failed' ? 'opacity-80 outline outline-1 outline-red-500' : ''}`}>
        {m.attachment && (
          <div className={m.content ? 'mb-1.5' : ''}>
            {m.attachment.is_image ? <AttachmentImage m={m} /> : <AttachmentFile m={m} mine={mine} />}
          </div>
        )}
        {m.content && <p className="whitespace-pre-wrap text-[15px] leading-snug [overflow-wrap:anywhere]">{m.content}</p>}
        <div className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${mine ? 'text-out-fg/70' : 'text-muted'}`}>
          {m.local === 'failed' ? (
            <button onClick={() => m.client_id && onRetry(m.client_id)} className="flex items-center gap-1 font-semibold text-red-300 hover:underline">
              <AlertCircle size={12} /> Not sent · Retry
            </button>
          ) : (
            <>
              <time dateTime={m.created_at}>{formatTime(m.created_at)}</time>
              {mine && <Ticks m={m} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
})
