import { Check, CornerDownLeft, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { IconButton } from '../components/Button'
import { TextInput } from '../components/forms'
import { Sheet } from '../components/Sheet'
import { useRepo } from '../data/hooks'
import { CaptureContext, type Capture } from '../state/feedback'

/** Ist gerade ein Eingabefeld oder ein Dialog aktiv? Dann kein Tastenkürzel. */
function isTypingOrDialog(target: EventTarget | null): boolean {
  if (document.querySelector('[role="dialog"]')) return true
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Erfassen ist überall erreichbar: „+“-Button, Taste „n“ und `useCapture()`.
 * Nur ein Textfeld; Enter speichert in den Eingang, das Feld bleibt offen.
 */
export function CaptureProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openCapture = useCallback(() => setOpen(true), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'n' || event.ctrlKey || event.metaKey || event.altKey) return
      if (isTypingOrDialog(event.target)) return
      event.preventDefault()
      setOpen(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo<Capture>(() => ({ openCapture }), [openCapture])

  return (
    <CaptureContext.Provider value={value}>
      {children}
      <button
        type="button"
        onClick={openCapture}
        aria-label="Erfassen"
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex size-15 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg transition hover:brightness-110 active:scale-95 md:hidden"
      >
        <Plus size={30} strokeWidth={2.2} />
      </button>
      {open && <CaptureSheet onClose={() => setOpen(false)} />}
    </CaptureContext.Provider>
  )
}

function CaptureSheet({ onClose }: { onClose: () => void }) {
  const repo = useRepo()
  const [text, setText] = useState('')
  const [captured, setCaptured] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const value = text.trim()
    if (!value) return
    setText('')
    inputRef.current?.focus()
    await repo.inbox.add({ text: value })
    setCaptured((list) => [value, ...list])
  }

  return (
    <Sheet open onClose={onClose} title="Erfassen">
      <form onSubmit={submit} className="flex items-center gap-2">
        <TextInput
          ref={inputRef}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Was geht dir durch den Kopf?"
          aria-label="Neuer Eintrag für den Eingang"
          enterKeyHint="send"
          autoComplete="off"
        />
        <IconButton type="submit" aria-label="In den Eingang" disabled={!text.trim()} className="text-accent">
          <CornerDownLeft size={22} />
        </IconButton>
      </form>
      <p className="mt-3 min-h-6 text-sm text-ink-muted" aria-live="polite">
        {captured.length === 0 ? (
          'Enter speichert. Das Feld bleibt für den nächsten Gedanken offen.'
        ) : (
          <span className="inline-flex items-center gap-1.5 text-ok">
            <Check size={16} />
            {captured.length === 1 ? '1 Eintrag' : `${captured.length} Einträge`} im Eingang – zuletzt „{captured[0]}“
          </span>
        )}
      </p>
    </Sheet>
  )
}
