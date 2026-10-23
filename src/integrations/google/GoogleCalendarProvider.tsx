import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { addDays, todayLocal } from '../../domain/dates'
import { readStored, writeStored } from '../../state/storage'
import { describeGoogleError, GoogleAuthError, insertEvent, listCalendars, listEvents } from './api'
import { GoogleCalendarContext, type GoogleCalendar } from './context'
import { loadGis, requestAccessToken, revokeAccessToken, SCOPE_READ, SCOPE_WRITE } from './gis'
import { buildEventPayload, itemsFromCache, type NewGoogleEvent } from './mapping'
import { hasScopes, isTokenValid, readSessionToken, writeSessionToken } from './token'
import type { CachedEvent, GoogleCache, GoogleCalendarSetting, GoogleSettings, GoogleToken } from './types'

const SETTINGS_KEY = 'gtd.google.settings'
const CACHE_KEY = 'gtd.google.cache'
/** Abrufzeitraum: Wochenrückblick (−14 Tage) bis gut zwei Monate voraus */
const PAST_DAYS = 14
const FUTURE_DAYS = 60
/** Automatisch neu abrufen, wenn die App wieder sichtbar wird und der Stand älter ist */
const AUTO_REFRESH_MS = 10 * 60_000

const EMPTY_SETTINGS: GoogleSettings = { calendars: [] }
const isSettings = (v: unknown): v is GoogleSettings => typeof v === 'object' && v !== null && Array.isArray((v as GoogleSettings).calendars)
const isCache = (v: unknown): v is GoogleCache => typeof v === 'object' && v !== null && Array.isArray((v as GoogleCache).events)

const BUILD_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || undefined
const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

function localMidnightIso(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toISOString()
}

/**
 * Verbindung zu Google Kalender – direkt aus dem Browser, ohne eigenen Server.
 * Termine werden auf dem Gerät zwischengespeichert und sind offline sichtbar.
 */
