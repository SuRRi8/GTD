import { createContext, useContext } from 'react'
import type { CalendarItem } from '../../domain/calendar'
import type { NewGoogleEvent } from './mapping'
import type { GoogleCalendarSetting, GoogleEvent, GoogleSettings } from './types'

export interface GoogleCalendar {
  /** Client-ID vorhanden – Verbinden möglich */
  configured: boolean
  clientId?: string
  /** Client-ID stammt aus der App-Konfiguration (Build-Variable) */
  clientIdFromBuild: boolean
  /** Wurde schon einmal verbunden (Konto bekannt) */
  connected: boolean
  account?: string
  syncing: boolean
  error?: string
  /** Zeitpunkt des letzten Abrufs */
  lastSync?: string
  /** Google-Termine der ausgewählten Kalender, als Kalendereinträge */
  items: CalendarItem[]
  settings: GoogleSettings
  writeCalendar?: GoogleCalendarSetting

  /** Verbinden bzw. Kalenderliste neu laden – nur aus einem Klick heraus aufrufen */
  connect(): Promise<void>
  /** Termine neu abrufen; `interactive` erlaubt das Google-Fenster (nur aus einem Klick) */
  refresh(interactive: boolean): Promise<void>
  disconnect(): void
  setClientId(clientId: string | undefined): void
  updateCalendar(id: string, changes: Partial<Pick<GoogleCalendarSetting, 'selected' | 'area'>>): void
  /** Ziel für neue Termine; holt bei Bedarf die Schreibberechtigung (aus einem Klick heraus) */
  setWriteCalendar(id: string | undefined): void
  /** Stellt ein gültiges Token sicher – mit `interactive` direkt aus einem Klick heraus aufrufen */
  ensureToken(options: { interactive: boolean; write?: boolean }): Promise<string>
  /** Legt einen Termin im Zielkalender an (braucht ein gültiges Token mit Schreibrecht) */
  createEvent(event: NewGoogleEvent): Promise<GoogleEvent>
}

export const GoogleCalendarContext = createContext<GoogleCalendar | null>(null)

export function useGoogleCalendar(): GoogleCalendar {
  const google = useContext(GoogleCalendarContext)
  if (!google) throw new Error('useGoogleCalendar außerhalb von <GoogleCalendarProvider>')
  return google
}
