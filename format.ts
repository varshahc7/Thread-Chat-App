export const uid = () =>
  'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
export const formatTime = (iso: string) => time.format(new Date(iso))

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

export function dayLabel(iso: string): string {
  const d = new Date(iso), now = new Date()
  if (sameDay(d, now)) return 'Today'
  const y = new Date(now); y.setDate(now.getDate() - 1)
  if (sameDay(d, y)) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}

export function listTime(iso: string): string {
  const d = new Date(iso), now = new Date()
  if (sameDay(d, now)) return formatTime(iso)
  const diff = (now.getTime() - d.getTime()) / 86400000
  if (diff < 6) return d.toLocaleDateString(undefined, { weekday: 'short' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function lastSeenText(iso: string | null): string {
  if (!iso) return 'Offline'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Last seen just now'
  if (mins < 60) return `Last seen ${mins} minute${mins === 1 ? '' : 's'} ago`
  const d = new Date(iso)
  if (sameDay(d, new Date())) return `Last seen today at ${formatTime(iso)}`
  return `Last seen ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${formatTime(iso)}`
}

export const fileSize = (n: number) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?'

export function previewText(m: { content: string; message_type: string; attachment: { filename: string } | null }): string {
  if (m.content) return m.content
  return m.message_type === 'image' ? 'Photo' : m.attachment?.filename ?? 'Attachment'
}
