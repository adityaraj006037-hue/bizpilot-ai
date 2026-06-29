import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Input = forwardRef(function Input({
  label,
  error,
  hint,
  className = '',
  containerClassName = '',
  leftIcon,
  rightIcon,
  ...props
}, ref) {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-ink">
          {label}
          {props.required && (
            <span className="text-danger ml-1">*</span>
          )}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-white border rounded-input px-3.5 py-2.5',
            'text-sm text-ink placeholder:text-ink-subtle',
            'transition-all duration-150',
            'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
            'disabled:opacity-55 disabled:cursor-not-allowed disabled:bg-surface',
            error
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-border',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-ink-subtle">{hint}</p>
      )}
    </div>
  )
})

export default Input
