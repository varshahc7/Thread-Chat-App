import type { Conversation, Message, SearchedMessage, Session, User } from '../types'

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors: Record<string, string> = {}, public code = 'error') {
    super(message)
  }
}

// ---- token storage (localStorage when "remember me", sessionStorage otherwise) ----
const K = { access: 'pc.access', refresh: 'pc.refresh', session: 'pc.session', remember: 'pc.remember' }
const store = () => (localStorage.getItem(K.remember) === '0' ? sessionStorage : localStorage)
export const tokens = {
  get access() { return store().getItem(K.access) },
  get refresh() { return store().getItem(K.refresh) },
  get sessionId() { return Number(store().getItem(K.session) ?? 0) || null },
  set(a: string, r: string, sid: number, remember?: boolean) {
    if (remember !== undefined) {
      localStorage.setItem(K.remember, remember ? '1' : '0')
      ;(remember ? sessionStorage : localStorage).removeItem(K.access)
    }
    const s = store()
    s.setItem(K.access, a); s.setItem(K.refresh, r); s.setItem(K.session, String(sid))
  },
  clear() {
    for (const s of [localStorage, sessionStorage]) [K.access, K.refresh, K.session].forEach((k) => s.removeItem(k))
  },
}

let onAuthLost: () => void = () => {}
export const setAuthLostHandler = (fn: () => void) => { onAuthLost = fn }

let refreshing: Promise<boolean> | null = null
function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    const refresh = tokens.refresh
    if (!refresh) return false
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refresh }) })
      if (!res.ok) return false
      const d = await res.json()
      tokens.set(d.access_token, d.refresh_token, d.session_id)
      return true
    } catch { return false }
  })().finally(() => { refreshing = null })
  return refreshing
}

/** Returns an access token that is valid for at least ~30 seconds (refreshing if needed). */
export async function freshAccessToken(): Promise<string | null> {
  const t = tokens.access
  if (t) {
    try {
      const exp = JSON.parse(atob(t.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000
      if (exp - Date.now() > 30000) return t
    } catch { /* fall through to refresh */ }
  }
  if (await refreshTokens()) return tokens.access
  return null
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const t = tokens.access
  if (t) headers.set('Authorization', `Bearer ${t}`)
  let res: Response
  try {
    res = await fetch('/api' + path, { ...init, headers })
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.", {}, 'network')
  }
  if (res.status === 401 && retry && tokens.refresh && !path.startsWith('/auth/')) {
    if (await refreshTokens()) return request<T>(path, init, false)
    tokens.clear(); onAuthLost()
  }
  if (!res.ok) {
    let body: { detail?: string; errors?: Record<string, string>; code?: string } = {}
    try { body = await res.json() } catch { /* non-JSON error */ }
    throw new ApiError(res.status, body.detail ?? 'Something went wrong. Please try again.', body.errors ?? {}, body.code)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

const json = (body: unknown) => JSON.stringify(body)
export interface AuthResult { access_token: string; refresh_token: string; session_id: number; user: User }

export const api = {
  register: (b: { display_name: string; username: string; email: string; password: string }) =>
    request<AuthResult>('/auth/register', { method: 'POST', body: json(b) }),
  login: (identifier: string, password: string) =>
    request<AuthResult>('/auth/login', { method: 'POST', body: json({ identifier, password }) }),
  logout: (refresh_token: string) => request('/auth/logout', { method: 'POST', body: json({ refresh_token }) }),
  logoutAll: () => request('/auth/logout-all', { method: 'POST' }),
  forgot: (email: string) => request('/auth/forgot-password', { method: 'POST', body: json({ email }) }),
  changePassword: (current_password: string, new_password: string) =>
    request('/auth/change-password', { method: 'POST', body: json({ current_password, new_password, keep_session_id: tokens.sessionId }) }),
  sessions: () => request<Session[]>('/auth/sessions'),
  revokeSession: (id: number) => request(`/auth/sessions/${id}`, { method: 'DELETE' }),

  me: () => request<User>('/users/me'),
  user: (id: number) => request<User>(`/users/${id}`),
  searchUsers: (q: string) => request<User[]>(`/users/search?q=${encodeURIComponent(q)}`),
  updateUser: (id: number, patch: Partial<User>) => request<User>(`/users/${id}`, { method: 'PATCH', body: json(patch) }),
  uploadAvatar: (file: File) => { const f = new FormData(); f.append('file', file); return request<User>('/users/me/avatar', { method: 'POST', body: f }) },

  conversations: () => request<Conversation[]>('/conversations'),
  conversation: (id: number) => request<Conversation>(`/conversations/${id}`),
  openConversation: (user_id: number) => request<Conversation>('/conversations', { method: 'POST', body: json({ user_id }) }),
  messages: (id: number, opts: { before?: number; around?: number } = {}) => {
    const p = new URLSearchParams({ limit: '40' })
    if (opts.before) p.set('before', String(opts.before))
    if (opts.around) p.set('around', String(opts.around))
    return request<{ messages: Message[]; has_more: boolean }>(`/conversations/${id}/messages?${p}`)
  },
  markConversationRead: (id: number) => request(`/conversations/${id}/read`, { method: 'POST' }),
  media: (id: number) => request<Array<{ id: number; filename: string; file_size: number; mime_type: string; is_image: boolean }>>(`/conversations/${id}/media`),
  sendMessage: (b: { receiver_id: number; content: string; conversation_id?: number; client_id?: string }) =>
    request<Message>('/messages', { method: 'POST', body: json(b) }),
  searchMessages: (q: string) => request<SearchedMessage[]>(`/messages/search?q=${encodeURIComponent(q)}`),
  upload: (receiver_id: number, file: File, caption: string, client_id: string) => {
    const f = new FormData()
    f.append('receiver_id', String(receiver_id)); f.append('caption', caption); f.append('client_id', client_id); f.append('file', file)
    return request<Message>('/files/upload', { method: 'POST', body: f })
  },
  fileBlob: async (id: number): Promise<Blob> => {
    const t = (await freshAccessToken()) ?? ''
    const res = await fetch(`/api/files/${id}`, { headers: { Authorization: `Bearer ${t}` } })
    if (!res.ok) throw new ApiError(res.status, 'Could not load file')
    return res.blob()
  },
  debug: () => request<{
    active_connections: number
    users: Array<{ id: number; username: string; online: boolean; connections: Record<string, number> }>
    routes: Array<{ from: string; to: string; delivered_live: boolean; at: string }>
  }>('/admin/debug'),
}
