import type { Energy, Minutes } from '../data/types'

export interface ActionDraft {
  title: string
  contextId?: string
  agendaPersonId?: string
  minutes?: Minutes
  energy?: Energy
}

/** Ein offener Schritt braucht eine Formulierung und einen Kontext (oder eine Agenda) */
export function isActionDraftValid(draft: ActionDraft): boolean {
  return Boolean(draft.title.trim()) && Boolean(draft.contextId || draft.agendaPersonId)
}
