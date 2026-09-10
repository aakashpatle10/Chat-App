const Avatar = ({ name, size = 'md' }) => {
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const sizeClass =
    size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${sizeClass}`}
    >
      {initial}
    </div>
  )
}

export default Avatar
