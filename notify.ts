import { useUiStore } from '../store/uiStore'

let ctx: AudioContext | null = null

export function playPing() {
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = 760
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.26)
  } catch { /* audio blocked until first user gesture */ }
}

export function notifyIncoming(title: string, body: string, visible: boolean) {
  const { notifyMessages, notifySound, notifyDesktop, toast } = useUiStore.getState()
  if (!notifyMessages) return
  if (notifySound) playPing()
  if (visible) toast({ title, body, kind: 'message' })
  if (notifyDesktop && !visible && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, tag: 'private-chat' })
  }
}
