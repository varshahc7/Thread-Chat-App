import { AlertCircle, CheckCircle2, Info, MessageCircle, X } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'

const ICON = { message: MessageCircle, error: AlertCircle, success: CheckCircle2, info: Info }
const TONE = { message: 'text-accent', error: 'text-red-500', success: 'text-emerald-500', info: 'text-muted' }

export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismiss)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3 sm:items-end sm:pr-4" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICON[t.kind]
        return (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-lg">
            <Icon size={20} className={`mt-0.5 shrink-0 ${TONE[t.kind]}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.title}</p>
              {t.body && <p className="line-clamp-2 text-sm text-muted">{t.body}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-ink"><X size={16} /></button>
          </div>
        )
      })}
    </div>
  )
}
