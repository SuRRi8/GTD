import { createContext, useContext } from 'react'
import type { NextAction, WaitingFor } from '../data/types'

export interface ToastOptions {
  actionLabel?: string
  onAction?: () => void
}

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
}

export interface Feedback {
  /** Kurze Meldung unten, optional mit Aktion (z. B. „Rückgängig“) */
  toast(message: string, options?: ToastOptions): void
  /** Bestätigungsdialog; liefert true bei Bestätigung */
  confirm(options: ConfirmOptions): Promise<boolean>
}

export const FeedbackContext = createContext<Feedback | null>(null)

export function useFeedback(): Feedback {
  const feedback = useContext(FeedbackContext)
  if (!feedback) throw new Error('useFeedback außerhalb von <FeedbackProvider>')
  return feedback
}

export interface Capture {
  openCapture(): void
}

export const CaptureContext = createContext<Capture | null>(null)

export function useCapture(): Capture {
  const capture = useContext(CaptureContext)
  if (!capture) throw new Error('useCapture außerhalb von <CaptureProvider>')
  return capture
}

export interface Completion {
  /** Schritt abhaken; bei Projekt-Schritten folgt die Frage nach dem nächsten Schritt */
  completeAction(action: NextAction): void
  /** „Warten auf“ abhaken; bei Projekt-Einträgen ebenfalls mit Nachfrage */
  completeWaiting(entry: WaitingFor): void
}

export const CompletionContext = createContext<Completion | null>(null)

export function useCompletion(): Completion {
  const completion = useContext(CompletionContext)
  if (!completion) throw new Error('useCompletion außerhalb von <CompletionProvider>')
  return completion
}