export function GoogleCalendarProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<GoogleSettings>(() => readStored(SETTINGS_KEY, EMPTY_SETTINGS, isSettings))
  const [cache, setCacheState] = useState<GoogleCache | null>(() => readStored<GoogleCache | null>(CACHE_KEY, null, (v): v is GoogleCache | null => isCache(v)))
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string>()

  // Refs für Aufrufe aus Klicks und Callbacks, die den neuesten Stand brauchen
  const settingsRef = useRef(settings)
  const tokenRef = useRef<GoogleToken | null>(readSessionToken())
  const cacheRef = useRef(cache)

  const clientId = settings.clientId || BUILD_CLIENT_ID

  const setSettings = useCallback((update: (previous: GoogleSettings) => GoogleSettings) => {
    const next = update(settingsRef.current)
    settingsRef.current = next
    setSettingsState(next)
    writeStored(SETTINGS_KEY, next)
  }, [])

  const setCache = useCallback((next: GoogleCache | null) => {
    cacheRef.current = next
    setCacheState(next)
    writeStored(CACHE_KEY, next)
  }, [])

  const setToken = useCallback((token: GoogleToken | null) => {
    tokenRef.current = token
    writeSessionToken(token)
  }, [])

  const ensureToken = useCallback(
    ({ interactive, write }: { interactive: boolean; write?: boolean }): Promise<string> => {
      const wantsWrite = write ?? Boolean(settingsRef.current.writeCalendarId)
      const scope = wantsWrite ? `${SCOPE_READ} ${SCOPE_WRITE}` : SCOPE_READ
      const token = tokenRef.current
      if (isTokenValid(token, Date.now()) && hasScopes(token.scope, scope)) return Promise.resolve(token.accessToken)
      if (!interactive) return Promise.reject(new GoogleAuthError('Nicht mit Google verbunden.'))
      if (!clientId) return Promise.reject(new Error('Es ist keine Google-Client-ID eingetragen.'))
      // synchron aus dem Klick heraus, damit der Browser das Google-Fenster zulässt
      return requestAccessToken(clientId, scope, settingsRef.current.account ? '' : 'consent').then((result) => {
        setToken({ accessToken: result.accessToken, expiresAt: Date.now() + result.expiresIn * 1000, scope: result.scope })
        return result.accessToken
      })
    },
    [clientId, setToken],
  )

  const fetchEvents = useCallback(
    async (accessToken: string, calendars: GoogleCalendarSetting[]) => {
      const today = todayLocal()
      const from = addDays(today, -PAST_DAYS)
      const to = addDays(today, FUTURE_DAYS)
      const lists = await Promise.all(
        calendars
          .filter((c) => c.selected)
          .map(async (c) => {
            const events = await listEvents(accessToken, c.id, localMidnightIso(from), localMidnightIso(addDays(to, 1)))
            return events.map((e): CachedEvent => ({ ...e, calendarId: c.id }))
          }),
      )
      setCache({ fetchedAt: new Date().toISOString(), from, to, events: lists.flat() })
    },
    [setCache],
  )

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof GoogleAuthError) setToken(null)
      setError(describeGoogleError(e))
    },
    [setToken],
  )

  const connect = useCallback(async () => {
    setSyncing(true)
    setError(undefined)
    try {
      const accessToken = await ensureToken({ interactive: true })
      const list = await listCalendars(accessToken)
      const known = new Map(settingsRef.current.calendars.map((c) => [c.id, c]))
      const calendars = list.map((c): GoogleCalendarSetting => {
        const previous = known.get(c.id)
        return { ...c, selected: previous?.selected ?? Boolean(c.primary), area: previous?.area ?? 'beide' }
      })
      setSettings((s) => ({
        ...s,
        account: list.find((c) => c.primary)?.id ?? s.account ?? 'Google-Konto',
        calendars,
        writeCalendarId: calendars.some((c) => c.id === s.writeCalendarId && c.canWrite) ? s.writeCalendarId : undefined,
      }))
      await fetchEvents(accessToken, calendars)
    } catch (e) {
      handleError(e)
    } finally {
      setSyncing(false)
    }
  }, [ensureToken, fetchEvents, handleError, setSettings])

  const refresh = useCallback(
    async (interactive: boolean) => {
      if (!settingsRef.current.account) return
      setSyncing(true)
      setError(undefined)
      try {
        const accessToken = await ensureToken({ interactive })
        await fetchEvents(accessToken, settingsRef.current.calendars)
      } catch (e) {
        // ohne Klick ist eine abgelaufene Verbindung kein Fehler – der Stand bleibt sichtbar
        if (interactive || !(e instanceof GoogleAuthError)) handleError(e)
      } finally {
        setSyncing(false)
      }
    },
    [ensureToken, fetchEvents, handleError],
  )

  const disconnect = useCallback(() => {
    if (tokenRef.current) revokeAccessToken(tokenRef.current.accessToken)
    setToken(null)
    setCache(null)
    setError(undefined)
    setSettings((s) => ({ clientId: s.clientId, calendars: [] }))
  }, [setCache, setSettings, setToken])

  const setClientId = useCallback(
    (value: string | undefined) => setSettings((s) => ({ ...s, clientId: value?.trim() || undefined })),
    [setSettings],
  )

  const updateCalendar = useCallback(
    (id: string, changes: Partial<Pick<GoogleCalendarSetting, 'selected' | 'area'>>) => {
      setSettings((s) => ({ ...s, calendars: s.calendars.map((c) => (c.id === id ? { ...c, ...changes } : c)) }))
      // neu ausgewählte Kalender gleich laden, falls die Verbindung noch gilt
      if (changes.selected) void refresh(false)
    },
    [refresh, setSettings],
  )

  const setWriteCalendar = useCallback(
    (id: string | undefined) => {
      // Schreibrecht sofort erfragen – der Aufruf kommt aus der Auswahl (Klick)
      if (id) ensureToken({ interactive: true, write: true }).catch(handleError)
      setSettings((s) => ({
        ...s,
        writeCalendarId: id,
        // der Zielkalender wird angezeigt, sonst wären neue Termine unsichtbar
        calendars: s.calendars.map((c) => (c.id === id ? { ...c, selected: true } : c)),
      }))
    },
    [ensureToken, handleError, setSettings],
  )

  const createEvent = useCallback(
    async (input: NewGoogleEvent) => {
      const calendarId = settingsRef.current.writeCalendarId
      if (!calendarId) throw new Error('Kein Google-Kalender für neue Termine gewählt.')
      try {
        const accessToken = await ensureToken({ interactive: false, write: true })
        const created = await insertEvent(accessToken, calendarId, buildEventPayload(input, timeZone()))
        const today = todayLocal()
        const current = cacheRef.current ?? { fetchedAt: new Date().toISOString(), from: addDays(today, -PAST_DAYS), to: addDays(today, FUTURE_DAYS), events: [] }
        setCache({ ...current, events: [...current.events, { ...created, calendarId }] })
        return created
      } catch (e) {
        if (e instanceof GoogleAuthError) setToken(null)
        throw e
      }
    },
    [ensureToken, setCache, setToken],
  )

  // Beim Start und beim Zurückkehren in die App still aktualisieren, solange die Verbindung gilt
  useEffect(() => {
    if (!settings.account) return
    if (clientId && navigator.onLine) loadGis().catch(() => undefined)
    const maybeRefresh = () => {
      if (document.visibilityState !== 'visible' || !isTokenValid(tokenRef.current, Date.now())) return
      const fetchedAt = cacheRef.current ? Date.parse(cacheRef.current.fetchedAt) : 0
      if (Date.now() - fetchedAt > AUTO_REFRESH_MS) void refresh(false)
    }
    maybeRefresh()
    document.addEventListener('visibilitychange', maybeRefresh)
    return () => document.removeEventListener('visibilitychange', maybeRefresh)
  }, [settings.account, clientId, refresh])

  const items = useMemo(() => (cache && settings.account ? itemsFromCache(cache, settings) : []), [cache, settings])

  const value = useMemo<GoogleCalendar>(
    () => ({
      configured: Boolean(clientId),
      clientId,
      clientIdFromBuild: Boolean(BUILD_CLIENT_ID) && !settings.clientId,
      connected: Boolean(settings.account),
      account: settings.account,
      syncing,
      error,
      lastSync: settings.account ? cache?.fetchedAt : undefined,
      items,
      settings,
      writeCalendar: settings.calendars.find((c) => c.id === settings.writeCalendarId),
      connect,
      refresh,
      disconnect,
      setClientId,
      updateCalendar,
      setWriteCalendar,
      ensureToken,
      createEvent,
    }),
    [clientId, settings, syncing, error, cache, items, connect, refresh, disconnect, setClientId, updateCalendar, setWriteCalendar, ensureToken, createEvent],
  )

  return <GoogleCalendarContext.Provider value={value}>{children}</GoogleCalendarContext.Provider>
}
