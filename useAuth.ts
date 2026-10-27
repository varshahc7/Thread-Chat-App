import { useAuthStore } from '../store/authStore'

export const useAuth = () => useAuthStore()
export const useMe = () => useAuthStore((s) => s.user!)
