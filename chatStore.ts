import { create } from 'zustand'
import { api, ApiError } from '../services/api'
import { socket } from '../services/websocket'
import type { ConnState, Conversation, Message, MessageStatus } from '../types'
import { notifyIncoming } from '../utils/notify'
import { previewText, uid } from '../utils/format'
import { useAuthStore } from './authStore'
import { useUiStore } from './uiStore'

const RANK: Record<MessageStatus, number> = { sent: 0, delivered: 1, read: 2 }
let tempId = 0
const sendTimers = new Map<string, number>()
const typingTimers = new Map<number, number>()
const pendingFiles = new Map<string, File>()

const lastTime = (c: Conversation) => c.last_message?.created_at ?? c.updated_at
const sortConvs = (l: Conversation[]) => [...l].sort((a, b) => lastTime(b).localeCompare(lastTime(a)))
const order = (a: Message, b: Message) =>
  a.id > 0 && b.id > 0 ? a.id - b.id : a.id > 0 ? -1 : b.id > 0 ? 1 : b.id - a.id

function upsert(list: Message[], m: Message, clientId?: string | null): Message[] {
  const cid = clientId ?? m.client_id
  const idx = list.findIndex((x) => x.id === m.id || (cid && x.client_id === cid))
  let next: Message[]
  if (idx >= 0) {
    const old = list[idx]!
    const keepStatus = RANK[old.status] > RANK[m.status] && old.id === m.id
    next = list.map((x, i) => (i === idx ? { ...m, status: keepStatus ? old.status : m.status, local: undefined, preview_url: old.preview_url } : x))
  } else next = [...list, m]
  return next.sort(order)
}

interface ChatState {
  conversations: Conversation[]
  loadingConvs: boolean
  messages: Record<number, Message[]>
  loadingMsgs: Record<number, boolean>
  hasMore: Record<number, boolean>
  detached: Record<number, boolean>
  typing: Record<number, boolean>
  activeId: number | null
  highlightId: number | null
  connection: ConnState
  setConnection: (s: ConnState) => void
  setActive: (id: number | null) => void
  loadConversations: () => Promise<void>
  openConversation: (id: number, aroundId?: number) => Promise<boolean>
  loadOlder: (id: number) => Promise<void>
  jumpToLatest: (id: number) => Promise<void>
  startConversationWith: (userId: number) => Promise<number>
  sendText: (convId: number, content: string) => Promise<void>
  sendFile: (convId: number, file: File, caption: string) => Promise<void>
  retry: (convId: number, clientId: string) => void
  markRead: (convId: number) => void
  sendTyping: (convId: number, on: boolean) => void
  handleEvent: (e: any) => void
  sync: () => Promise<void>
  reset: () => void
}

const initial = {
  conversations: [], loadingConvs: false, messages: {}, loadingMsgs: {}, hasMore: {}, detached: {}, typing: {},
  activeId: null, highlightId: null, connection: 'connecting' as ConnState,
}

