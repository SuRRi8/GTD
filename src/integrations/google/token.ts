import type { GoogleToken } from './types'

/** Sicherheitsabstand, damit ein Token nicht mitten in einer Anfrage abläuft */
const MARGIN_MS = 60_000

export function isTokenValid(token: GoogleToken | null | undefined, now: number): token is GoogleToken {
  return Boolean(token && token.expiresAt - MARGIN_MS > now)
}

/** Enthält der gewährte Umfang alle verlangten Berechtigungen? */
export function hasScopes(granted: string, required: string): boolean {
  const have = new Set(granted.split(/\s+/).filter(Boolean))
  return required.split(/\s+/).filter(Boolean).every((scope) => have.has(scope))
}

const KEY = 'gtd.google.token'

/** Das Token liegt nur im Sitzungsspeicher des Tabs, nicht dauerhaft */
export function readSessionToken(): GoogleToken | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const token = JSON.parse(raw) as GoogleToken
    return typeof token.accessToken === 'string' && typeof token.expiresAt === 'number' ? token : null
  } catch {
    return null
  }
}

export function writeSessionToken(token: GoogleToken | null): void {
  try {
    if (token) sessionStorage.setItem(KEY, JSON.stringify(token))
    else sessionStorage.removeItem(KEY)
  } catch {
    // Sitzungsspeicher nicht verfügbar – Token gilt dann nur bis zum Neuladen
  }
}
