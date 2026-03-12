import type { User } from '../types'

interface Props {
  users: User[]
  currentUserId: string
}

export default function UserList({ users, currentUserId }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
        {users.length} {users.length === 1 ? 'user' : 'users'} online
      </p>
      <ul className="space-y-1">
        {users.map(user => (
          <li
            key={user.id}
            className="flex items-center gap-3 px-2 py-2 rounded-lg
                       hover:bg-[#2a2d2e] transition"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center
                         text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: user.color }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-200 truncate">
              {user.username}
              {user.id === currentUserId && (
                <span className="ml-1 text-xs text-gray-500">(you)</span>
              )}
            </span>
            {/* Online indicator */}
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  )
}
