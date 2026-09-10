import { formatLastSeen } from '../../utils/formatTime'

const OnlineStatus = ({ isOnline, lastSeen, className = '' }) => {
  const label = formatLastSeen(lastSeen, isOnline)

  return (
    <p
      className={`text-xs ${isOnline ? 'text-green-600' : 'text-slate-500'} ${className}`}
    >
      {isOnline && (
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />
      )}
      {label}
    </p>
  )
}

export default OnlineStatus
