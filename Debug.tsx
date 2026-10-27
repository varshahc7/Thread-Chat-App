import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { Card } from '../components/ui/controls'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { PageShell } from './PageShell'

export default function Debug() {
  const user = useAuthStore((s) => s.user)!
  const q = useQuery({ queryKey: ['debug'], queryFn: api.debug, refetchInterval: 3000, enabled: !!user.is_admin })
  if (!user.is_admin) return <Navigate to="/chat" replace />
  const d = q.data
  return (
    <PageShell title="Debug">
      <Card title="Connections" description="Live sockets held by the server (refreshes every 3s).">
        {q.isError ? <p className="text-sm text-red-500">Could not load debug data.</p> : (
          <>
            <p className="text-2xl font-extrabold">{d?.active_connections ?? '–'}</p>
            <ul className="mt-3 divide-y divide-line text-sm">
              {d?.users.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2">
                  <span className="font-medium">@{u.username}</span>
                  <span className="text-muted">{u.online ? 'online' : 'offline'} · {Object.entries(u.connections).map(([k, v]) => `${k}:${v}`).join(' ') || 'no sockets'}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <Card title="Recent routes" description="Sender → recipient only. Metadata, no content.">
        {d?.routes.length ? (
          <ul className="divide-y divide-line font-mono text-xs">
            {d.routes.map((r, i) => (
              <li key={i} className="flex justify-between gap-2 py-2"><span>{r.from} → {r.to}</span><span className="text-muted">{r.delivered_live ? 'live' : 'queued'} · {new Date(r.at).toLocaleTimeString()}</span></li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No messages routed yet.</p>}
      </Card>
    </PageShell>
  )
}
