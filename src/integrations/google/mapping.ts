import type { Area, CalendarKind, LocalDate, LocalTime } from '../../data/types'
import type { CalendarItem } from '../../domain/calendar'
import { addDays, toLocalDate } from '../../domain/dates'
import type { CachedEvent, GoogleCache, GoogleCalendarSetting, GoogleEvent, GoogleSettings } from './types'

/** Zusatzfelder, mit denen die App eigene Termine in Google markiert */
export const GTD_PROPS = { kind: 'gtdKind', area: 'gtdArea', project: 'gtdProjectId' } as const

const pad = (n: number) => String(n).padStart(2, '0')
const timeOf = (date: Date): LocalTime => `${pad(date.getHours())}:${pad(date.getMinutes())}`
const isArea = (v: unknown): v is Area => v === 'arbeit' || v === 'privat'

/**
 * Wandelt einen Google-Termin in Kalendereinträge der App um.
 * Termine mit Uhrzeit erscheinen an ihrem Starttag, ganztägige an jedem ihrer Tage
 * (begrenzt auf den Zeitraum `from`–`to`). Abgesagte Termine entfallen.
 */
export function eventToItems(event: CachedEvent, calendar: GoogleCalendarSetting, from: LocalDate, to: LocalDate): CalendarItem[] {
  if (event.status === 'cancelled') return []
  const props = event.extendedProperties?.private ?? {}
  const ownArea = props[GTD_PROPS.area]
  const area: Area = isArea(ownArea) ? ownArea : calendar.area === 'beide' ? 'privat' : calendar.area
  const stamp = event.created ?? event.updated ?? ''

  const base = {
    title: event.summary?.trim() || '(Ohne Titel)',
    area,
    anyArea: !isArea(ownArea) && calendar.area === 'beide' ? true : undefined,
    projectId: props[GTD_PROPS.project] || undefined,
    createdAt: stamp,
    updatedAt: event.updated ?? stamp,
  }
  const external = {
    source: 'google' as const,
    eventId: event.id,
    calendarId: calendar.id,
    calendarName: calendar.name,
    color: calendar.color,
    htmlLink: event.htmlLink,
  }

  if (event.start.dateTime) {
    const start = new Date(event.start.dateTime)
    const date = toLocalDate(start)
    if (date < from || date > to) return []
    const end = event.end?.dateTime ? new Date(event.end.dateTime) : undefined
    return [
      {
        ...base,
        id: `google:${calendar.id}:${event.id}`,
        kind: 'termin',
        date,
        time: timeOf(start),
        external: { ...external, endTime: end && toLocalDate(end) === date ? timeOf(end) : undefined },
      },
    ]
  }

  if (event.start.date) {
    const kind: CalendarKind = props[GTD_PROPS.kind] === 'tagesaufgabe' ? 'tagesaufgabe' : 'tagesinfo'
    const first = event.start.date > from ? event.start.date : from
    const endExclusive = event.end?.date && event.end.date > event.start.date ? event.end.date : addDays(event.start.date, 1)
    const items: CalendarItem[] = []
    for (let date = first; date < endExclusive && date <= to; date = addDays(date, 1)) {
      items.push({ ...base, id: `google:${calendar.id}:${event.id}:${date}`, kind, date, external })
    }
    return items
  }
  return []
}

/** Alle Einträge der ausgewählten Kalender; Termine, die in mehreren Kalendern stehen, nur einmal */
export function itemsFromCache(cache: GoogleCache, settings: GoogleSettings): CalendarItem[] {
  const calendars = new Map(settings.calendars.filter((c) => c.selected).map((c) => [c.id, c]))
  const seen = new Set<string>()
  const items: CalendarItem[] = []
  for (const event of cache.events) {
    const calendar = calendars.get(event.calendarId)
    if (!calendar) continue
    for (const item of eventToItems(event, calendar, cache.from, cache.to)) {
      const key = `${event.id}:${item.date}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push(item)
    }
  }
  return items
}

export interface NewGoogleEvent {
  title: string
  kind: CalendarKind
  date: LocalDate
  time?: LocalTime
  area: Area
  projectId?: string
}

/** Standarddauer für Termine, die in Google angelegt werden */
export const DEFAULT_DURATION_MINUTES = 60

/** Baut den Google-Termin für einen Eintrag aus der App */
export function buildEventPayload(input: NewGoogleEvent, timeZone: string, durationMinutes = DEFAULT_DURATION_MINUTES): Omit<GoogleEvent, 'id'> {
  const privateProps: Record<string, string> = { [GTD_PROPS.kind]: input.kind, [GTD_PROPS.area]: input.area }
  if (input.projectId) privateProps[GTD_PROPS.project] = input.projectId
  const common = { summary: input.title, extendedProperties: { private: privateProps } }

  if (input.kind === 'termin' && input.time) {
    // Rechnen mit der „Wanduhrzeit“: Google wertet sie in der angegebenen Zeitzone aus
    const start = new Date(`${input.date}T${input.time}:00Z`)
    const end = new Date(start.getTime() + durationMinutes * 60_000)
    const wallClock = (d: Date) => d.toISOString().slice(0, 19)
    return { ...common, start: { dateTime: wallClock(start), timeZone }, end: { dateTime: wallClock(end), timeZone } }
  }
  return { ...common, start: { date: input.date }, end: { date: addDays(input.date, 1) } }
}
