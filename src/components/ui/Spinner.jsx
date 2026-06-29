import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
}

export default function Spinner({
  size = 'md',
  className = '',
  label = 'Loading...',
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={clsx('inline-flex items-center justify-center', className)}
    >
      <motion.div
        className={clsx(
          'rounded-full border-border border-t-accent',
          sizes[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.7,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
