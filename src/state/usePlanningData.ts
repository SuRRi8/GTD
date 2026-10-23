import { useMemo } from 'react'
import { useData } from '../data/hooks'
import type { GtdSnapshot } from '../data/types'
import type { CalendarItem } from '../domain/calendar'
import { useGoogleCalendar } from '../integrations/google/context'

export type PlanningData = Omit<GtdSnapshot, 'calendar'> & { calendar: CalendarItem[] }

/**
 * Daten zum Lesen und Planen: eigene Einträge plus Termine aus Google Kalender.
 * Zum Schreiben weiterhin `useRepo()` – Google-Termine sind hier nur zur Anzeige.
 */
export function usePlanningData(): PlanningData {
  const data = useData()
  const { items } = useGoogleCalendar()
  return useMemo(() => (items.length ? { ...data, calendar: [...data.calendar, ...items] } : data), [data, items])
}
