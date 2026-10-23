/**
 * Google-Anmeldung im Browser (Google Identity Services, Token-Modell).
 * Ohne Server gibt es nur kurzlebige Zugriffstoken (ca. 1 Stunde) – danach
 * öffnet „Aktualisieren“ kurz das Google-Fenster.
 */

export const SCOPE_READ = 'https://www.googleapis.com/auth/calendar.readonly'
export const SCOPE_WRITE = 'https://www.googleapis.com/auth/calendar.events'

const SCRIPT_URL = 'https://accounts.google.com/gsi/client'

interface TokenResponse {
  access_token?: string
  expires_in?: number | string
  scope?: string
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken(overrides?: { prompt?: string; scope?: string }): void
}

interface GoogleOAuth2 {
  initTokenClient(config: {
    client_id: string
    scope: string
    prompt?: string
    include_granted_scopes?: boolean
    callback: (response: TokenResponse) => void
    error_callback?: (error: { type?: string; message?: string }) => void
  }): TokenClient
  revoke(token: string, done?: () => void): void
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } }
  }
}

let scriptPromise: Promise<void> | null = null

function oauth2(): GoogleOAuth2 | undefined {
  return window.google?.accounts?.oauth2
}

/** Lädt das Google-Skript einmalig (am besten vorab, damit der Klick sofort ein Fenster öffnen kann) */
export function loadGis(): Promise<void> {
  if (oauth2()) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.onload = () => (oauth2() ? resolve() : reject(new Error('Google-Anmeldung nicht verfügbar.')))
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Google ist nicht erreichbar. Bist du online?'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

export interface AccessToken {
  accessToken: string
  expiresIn: number
  scope: string
}

/**
 * Fordert ein Zugriffstoken an. Muss direkt aus einem Klick heraus aufgerufen werden,
 * sonst blockiert der Browser das Google-Fenster.
 */
export function requestAccessToken(clientId: string, scope: string, prompt: '' | 'consent'): Promise<AccessToken> {
  const run = (resolve: (token: AccessToken) => void, reject: (error: Error) => void) => {
    const client = oauth2()!.initTokenClient({
      client_id: clientId,
      scope,
      prompt,
      include_granted_scopes: true,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || 'Google hat den Zugriff nicht erlaubt.'))
          return
        }
        resolve({ accessToken: response.access_token, expiresIn: Number(response.expires_in ?? 3600), scope: response.scope ?? '' })
      },
      error_callback: (error) => {
        reject(
          new Error(
            error.type === 'popup_failed_to_open'
              ? 'Das Google-Fenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben.'
              : 'Die Anmeldung bei Google wurde abgebrochen.',
          ),
        )
      },
    })
    client.requestAccessToken()
  }
  return new Promise<AccessToken>((resolve, reject) => {
    if (oauth2()) run(resolve, reject)
    else loadGis().then(() => run(resolve, reject), reject)
  })
}

export function revokeAccessToken(token: string): void {
  oauth2()?.revoke(token)
}
