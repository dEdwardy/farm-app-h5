import * as React from 'react'
import { cn } from '../../lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn('min-h-[120px] w-full rounded-2xl border border-border/80 bg-white/80 px-4 py-3 text-[0.95rem] text-foreground shadow-sm outline-none transition focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10', className)} {...props} />
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
