import type { Area, ISODateTime, LocalDate } from '../../data/types'

/** Bereich eines Google-Kalenders; „beide“ für gemeinsam genutzte Kalender */
export type CalendarArea = Area | 'beide'

/** Einstellung pro Google-Kalender (nur auf diesem Gerät gespeichert) */
export interface GoogleCalendarSetting {
  id: string
  name: string
  color?: string
  primary?: boolean
  /** Darf die App hier Termine anlegen? */
  canWrite: boolean
  /** In der App anzeigen */
  selected: boolean
  area: CalendarArea
}

export interface GoogleSettings {
  /** Eigene OAuth-Client-ID; ohne sie gilt die aus der App-Konfiguration */
  clientId?: string
  /** Google-Konto (ID des Hauptkalenders = E-Mail-Adresse), sobald einmal verbunden */
  account?: string
  calendars: GoogleCalendarSetting[]
  /** Kalender, in den neue Termine eingetragen werden (leer = nicht in Google eintragen) */
  writeCalendarId?: string
}

export interface GoogleEventTime {
  /** Ganztägig: "YYYY-MM-DD" (Ende exklusiv) */
  date?: string
  /** Mit Uhrzeit: RFC 3339, z. B. "2026-10-23T10:00:00+02:00" */
  dateTime?: string
  timeZone?: string
}

/** Die Felder eines Google-Termins, die die App nutzt */
export interface GoogleEvent {
  id: string
  status?: string
  summary?: string
  start: GoogleEventTime
  end?: GoogleEventTime
  htmlLink?: string
  created?: string
  updated?: string
  extendedProperties?: { private?: Record<string, string> }
}

export interface CachedEvent extends GoogleEvent {
  calendarId: string
}

/** Zwischengespeicherte Termine – offline sichtbar */
export interface GoogleCache {
  fetchedAt: ISODateTime
  from: LocalDate
  to: LocalDate
  events: CachedEvent[]
}

export interface GoogleToken {
  accessToken: string
  /** Zeitpunkt in ms seit 1970 */
  expiresAt: number
  scope: string
}
