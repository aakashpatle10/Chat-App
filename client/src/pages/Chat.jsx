import { useEffect, useState } from 'react'
import api from '../services/api'
import Sidebar from '../components/chat/Sidebar'
import Avatar from '../components/common/Avatar'
import OnlineStatus from '../components/common/OnlineStatus'
import { useAuth } from '../context/AuthContext'
import { connectSocket, getSocket } from '../services/socket'
import { getConversationTitle, getOtherMember } from '../utils/conversation'

const Chat = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await api.get('/conversations')
        setConversations(response.data.data.conversations)
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load conversations')
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [])

  const openConversation = (conversation) => {
    setSelectedConversation(conversation)
    setShowChat(true)
    setError('')
  }

  const handleSelectUser = async (selectedUser) => {
    try {
      setError('')
      const response = await api.post('/conversations/direct', {
        userId: selectedUser._id,
      })
      const conversation = response.data.data.conversation

      setConversations((current) => [
        conversation,
        ...current.filter((item) => item._id !== conversation._id),
      ])
      openConversation(conversation)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open conversation')
    }
  }

  const handleGroupCreated = (conversation) => {
    setConversations((current) => [
      conversation,
      ...current.filter((item) => item._id !== conversation._id),
    ])
    openConversation(conversation)
  }

  useEffect(() => {
    if (!selectedConversation) {
      return undefined
    }

    let active = true
    const socket = getSocket() || connectSocket()
    const conversationId = selectedConversation._id

    const loadMessages = async () => {
      setMessagesLoading(true)

      try {
        const response = await api.get(`/conversations/${conversationId}/messages`)
        if (active) {
          setMessages(response.data.data.messages)
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Could not load messages')
        }
      } finally {
        if (active) {
          setMessagesLoading(false)
        }
      }
    }

    const joinConversation = () => {
      socket?.emit('join_conversation', conversationId, (result) => {
        if (!result?.success && active) {
          setError(result?.message || 'Could not join conversation')
        }
      })
    }

    const handleMessage = (message) => {
      if (message.conversationId !== conversationId) {
        return
      }

      setMessages((current) =>
        current.some((item) => item._id === message._id)
          ? current
          : [...current, message],
      )
    }

    const handleReconnect = () => {
      loadMessages()
      joinConversation()
    }

    socket?.on('receive_message', handleMessage)
    socket?.on('connect', handleReconnect)
    joinConversation()
    loadMessages()

    return () => {
      active = false
      socket?.emit('leave_conversation', conversationId)
      socket?.off('receive_message', handleMessage)
      socket?.off('connect', handleReconnect)
    }
  }, [selectedConversation])

  const handleSendMessage = (event) => {
    event.preventDefault()
    const messageText = text.trim()
    const socket = getSocket() || connectSocket()

    if (!messageText || !selectedConversation || !socket || sending) {
      return
    }

    setSending(true)
    setError('')
    socket.emit(
      'send_message',
      { conversationId: selectedConversation._id, text: messageText },
      (result) => {
        setSending(false)
        if (!result?.success) {
          setError(result?.message || 'Could not send message')
          return
        }

        setText('')
      },
    )
  }

  return (
    <div className="h-screen bg-slate-50">
      <div className="mx-auto flex h-full max-w-6xl">
        <div
          className={`h-full w-full md:w-80 lg:w-96 ${
            showChat ? 'hidden md:block' : 'block'
          }`}
        >
          <Sidebar
            conversations={conversations}
            loading={loading}
            selectedConversationId={selectedConversation?._id}
            onSelectConversation={openConversation}
            onSelectUser={handleSelectUser}
            onGroupCreated={handleGroupCreated}
          />
        </div>

        <main
          className={`flex h-full flex-1 flex-col bg-white ${
            showChat ? 'block' : 'hidden md:flex'
          }`}
        >
          {selectedConversation ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
                <button
                  type="button"
                  onClick={() => setShowChat(false)}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 md:hidden"
                >
                  Back
                </button>
                <Avatar
                  name={getConversationTitle(selectedConversation, user._id)}
                />
                <div>
                  <h1 className="font-semibold text-slate-900">
                    {getConversationTitle(selectedConversation, user._id)}
                  </h1>
                  {selectedConversation.type === 'direct' ? (
                    <OnlineStatus
                      isOnline={getOtherMember(selectedConversation, user._id)?.isOnline}
                      lastSeen={getOtherMember(selectedConversation, user._id)?.lastSeen}
                    />
                  ) : (
                    <p className="text-xs text-slate-500">
                      {selectedConversation.members.length} members
                    </p>
                  )}
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {messagesLoading && (
                  <p className="text-center text-sm text-slate-500">Loading messages...</p>
                )}
                {!messagesLoading && messages.length === 0 && (
                  <p className="text-center text-sm text-slate-500">No messages yet.</p>
                )}
                {messages.map((message) => {
                  const isOwnMessage = message.senderId?._id === user._id

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          isOwnMessage
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-800 shadow-sm'
                        }`}
                      >
                        {!isOwnMessage && selectedConversation.type === 'group' && (
                          <p className="mb-1 text-xs font-semibold text-indigo-600">
                            {message.senderId?.name || 'Unknown user'}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                        <p className={`mt-1 text-[10px] ${isOwnMessage ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {error && <p className="border-t border-slate-200 px-4 py-2 text-xs text-red-600">{error}</p>}
              <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-200 bg-white p-4">
                <input
                  type="text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Write a message..."
                  maxLength={5000}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
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