export const useChatStore = create<ChatState>((set, get) => {
  const me = () => useAuthStore.getState().user!
  const toastError = (msg: string) => useUiStore.getState().toast({ title: msg, kind: 'error' })

  const patchConv = (id: number, fn: (c: Conversation) => Conversation) =>
    set((s) => ({ conversations: sortConvs(s.conversations.map((c) => (c.id === id ? fn(c) : c))) }))

  const putMessage = (m: Message, clientId?: string | null) => {
    set((s) => (s.messages[m.conversation_id] ? { messages: { ...s.messages, [m.conversation_id]: upsert(s.messages[m.conversation_id]!, m, clientId) } } : {}))
    if (get().conversations.some((c) => c.id === m.conversation_id)) {
      patchConv(m.conversation_id, (c) => ({ ...c, last_message: !c.last_message || c.last_message.id <= 0 || m.id >= c.last_message.id || m.client_id === c.last_message.client_id ? m : c.last_message }))
    } else void get().loadConversations()
  }

  const setLocal = (convId: number, clientId: string, local: Message['local']) =>
    set((s) => ({ messages: { ...s.messages, [convId]: (s.messages[convId] ?? []).map((m) => (m.client_id === clientId ? { ...m, local } : m)) } }))

  const settle = (clientId: string) => { window.clearTimeout(sendTimers.get(clientId)); sendTimers.delete(clientId) }
  const failAfter = (convId: number, clientId: string) =>
    sendTimers.set(clientId, window.setTimeout(() => setLocal(convId, clientId, 'failed'), 10000))

  const viaRest = async (m: Message) => {
    try {
      const saved = await api.sendMessage({ receiver_id: m.receiver_id, content: m.content, conversation_id: m.conversation_id, client_id: m.client_id! })
      settle(m.client_id!)
      putMessage(saved, m.client_id)
    } catch (e) {
      settle(m.client_id!)
      setLocal(m.conversation_id, m.client_id!, 'failed')
      if (e instanceof ApiError && e.status !== 0) toastError(e.message)
    }
  }

  const addOptimistic = (convId: number, m: Message) => {
    set((s) => ({ messages: { ...s.messages, [convId]: [...(s.messages[convId] ?? []), m] } }))
    patchConv(convId, (c) => ({ ...c, last_message: m }))
  }

  const mergeLocal = (server: Message[], existing: Message[] = []) => {
    const ids = new Set(server.map((m) => m.client_id).filter(Boolean))
    return [...server, ...existing.filter((m) => m.local && !ids.has(m.client_id))]
  }

  return {
    ...initial,
    setConnection: (connection) => set({ connection }),
    setActive: (activeId) => set({ activeId }),

    loadConversations: async () => {
      set({ loadingConvs: true })
      try {
        const list = await api.conversations()
        set((s) => {
          const local = s.conversations.filter((c) => !list.some((x) => x.id === c.id) && (c.id === s.activeId || !c.last_message))
          return { conversations: sortConvs([...list, ...local]) }
        })
      } catch (e) {
        if (e instanceof ApiError && e.status !== 0) toastError(e.message)
      } finally { set({ loadingConvs: false }) }
    },

    openConversation: async (id, aroundId) => {
      set((s) => ({ activeId: id, highlightId: aroundId ?? null, loadingMsgs: { ...s.loadingMsgs, [id]: true } }))
      try {
        if (!get().conversations.some((c) => c.id === id)) {
          const conv = await api.conversation(id)
          set((s) => ({ conversations: sortConvs([...s.conversations, conv]) }))
        }
        const res = await api.messages(id, aroundId ? { around: aroundId } : {})
        set((s) => ({
          messages: { ...s.messages, [id]: mergeLocal(res.messages, s.messages[id]) },
          hasMore: { ...s.hasMore, [id]: res.has_more },
          detached: { ...s.detached, [id]: !!aroundId },
        }))
        if (!aroundId) get().markRead(id)
        return true
      } catch (e) {
        toastError(e instanceof ApiError ? e.message : 'Could not open this conversation.')
        return false
      } finally { set((s) => ({ loadingMsgs: { ...s.loadingMsgs, [id]: false } })) }
    },

    loadOlder: async (id) => {
      const first = (get().messages[id] ?? []).find((m) => m.id > 0)
      if (!first) return
      try {
        const res = await api.messages(id, { before: first.id })
        set((s) => ({ messages: { ...s.messages, [id]: [...res.messages, ...(s.messages[id] ?? [])] }, hasMore: { ...s.hasMore, [id]: res.has_more } }))
      } catch { toastError('Could not load earlier messages.') }
    },

    jumpToLatest: async (id) => {
      const res = await api.messages(id)
      set((s) => ({ messages: { ...s.messages, [id]: mergeLocal(res.messages, s.messages[id]) }, hasMore: { ...s.hasMore, [id]: res.has_more }, detached: { ...s.detached, [id]: false }, highlightId: null }))
      get().markRead(id)
    },

    startConversationWith: async (userId) => {
      const conv = await api.openConversation(userId)
      set((s) => ({ conversations: s.conversations.some((c) => c.id === conv.id) ? s.conversations : sortConvs([...s.conversations, conv]) }))
      return conv.id
    },

    sendText: async (convId, content) => {
      const conv = get().conversations.find((c) => c.id === convId)
      content = content.trim()
      if (!conv || !content) return
      if (get().detached[convId]) await get().jumpToLatest(convId)
      const client_id = uid()
      const m: Message = { id: --tempId, conversation_id: convId, sender_id: me().id, receiver_id: conv.other_user.id, client_id, content, message_type: 'text', status: 'sent', created_at: new Date().toISOString(), delivered_at: null, read_at: null, attachment: null, local: 'pending' }
      addOptimistic(convId, m)
      if (socket.send({ type: 'message_send', conversation_id: convId, receiver_id: m.receiver_id, content, client_id })) failAfter(convId, client_id)
      else void viaRest(m)
    },

    sendFile: async (convId, file, caption) => {
      const conv = get().conversations.find((c) => c.id === convId)
      if (!conv) return
      if (get().detached[convId]) await get().jumpToLatest(convId)
      const client_id = uid()
      const isImage = file.type.startsWith('image/')
      const m: Message = {
        id: --tempId, conversation_id: convId, sender_id: me().id, receiver_id: conv.other_user.id, client_id, content: caption.trim(),
        message_type: isImage ? 'image' : 'file', status: 'sent', created_at: new Date().toISOString(), delivered_at: null, read_at: null,
        attachment: { id: 0, filename: file.name, file_size: file.size, mime_type: file.type, is_image: isImage },
        preview_url: isImage ? URL.createObjectURL(file) : undefined, local: 'pending',
      }
      pendingFiles.set(client_id, file)
      addOptimistic(convId, m)
      try {
        const saved = await api.upload(m.receiver_id, file, m.content, client_id)
        pendingFiles.delete(client_id)
        putMessage(saved, client_id)
      } catch (e) {
        setLocal(convId, client_id, 'failed')
        toastError(e instanceof ApiError ? e.message : 'Upload failed.')
      }
    },

    retry: (convId, clientId) => {
      const m = (get().messages[convId] ?? []).find((x) => x.client_id === clientId)
      if (!m) return
      setLocal(convId, clientId, 'pending')
      const file = pendingFiles.get(clientId)
      if (file) {
        api.upload(m.receiver_id, file, m.content, clientId)
          .then((saved) => { pendingFiles.delete(clientId); putMessage(saved, clientId) })
          .catch((e) => { setLocal(convId, clientId, 'failed'); toastError(e instanceof ApiError ? e.message : 'Upload failed.') })
      } else void viaRest(m)
    },

    markRead: (convId) => {
      const has = (get().messages[convId] ?? []).some((m) => m.receiver_id === me().id && m.status !== 'read') ||
        (get().conversations.find((c) => c.id === convId)?.unread_count ?? 0) > 0
      if (!has) return
      set((s) => ({ messages: { ...s.messages, [convId]: (s.messages[convId] ?? []).map((m) => (m.receiver_id === me().id ? { ...m, status: 'read' as const } : m)) } }))
      patchConv(convId, (c) => ({ ...c, unread_count: 0 }))
      if (!socket.send({ type: 'message_read', conversation_id: convId })) void api.markConversationRead(convId).catch(() => {})
    },

    sendTyping: (convId, on) => { socket.send({ type: on ? 'typing_start' : 'typing_stop', conversation_id: convId }) },

    handleEvent: (e) => {
      const s = get()
      switch (e.type) {
        case 'message_received': {
          const m = e.message as Message
          const visible = document.visibilityState === 'visible'
          const viewing = s.activeId === m.conversation_id && visible && !s.detached[m.conversation_id]
          const conv = s.conversations.find((c) => c.id === m.conversation_id)
          putMessage(m)
          set((st) => ({ typing: { ...st.typing, [m.conversation_id]: false } }))
          if (viewing) {
            get().markRead(m.conversation_id)
            patchConv(m.conversation_id, (c) => ({ ...c, unread_count: 0 }))
          } else {
            patchConv(m.conversation_id, (c) => ({ ...c, unread_count: c.unread_count + 1 }))
            notifyIncoming(conv?.other_user.display_name ?? 'New message', previewText(m), visible)
          }
          break
        }
        case 'message_ack': {
          settle(e.client_id ?? '')
          putMessage(e.message as Message, e.client_id)
          break
        }
        case 'message_status': {
          const ids = new Set<number>(e.message_ids)
          const status = e.status as MessageStatus
          const up = (m: Message) => (ids.has(m.id) && RANK[m.status] < RANK[status] ? { ...m, status } : m)
          set((st) => ({ messages: st.messages[e.conversation_id] ? { ...st.messages, [e.conversation_id]: st.messages[e.conversation_id]!.map(up) } : st.messages }))
          patchConv(e.conversation_id, (c) => (c.last_message ? { ...c, last_message: up(c.last_message) } : c))
          break
        }
        case 'conversation_read':
          patchConv(e.conversation_id, (c) => ({ ...c, unread_count: 0 }))
          break
        case 'typing': {
          const id = e.conversation_id as number
          window.clearTimeout(typingTimers.get(id))
          set((st) => ({ typing: { ...st.typing, [id]: !!e.is_typing } }))
          if (e.is_typing) typingTimers.set(id, window.setTimeout(() => set((st) => ({ typing: { ...st.typing, [id]: false } })), 5000))
          break
        }
        case 'presence':
          set((st) => ({ conversations: st.conversations.map((c) => (c.other_user.id === e.user_id ? { ...c, other_user: { ...c.other_user, status: e.status, last_seen: e.last_seen } } : c)) }))
          break
        case 'error':
          if (e.client_id) { settle(e.client_id); const m = Object.values(s.messages).flat().find((x) => x.client_id === e.client_id); if (m) setLocal(m.conversation_id, e.client_id, 'failed') }
          toastError(e.message ?? 'Something went wrong.')
          break
      }
    },

    /** After a reconnect: refresh conversations and the open conversation so nothing is missed. */
    sync: async () => {
      await get().loadConversations()
      const id = get().activeId
      if (id && !get().detached[id]) {
        try {
          const res = await api.messages(id)
          set((s) => ({ messages: { ...s.messages, [id]: mergeLocal(res.messages, s.messages[id]) } }))
          get().markRead(id)
        } catch { /* next reconnect will retry */ }
      }
      // anything still "pending" from before the drop is retried over REST (idempotent via client_id)
      for (const m of Object.values(get().messages).flat()) if (m.local && !m.attachment) void viaRest(m)
    },

    reset: () => set({ ...initial }),
  }
})
