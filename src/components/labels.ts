import type { Area, CalendarKind, Energy, Minutes } from '../data/types'

export const AREA_LABEL: Record<Area, string> = { arbeit: 'Arbeit', privat: 'Privat' }

export const MINUTES_LABEL: Record<Minutes, string> = { 5: '5 Min.', 15: '15 Min.', 30: '30 Min.', 60: '60+ Min.' }

export const ENERGY_LABEL: Record<Energy, string> = { niedrig: 'Energie niedrig', mittel: 'Energie mittel', hoch: 'Energie hoch' }

export const CALENDAR_KIND_LABEL: Record<CalendarKind, string> = {
  termin: 'Termin',
  tagesaufgabe: 'Tagesaufgabe',
  tagesinfo: 'Tagesinfo',
}
