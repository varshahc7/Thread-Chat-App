import type { ConnState } from '../types'
import { freshAccessToken } from './api'

type Listener = (event: any) => void

/** Browser <-> backend real-time channel with authentication and exponential-backoff reconnects. */
class ChatSocket {
  private ws: WebSocket | null = null
  private attempt = 0
  private timer: number | undefined
  private wanted = false
  private authed = false
  private hadConnection = false
  onEvent: Listener = () => {}
  onState: (s: ConnState) => void = () => {}
  onReconnected: () => void = () => {}

  connect() {
    this.wanted = true
    this.open()
  }

  private open() {
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return
    this.onState(this.hadConnection ? 'reconnecting' : 'connecting')
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${location.host}/ws`)
    this.ws = ws
    ws.onopen = async () => {
      const token = await freshAccessToken()
      if (!token) return ws.close()
      ws.send(JSON.stringify({ type: 'auth', token }))
    }
    ws.onmessage = (e) => {
      let data: any
      try { data = JSON.parse(e.data) } catch { return }
      if (data.type === 'auth_ok') {
        this.authed = true
        const again = this.hadConnection
        this.hadConnection = true
        this.attempt = 0
        this.onState('connected')
        if (again) this.onReconnected()
        return
      }
      if (data.type === 'auth_error') return ws.close()
      this.onEvent(data)
    }
    ws.onclose = () => {
      this.authed = false
      if (this.ws === ws) this.ws = null
      if (!this.wanted) return
      this.onState(this.hadConnection ? 'reconnecting' : 'connecting')
      const delay = Math.min(1000 * 2 ** this.attempt, 30000) + Math.random() * 300
      this.attempt += 1
      window.clearTimeout(this.timer)
      this.timer = window.setTimeout(() => this.open(), delay)
    }
    ws.onerror = () => ws.close()
  }

  send(payload: object): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.authed) return false
    this.ws.send(JSON.stringify(payload))
    return true
  }

  /** Reconnect right away (e.g. when the browser regains network). */
  nudge() {
    if (this.wanted && !this.authed) { this.attempt = 0; window.clearTimeout(this.timer); this.open() }
  }

  disconnect() {
    this.wanted = false
    this.hadConnection = false
    window.clearTimeout(this.timer)
    this.ws?.close()
    this.ws = null
    this.authed = false
  }
}

export const socket = new ChatSocket()
