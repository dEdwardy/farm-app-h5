import { Loader2, ShieldAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { buttonVariants } from './ui/button'
import { cn } from '../lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  busyText?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  busyText = '处理中...',
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && !busy) {
        onClose()
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-destructive/12 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'flex-1 border-0')} disabled={busy}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: danger ? 'destructive' : 'primary', size: 'md' }), 'flex-1')}
            onClick={(event) => {
              if (busy) {
                event.preventDefault()
                return
              }
              void onConfirm()
            }}
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {busyText}
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
