import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../common/Avatar'
import OnlineStatus from '../common/OnlineStatus'
import UserSearch from './UserSearch'
import { getConversationPreview, getConversationTitle } from '../../utils/conversation'

const Sidebar = ({
  conversations,
  loading,
  selectedConversationId,
  onSelectConversation,
  onSelectUser,
  onGroupCreated,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupMembers, setGroupMembers] = useState([])
  const [groupError, setGroupError] = useState('')
  const [groupSaving, setGroupSaving] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleAddGroupMember = (member) => {
    setGroupMembers((current) =>
      current.some((item) => item._id === member._id)
        ? current
        : [...current, member],
    )
  }

  const handleCreateGroup = async (event) => {
    event.preventDefault()

    if (!groupName.trim() || groupMembers.length === 0 || groupSaving) {
      return
    }

    setGroupSaving(true)
    setGroupError('')

    try {
      const response = await api.post('/conversations/group', {
        name: groupName.trim(),
        memberIds: groupMembers.map((member) => member._id),
      })
      onGroupCreated?.(response.data.data.conversation)
      setGroupName('')
      setGroupMembers([])
      setShowGroupModal(false)
    } catch (err) {
      setGroupError(err.response?.data?.message || 'Could not create group')
    } finally {
      setGroupSaving(false)
    }
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
          Conversations
        </p>
        {loading && <p className="mt-3 text-sm text-slate-500">Loading conversations...</p>}
        {!loading && conversations.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">No conversations yet.</p>
        )}
        <div className="mt-3 space-y-1">
          {conversations.map((conversation) => (
            <button
              type="button"
              key={conversation._id}
              onClick={() => onSelectConversation?.(conversation)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left ${
                selectedConversationId === conversation._id
                  ? 'bg-indigo-50'
                  : 'hover:bg-slate-100'
              }`}
            >
              <Avatar name={getConversationTitle(conversation, user?._id)} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {getConversationTitle(conversation, user?._id)}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {getConversationPreview(conversation, user?._id)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={() => {
            setGroupError('')
            setShowGroupModal(true)
          }}
          className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
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

      {showGroupModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/30 p-4">
          <form
            onSubmit={handleCreateGroup}
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Create New Group</h2>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Group name"
              maxLength={80}
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
              Select members
            </p>
            <div className="mt-2">
              <UserSearch onSelectUser={handleAddGroupMember} />
            </div>
            {groupMembers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {groupMembers.map((member) => (
                  <button
                    type="button"
                    key={member._id}
                    onClick={() =>
                      setGroupMembers((current) =>
                        current.filter((item) => item._id !== member._id),
                      )
                    }
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700"
                  >
                    {member.name} x
                  </button>
                ))}
              </div>
            )}
            {groupError && <p className="mt-3 text-xs text-red-600">{groupError}</p>}
            <button
              type="submit"
              disabled={!groupName.trim() || groupMembers.length === 0 || groupSaving}
              className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {groupSaving ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
