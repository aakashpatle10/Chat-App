export const formatLastSeen = (lastSeen, isOnline) => {
  if (isOnline) {
    return 'Online'
  }

  if (!lastSeen) {
    return 'Offline'
  }

  const seenDate = new Date(lastSeen)
  const diffMs = Date.now() - seenDate.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 5) {
    return 'Last seen recently'
  }

  return `Last seen ${seenDate.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`
}
