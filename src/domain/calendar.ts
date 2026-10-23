import type { CalendarEntry, CalendarKind, LocalDate, LocalTime } from '../data/types'
import { addDays } from './dates'

/** Herkunft eines Eintrags aus einem externen Kalender (nur Anzeige, nicht gespeichert) */
export interface ExternalInfo {
  source: 'google'
  eventId: string
  calendarId: string
  calendarName: string
  color?: string
  htmlLink?: string
  /** Endzeit bei Terminen am selben Tag */
  endTime?: LocalTime
}

/** Kalendereintrag für die Anzeige: eigener Eintrag oder Termin aus Google */
export interface CalendarItem extends CalendarEntry {
  external?: ExternalInfo
  /** Gilt für Arbeit und Privat (z. B. ein gemeinsam genutzter Google-Kalender) */
  anyArea?: boolean
}

const KIND_ORDER: Record<CalendarKind, number> = { termin: 0, tagesaufgabe: 1, tagesinfo: 2 }

/** Termine nach Uhrzeit, dann Tagesaufgaben, dann Tagesinfos */
export function compareEntries(a: CalendarEntry, b: CalendarEntry): number {
  return (
    KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
    (a.time ?? '').localeCompare(b.time ?? '') ||
    a.createdAt.localeCompare(b.createdAt)
  )
}

export function entriesOnDay<T extends CalendarEntry>(entries: T[], date: LocalDate): T[] {
  return entries.filter((e) => e.date === date).sort(compareEntries)
}

export interface CalendarDay<T extends CalendarEntry = CalendarItem> {
  date: LocalDate
  entries: T[]
}

/** Einträge von `from` bis einschließlich `to`, nach Tagen gruppiert (nur Tage mit Einträgen) */
export function daysInRange<T extends CalendarEntry>(entries: T[], from: LocalDate, to: LocalDate): CalendarDay<T>[] {
  const inRange = entries.filter((e) => e.date >= from && e.date <= to)
  const dates = [...new Set(inRange.map((e) => e.date))].sort()
  return dates.map((date) => ({ date, entries: inRange.filter((e) => e.date === date).sort(compareEntries) }))
}

/** Heute und die nächsten 14 Tage */
export function upcomingDays<T extends CalendarEntry>(entries: T[], today: LocalDate, days = 14): CalendarDay<T>[] {
  return daysInRange(entries, today, addDays(today, days))
}

/** Eigene Tagesaufgaben aus der Vergangenheit, die nicht abgehakt wurden */
export function overdueDayTasks<T extends CalendarItem>(entries: T[], today: LocalDate): T[] {
  return entries
    .filter((e) => e.kind === 'tagesaufgabe' && !e.doneAt && !e.external && e.date < today)
    .sort((a, b) => a.date.localeCompare(b.date))
}
