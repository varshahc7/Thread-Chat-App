import type { User } from '../../types'
import { initials } from '../../utils/format'

const HUES = [172, 199, 262, 330, 24, 145, 210, 350]
type Who = Pick<User, 'id' | 'display_name' | 'profile_image'> & Partial<Pick<User, 'status'>>

export function Avatar({ user, size = 40, showStatus = false }: { user: Who; size?: number; showStatus?: boolean }) {
  const hue = HUES[user.id % HUES.length]
  const dot = user.status === 'online' ? 'bg-emerald-500' : user.status === 'away' ? 'bg-amber-400' : 'bg-slate-400'
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {user.profile_image ? (
        <img src={user.profile_image} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        <span
          className="grid h-full w-full place-items-center rounded-full font-semibold text-white select-none"
          style={{ background: `hsl(${hue} 45% 42%)`, fontSize: size * 0.38 }}
          aria-hidden
        >
          {initials(user.display_name)}
        </span>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-surface ${dot}`}
          style={{ width: Math.max(10, size * 0.28), height: Math.max(10, size * 0.28) }}
          title={user.status}
        />
      )}
    </span>
  )
}
