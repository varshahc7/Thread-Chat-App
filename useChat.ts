import { useChatStore } from '../store/chatStore'

export const useChat = () => useChatStore()
export const useActiveConversation = () =>
  useChatStore((s) => s.conversations.find((c) => c.id === s.activeId) ?? null)
