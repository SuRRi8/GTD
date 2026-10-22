import type { Energy, Minutes, NextAction } from '../data/types'

/** Sonder-Kontext in der Jetzt-Ansicht: alle Agenda-Punkte */
export const AGENDA_FILTER = 'agenda'

/**
 * Die vier Kriterien aus dem Buch: Kontext, verfügbare Zeit, Energie – und die
 * eigene Wahl. Die App filtert nur, sie sortiert nicht nach Wichtigkeit.
 */
export interface EngageFilter {
  /** Gewählte Kontexte (leer = alle); `AGENDA_FILTER` steht für alle Agenden */
  contextIds: string[]
  /** Verfügbare Zeit in Minuten (leer = egal) */
  availableMinutes?: Minutes
  /** Verfügbare Energie (leer = egal) */
  energy?: Energy
}

const ENERGY_LEVEL: Record<Energy, number> = { niedrig: 1, mittel: 2, hoch: 3 }

/** Schritte ohne Zeit- oder Energieangabe passen immer – sie sollen nicht untergehen. */
export function matchesEngage(action: NextAction, filter: EngageFilter): boolean {
  if (filter.contextIds.length > 0) {
    const inContext = action.contextId !== undefined && filter.contextIds.includes(action.contextId)
    const inAgenda = action.agendaPersonId !== undefined && filter.contextIds.includes(AGENDA_FILTER)
    if (!inContext && !inAgenda) return false
  }
  if (filter.availableMinutes !== undefined && action.minutes !== undefined && filter.availableMinutes < 60) {
    if (action.minutes > filter.availableMinutes) return false
  }
  if (filter.energy !== undefined && action.energy !== undefined) {
    if (ENERGY_LEVEL[action.energy] > ENERGY_LEVEL[filter.energy]) return false
  }
  return true
}

export function engageActions(actions: NextAction[], filter: EngageFilter): NextAction[] {
  return actions.filter((action) => matchesEngage(action, filter))
}
