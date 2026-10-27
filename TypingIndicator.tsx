export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex animate-pop justify-start" aria-live="polite">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-line bg-inb px-3.5 py-3 shadow-sm">
        <span className="sr-only">{name} is typing</span>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 animate-dot rounded-full bg-muted" style={{ animationDelay: `${i * 0.16}s` }} />
        ))}
      </div>
    </div>
  )
}
