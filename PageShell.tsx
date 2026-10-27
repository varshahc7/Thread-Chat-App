import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/chat" aria-label="Back to chats" className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"><ArrowLeft size={18} /></Link>
          <h1 className="text-lg font-extrabold tracking-tight">{title}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">{children}</main>
    </div>
  )
}
