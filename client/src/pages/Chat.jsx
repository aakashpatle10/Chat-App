import { useState } from 'react'
import Sidebar from '../components/chat/Sidebar'
import Avatar from '../components/common/Avatar'
import OnlineStatus from '../components/common/OnlineStatus'

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null)
  const [showChat, setShowChat] = useState(false)

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setShowChat(true)
  }

  return (
    <div className="h-screen bg-slate-50">
      <div className="mx-auto flex h-full max-w-6xl">
        <div
          className={`h-full w-full md:w-80 lg:w-96 ${
            showChat ? 'hidden md:block' : 'block'
          }`}
        >
          <Sidebar onSelectUser={handleSelectUser} />
        </div>

        <main
          className={`flex h-full flex-1 flex-col bg-white ${
            showChat ? 'block' : 'hidden md:flex'
          }`}
        >
          {selectedUser ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
                <button
                  type="button"
                  onClick={() => setShowChat(false)}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 md:hidden"
                >
                  Back
                </button>
                <Avatar name={selectedUser.name} />
                <div>
                  <h1 className="font-semibold text-slate-900">
                    {selectedUser.name}
                  </h1>
                  <OnlineStatus
                    isOnline={selectedUser.isOnline}
                    lastSeen={selectedUser.lastSeen}
                  />
                </div>
              </header>

              <div className="flex flex-1 items-center justify-center p-6">
                <p className="text-center text-sm text-slate-500">
                  Direct chat with @{selectedUser.username} will be available in
                  the next phase.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <p className="text-sm text-slate-500">
                Select a conversation to start chatting.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Chat
