import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx('bg-white rounded-xl shadow-sm border border-gray-100', className)
        )}
        {...props}
      >
        {(title || description) && (
          <div className="px-6 py-4 border-b border-gray-100">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
        )}
        <div className={title || description ? 'p-6' : ''}>{children}</div>
      </div>
    )
  }
)

Card.displayName = 'Card'