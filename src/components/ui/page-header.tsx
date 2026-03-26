import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button } from './button'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  action?: ReactNode
  backLabel?: string
  onBack?: () => void
  className?: string
}

export function PageHeader({ title, description, eyebrow, action, backLabel = '返回', onBack, className }: PageHeaderProps) {
  return (
    <div className={cn('page-hero', className)}>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow ? <p className="page-hero-kicker">{eyebrow}</p> : null}
          </div>
          {action ? <div className="relative z-10 flex shrink-0 items-start gap-2">{action}</div> : null}
        </div>

        <div className="mt-2 flex items-center gap-3">
          {onBack && (
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-2xl bg-white/12 text-primary-foreground hover:bg-white/18 hover:text-primary-foreground" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{backLabel}</span>
            </Button>
          )}
          <h1 className="page-hero-title">{title}</h1>
        </div>

        {description ? <p className="page-hero-description">{description}</p> : null}
      </div>
    </div>
  )
}
