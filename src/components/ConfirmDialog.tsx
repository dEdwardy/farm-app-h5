import { useEffect, useId, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ')

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
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)
  const originalOverflowRef = useRef<string>('')

  useEffect(() => {
    if (!open) {
      return
    }

    previousActiveElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    originalOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusInitialElement = () => {
      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      const firstFocusableElement = focusableElements?.[0]

      if (firstFocusableElement) {
        firstFocusableElement.focus()
        return
      }

      closeButtonRef.current?.focus()
    }

    const frameId = window.requestAnimationFrame(focusInitialElement)

    return () => {
      window.cancelAnimationFrame(frameId)
      document.body.style.overflow = originalOverflowRef.current
      previousActiveElementRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!busy) {
          onClose()
        }
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)

      if (!focusableElements || focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstFocusableElement = focusableElements[0]
      const lastFocusableElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey) {
        if (activeElement === firstFocusableElement || !dialogRef.current?.contains(activeElement)) {
          event.preventDefault()
          lastFocusableElement.focus()
        }
        return
      }

      if (activeElement === lastFocusableElement || !dialogRef.current?.contains(activeElement)) {
        event.preventDefault()
        firstFocusableElement.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [busy, onClose, open])

  if (!open) {
    return null
  }

  const confirmButtonClassName = danger
    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-100 shadow-red-500/25'
    : 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-100 shadow-primary-500/25'

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl shadow-black/20 transform animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="关闭确认弹窗"
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          <p id={descriptionId} className="text-sm leading-6 text-gray-600">
            {message}
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:text-gray-300 disabled:border-gray-100 disabled:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`flex-1 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl active:translate-y-0.5 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 ${confirmButtonClassName}`}
            >
              {busy ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  <span>{busyText}</span>
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
