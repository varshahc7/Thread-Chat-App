import { create } from 'zustand'
import { uid } from '../utils/format'

export type Theme = 'light' | 'dark' | 'system'
export interface Toast { id: string; title: string; body?: string; kind: 'message' | 'error' | 'success' | 'info' }

const read = (k: string, d: boolean) => { const v = localStorage.getItem(k); return v === null ? d : v === '1' }

interface UiState {
  theme: Theme
  notifyMessages: boolean
  notifySound: boolean
  notifyDesktop: boolean
  infoOpen: boolean
  toasts: Toast[]
  setTheme: (t: Theme) => void
  setFlag: (k: 'notifyMessages' | 'notifySound' | 'notifyDesktop', v: boolean) => void
  setInfoOpen: (v: boolean) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

export function applyTheme(t: Theme) {
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: (localStorage.getItem('pc.theme') as Theme) || 'system',
  notifyMessages: read('pc.n.msg', true),
  notifySound: read('pc.n.sound', true),
  notifyDesktop: read('pc.n.desktop', false),
  infoOpen: false,
  toasts: [],
  setTheme: (theme) => { localStorage.setItem('pc.theme', theme); applyTheme(theme); set({ theme }) },
  setFlag: (k, v) => {
    localStorage.setItem({ notifyMessages: 'pc.n.msg', notifySound: 'pc.n.sound', notifyDesktop: 'pc.n.desktop' }[k], v ? '1' : '0')
    set({ [k]: v } as Partial<UiState>)
  },
  setInfoOpen: (infoOpen) => set({ infoOpen }),
  toast: (t) => {
    const id = uid()
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }))
    setTimeout(() => get().dismiss(id), t.kind === 'error' ? 6000 : 4000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useUiStore.getState().theme === 'system') applyTheme('system')
})
