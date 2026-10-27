import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { ConnectionBanner } from './components/ConnectionBanner'
import { Spinner } from './components/ui/controls'
import { ToastHost } from './components/ui/ToastHost'
import { useWebSocket } from './hooks/useWebSocket'
import Chat from './pages/Chat'
import Debug from './pages/Debug'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Register from './pages/Register'
import Settings from './pages/Settings'
import { setAuthLostHandler } from './services/api'
import { useAuthStore } from './store/authStore'

function Authed({ children }: { children: React.ReactNode }) {
  useWebSocket()
  return (
    <>
      <ConnectionBanner />
      {children}
    </>
  )
}

export default function App() {
  const { user, ready, init, clearLocal } = useAuthStore()
  const nav = useNavigate()

  useEffect(() => {
    setAuthLostHandler(() => { clearLocal(); nav('/login', { replace: true }) })
    void init()
  }, [init, clearLocal, nav])

  if (!ready) return <div className="grid h-dvh place-items-center bg-bg text-muted"><Spinner className="h-6 w-6" /></div>

  const guard = (el: React.ReactNode) => (user ? <Authed>{el}</Authed> : <Navigate to="/login" replace />)
  const guest = (el: React.ReactNode) => (user ? <Navigate to="/chat" replace /> : el)

  return (
    <>
      <Routes>
        <Route path="/login" element={guest(<Login />)} />
        <Route path="/register" element={guest(<Register />)} />
        <Route path="/forgot-password" element={guest(<ForgotPassword />)} />
        <Route path="/chat/:id?" element={guard(<Chat />)} />
        <Route path="/profile" element={guard(<Profile />)} />
        <Route path="/settings" element={guard(<Settings />)} />
        <Route path="/debug" element={guard(<Debug />)} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
      <ToastHost />
    </>
  )
}
