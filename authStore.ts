import { create } from 'zustand'
import { api, ApiError, tokens, type AuthResult } from '../services/api'
import { socket } from '../services/websocket'
import type { User } from '../types'

interface AuthState {
  user: User | null
  ready: boolean
  init: () => Promise<void>
  login: (identifier: string, password: string, remember: boolean) => Promise<void>
  register: (b: { display_name: string; username: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  setUser: (u: User) => void
  clearLocal: () => void
}

const accept = (r: AuthResult, remember?: boolean) => tokens.set(r.access_token, r.refresh_token, r.session_id, remember)

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  init: async () => {
    if (!tokens.access && !tokens.refresh) return set({ ready: true })
    try {
      set({ user: await api.me(), ready: true })
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) set({ ready: true }) // backend down: keep tokens, retry later
      else { tokens.clear(); set({ user: null, ready: true }) }
    }
  },
  login: async (identifier, password, remember) => {
    const r = await api.login(identifier, password)
    accept(r, remember)
    set({ user: r.user })
  },
  register: async (b) => {
    const r = await api.register(b)
    accept(r, true)
    set({ user: r.user })
  },
  logout: async () => {
    const refresh = tokens.refresh
    socket.disconnect()
    if (refresh) { try { await api.logout(refresh) } catch { /* already gone */ } }
    tokens.clear()
    set({ user: null })
  },
  setUser: (user) => set({ user }),
  clearLocal: () => { socket.disconnect(); tokens.clear(); set({ user: null }) },
}))
