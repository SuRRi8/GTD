import type { CalendarEntry, CalendarKind, LocalDate } from '../data/types'
import { addDays } from './dates'

const KIND_ORDER: Record<CalendarKind, number> = { termin: 0, tagesaufgabe: 1, tagesinfo: 2 }

/** Termine nach Uhrzeit, dann Tagesaufgaben, dann Tagesinfos */
export function compareEntries(a: CalendarEntry, b: CalendarEntry): number {
  return (
    KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
    (a.time ?? '').localeCompare(b.time ?? '') ||
    a.createdAt.localeCompare(b.createdAt)
  )
}

export function entriesOnDay(entries: CalendarEntry[], date: LocalDate): CalendarEntry[] {
  return entries.filter((e) => e.date === date).sort(compareEntries)
}

export interface CalendarDay {
  date: LocalDate
  entries: CalendarEntry[]
}

/** Einträge von `from` bis einschließlich `to`, nach Tagen gruppiert (nur Tage mit Einträgen) */
export function daysInRange(entries: CalendarEntry[], from: LocalDate, to: LocalDate): CalendarDay[] {
  const inRange = entries.filter((e) => e.date >= from && e.date <= to)
  const dates = [...new Set(inRange.map((e) => e.date))].sort()
  return dates.map((date) => ({ date, entries: inRange.filter((e) => e.date === date).sort(compareEntries) }))
}

/** Heute und die nächsten 14 Tage */
export function upcomingDays(entries: CalendarEntry[], today: LocalDate, days = 14): CalendarDay[] {
  return daysInRange(entries, today, addDays(today, days))
}

/** Tagesaufgaben aus der Vergangenheit, die nicht abgehakt wurden */
export function overdueDayTasks(entries: CalendarEntry[], today: LocalDate): CalendarEntry[] {
  return entries.filter((e) => e.kind === 'tagesaufgabe' && !e.doneAt && e.date < today).sort((a, b) => a.date.localeCompare(b.date))
}
