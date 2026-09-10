import { useEffect, useState } from 'react'
import api from '../../services/api'
import useDebounce from '../../hooks/useDebounce'
import Avatar from '../common/Avatar'
import OnlineStatus from '../common/OnlineStatus'

const UserSearch = ({ onSelectUser }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debouncedQuery = useDebounce(query)

  useEffect(() => {
    const searchUsers = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults([])
        setError('')
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await api.get('/users/search', {
          params: { q: debouncedQuery.trim() },
        })
        setResults(response.data.data.users)
      } catch (err) {
        setResults([])
        setError(err.response?.data?.message || 'Search failed')
      } finally {
        setLoading(false)
      }
    }

    searchUsers()
  }, [debouncedQuery])

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />

      {loading && (
        <p className="mt-2 text-xs text-slate-500">Searching...</p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      {!loading && debouncedQuery.trim().length >= 2 && results.length === 0 && !error && (
        <p className="mt-2 text-xs text-slate-500">No users found.</p>
      )}

      {results.length > 0 && (
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {results.map((user) => (
            <li key={user._id}>
              <button
                type="button"
                onClick={() => onSelectUser?.(user)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-100"
              >
                <Avatar name={user.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    @{user.username}
                  </p>
                  <OnlineStatus
                    isOnline={user.isOnline}
                    lastSeen={user.lastSeen}
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default UserSearch
