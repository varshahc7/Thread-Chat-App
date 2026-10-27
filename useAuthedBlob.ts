import { useEffect, useState } from 'react'
import { api } from '../services/api'

const cache = new Map<number, string>()

/** Files are private, so they're fetched with the auth header and shown via an object URL. */
export function useAuthedBlob(id: number | null | undefined) {
  const [url, setUrl] = useState<string | null>(id ? cache.get(id) ?? null : null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!id) return
    if (cache.has(id)) { setUrl(cache.get(id)!); return }
    let live = true
    api.fileBlob(id).then((b) => {
      const u = URL.createObjectURL(b)
      cache.set(id, u)
      if (live) setUrl(u)
    }).catch(() => live && setFailed(true))
    return () => { live = false }
  }, [id])
  return { url, failed }
}

export async function downloadAttachment(id: number, filename: string) {
  const blob = await api.fileBlob(id)
  const u = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = u; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(u), 5000)
}
