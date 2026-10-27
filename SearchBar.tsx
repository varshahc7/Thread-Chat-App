import { Search, X } from 'lucide-react'
import { forwardRef } from 'react'

export const SearchBar = forwardRef<HTMLInputElement, { value: string; onChange: (v: string) => void }>(function SearchBar({ value, onChange }, ref) {
  return (
    <div className="relative">
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
        placeholder="Search people and messages"
        aria-label="Search people and messages"
        className="w-full rounded-xl border border-transparent bg-raised py-2.5 pl-10 pr-9 text-sm outline-none transition placeholder:text-muted focus:border-accent focus:bg-surface"
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear search" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-ink"><X size={15} /></button>
      )}
    </div>
  )
})
