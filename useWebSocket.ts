import { useEffect } from 'react'
import { socket } from '../services/websocket'
import { useChatStore } from '../store/chatStore'

/** Connects the real-time socket for the signed-in user and wires events into the chat store. */
export function useWebSocket() {
  useEffect(() => {
    const chat = useChatStore
    socket.onEvent = (e) => chat.getState().handleEvent(e)
    socket.onState = (s) => chat.getState().setConnection(s)
    socket.onReconnected = () => void chat.getState().sync()
    socket.connect()
    void chat.getState().loadConversations()

    let awayTimer: number | undefined
    const onVisibility = () => {
      window.clearTimeout(awayTimer)
      if (document.visibilityState === 'visible') {
        socket.send({ type: 'presence_update', status: 'online' })
        const id = chat.getState().activeId
        if (id) chat.getState().markRead(id)
      } else {
        awayTimer = window.setTimeout(() => socket.send({ type: 'presence_update', status: 'away' }), 60000)
      }
    }
    const onOnline = () => socket.nudge()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      window.clearTimeout(awayTimer)
      socket.disconnect()
      chat.getState().reset()
    }
  }, [])
}
