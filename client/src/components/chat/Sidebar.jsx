import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../common/Avatar'
import OnlineStatus from '../common/OnlineStatus'
import UserSearch from './UserSearch'

const Sidebar = ({ onSelectUser }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">@{user?.username}</p>
            <OnlineStatus isOnline={user?.isOnline} lastSeen={user?.lastSeen} />
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Chats</h2>
        <UserSearch onSelectUser={onSelectUser} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Direct Messages
        </p>
        <p className="mt-3 text-sm text-slate-500">No conversations yet.</p>

        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-slate-400">
          Groups
        </p>
        <p className="mt-3 text-sm text-slate-500">No groups yet.</p>
      </div>

      <div className="space-y-2 border-t border-slate-200 p-4">
        <button
          type="button"
          disabled
          className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-400"
        >
          + Create Group
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
