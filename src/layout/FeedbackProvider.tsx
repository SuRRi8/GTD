import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { Sheet } from '../components/Sheet'
import { FeedbackContext, type ConfirmOptions, type Feedback, type ToastOptions } from '../state/feedback'

interface Toast extends ToastOptions {
  id: number
  message: string
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-2), { id, message, ...options }])
      setTimeout(() => dismiss(id), options.onAction ? 6000 : 3500)
    },
    [dismiss],
  )

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  )

  const close = (result: boolean) => {
    pending?.resolve(result)
    setPending(null)
  }

  const value = useMemo<Feedback>(() => ({ toast, confirm }), [toast, confirm])

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl bg-ink py-2 pr-2 pl-4 text-[15px] text-canvas shadow-lg"
          >
            <span className="flex-1 py-1">{t.message}</span>
            {t.onAction && (
              <button
                type="button"
                className="min-h-9 rounded-lg px-3 font-semibold text-accent-soft hover:bg-white/10"
                onClick={() => {
                  t.onAction?.()
                  dismiss(t.id)
                }}
              >
                {t.actionLabel ?? 'Rückgängig'}
              </button>
            )}
          </div>
        ))}
      </div>

      <Sheet
        open={pending !== null}
        onClose={() => close(false)}
        title={pending?.title ?? ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>
              Abbrechen
            </Button>
            <Button variant={pending?.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
              {pending?.confirmLabel ?? 'OK'}
            </Button>
          </>
        }
      >
        {pending?.message && <p className="text-ink-muted">{pending.message}</p>}
      </Sheet>
    </FeedbackContext.Provider>
  )
}
