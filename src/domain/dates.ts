import type { ISODateTime, LocalDate } from '../data/types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Lokales Datum (Zeitzone des Geräts) als "YYYY-MM-DD" */
export function toLocalDate(date: Date): LocalDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayLocal(now: Date = new Date()): LocalDate {
  return toLocalDate(now)
}

/** Lokales Datum eines ISO-Zeitstempels */
export function localDateOf(iso: ISODateTime): LocalDate {
  return toLocalDate(new Date(iso))
}

function parseLocalDate(date: LocalDate): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const d = parseLocalDate(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Ganze Tage von `from` bis `to` (positiv, wenn `to` später liegt) */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((parseLocalDate(to).getTime() - parseLocalDate(from).getTime()) / 86_400_000)
}

export function isValidLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return parseLocalDate(value).toISOString().slice(0, 10) === value
}

const weekdayShort = new Intl.DateTimeFormat('de-DE', { weekday: 'short', timeZone: 'UTC' })
const dayMonth = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const dayMonthYear = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** z. B. "22. Okt." oder mit Jahr, wenn es nicht das aktuelle ist */
export function formatDate(date: LocalDate, today: LocalDate = todayLocal()): string {
  const d = parseLocalDate(date)
  return date.slice(0, 4) === today.slice(0, 4) ? dayMonth.format(d) : dayMonthYear.format(d)
}

const longDate = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

/** z. B. "Donnerstag, 22. Oktober" */
export function formatLongDate(date: LocalDate): string {
  return longDate.format(parseLocalDate(date))
}

/** "Heute", "Morgen", "Gestern" oder z. B. "Fr., 24. Okt." */
export function formatDay(date: LocalDate, today: LocalDate = todayLocal()): string {
  const diff = daysBetween(today, date)
  if (diff === 0) return 'Heute'
  if (diff === 1) return 'Morgen'
  if (diff === -1) return 'Gestern'
  return `${weekdayShort.format(parseLocalDate(date))}, ${formatDate(date, today)}`
}

/** "heute", "seit gestern", "seit 3 Tagen" */
export function formatSince(date: LocalDate, today: LocalDate = todayLocal()): string {
  const days = daysBetween(date, today)
  if (days <= 0) return 'seit heute'
  if (days === 1) return 'seit gestern'
  return `seit ${days} Tagen`
}
