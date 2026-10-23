import type { GoogleCalendarSetting, GoogleEvent } from './types'

const BASE = 'https://www.googleapis.com/calendar/v3'
const EVENT_FIELDS = 'items(id,status,summary,start,end,htmlLink,created,updated,extendedProperties),nextPageToken'

type Fetch = typeof fetch

/** Zugriff abgelaufen oder widerrufen – neu verbinden */
export class GoogleAuthError extends Error {}

export class GoogleApiError extends Error {
  readonly status: number
  readonly reason?: string
  constructor(message: string, status: number, reason?: string) {
    super(message)
    this.status = status
    this.reason = reason
  }
}

async function call<T>(token: string, url: string, init: RequestInit = {}, fetchImpl: Fetch = fetch): Promise<T> {
  const response = await fetchImpl(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  })
  if (response.status === 401) throw new GoogleAuthError('Die Verbindung zu Google ist abgelaufen.')
  if (!response.ok) {
    let message = `Google antwortet mit Fehler ${response.status}.`
    let reason: string | undefined
    try {
      const body = (await response.json()) as { error?: { message?: string; errors?: { reason?: string }[]; status?: string } }
      reason = body.error?.errors?.[0]?.reason ?? body.error?.status
      if (body.error?.message) message = body.error.message
    } catch {
      // keine JSON-Antwort
    }
    throw new GoogleApiError(message, response.status, reason)
  }
  return (await response.json()) as T
}

interface CalendarListEntry {
  id: string
  summary?: string
  summaryOverride?: string
  primary?: boolean
  backgroundColor?: string
  accessRole?: string
}

/** Alle Kalender des Kontos – neue sind zunächst nicht ausgewählt (außer dem Hauptkalender) */
export async function listCalendars(token: string, fetchImpl?: Fetch): Promise<Omit<GoogleCalendarSetting, 'selected' | 'area'>[]> {
  const fields = 'items(id,summary,summaryOverride,primary,backgroundColor,accessRole)'
  const data = await call<{ items?: CalendarListEntry[] }>(token, `${BASE}/users/me/calendarList?fields=${encodeURIComponent(fields)}`, {}, fetchImpl)
  return (data.items ?? []).map((c) => ({
    id: c.id,
    name: c.summaryOverride || c.summary || c.id,
    color: c.backgroundColor,
    primary: c.primary || undefined,
    canWrite: c.accessRole === 'owner' || c.accessRole === 'writer',
  }))
}

/** Termine eines Kalenders im Zeitraum, Serien als einzelne Termine, alle Seiten */
export async function listEvents(token: string, calendarId: string, timeMin: string, timeMax: string, fetchImpl?: Fetch): Promise<GoogleEvent[]> {
  const events: GoogleEvent[] = []
  let pageToken: string | undefined
  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '2500',
      fields: EVENT_FIELDS,
    })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await call<{ items?: GoogleEvent[]; nextPageToken?: string }>(
      token,
      `${BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {},
      fetchImpl,
    )
    events.push(...(data.items ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)
  return events
}

export async function insertEvent(token: string, calendarId: string, event: Omit<GoogleEvent, 'id'>, fetchImpl?: Fetch): Promise<GoogleEvent> {
  const params = new URLSearchParams({ fields: EVENT_FIELDS.replace(/^items\((.*)\),nextPageToken$/, '$1') })
  return call<GoogleEvent>(token, `${BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, { method: 'POST', body: JSON.stringify(event) }, fetchImpl)
}

/** Verständliche Meldung für die Oberfläche */
export function describeGoogleError(error: unknown): string {
  if (error instanceof GoogleAuthError) return 'Die Verbindung zu Google ist abgelaufen. Bitte neu verbinden.'
  if (error instanceof GoogleApiError) {
    if (error.reason === 'accessNotConfigured' || error.reason === 'SERVICE_DISABLED') {
      return 'Die Google Calendar API ist im Google-Cloud-Projekt nicht aktiviert.'
    }
    if (error.status === 403) return 'Google verweigert den Zugriff. Bitte neu verbinden und den Kalenderzugriff erlauben.'
    return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return 'Google ist gerade nicht erreichbar.'
}
