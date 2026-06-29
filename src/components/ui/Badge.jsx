import { clsx } from 'clsx'

const variants = {
  new:            'bg-slate-100 text-slate-600',
  contacted:      'bg-indigo-50 text-indigo-600',
  engaged:        'bg-violet-50 text-violet-600',
  replied:        'bg-emerald-50 text-emerald-600',
  interested:     'bg-amber-50 text-amber-600',
  meeting_booked: 'bg-sky-50 text-sky-600',
  qualified:      'bg-green-50 text-green-600',
  unqualified:    'bg-red-50 text-red-600',
  bounced:        'bg-rose-50 text-rose-600',
  default:        'bg-gray-100 text-gray-600',
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
  dot = false,
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5',
        'px-2.5 py-0.5 rounded-badge',
        'text-xs font-semibold',
        variants[variant] || variants.default,
        className
      )}
    >
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full bg-current'
        )} />
      )}
      {children}
    </span>
  )
}
