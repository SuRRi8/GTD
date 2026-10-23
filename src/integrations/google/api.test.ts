import { describe, expect, it, vi } from 'vitest'
import { describeGoogleError, GoogleApiError, GoogleAuthError, insertEvent, listCalendars, listEvents } from './api'
import { hasScopes, isTokenValid } from './token'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('Google Calendar API', () => {
  it('holt alle Seiten eines Kalenders mit Token', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ items: [{ id: 'a', start: {} }], nextPageToken: 'p2' }))
      .mockResolvedValueOnce(json({ items: [{ id: 'b', start: {} }] }))
    const events = await listEvents('tok', 'ich@gmail.com', '2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z', fetchImpl)
    expect(events.map((e) => e.id)).toEqual(['a', 'b'])
    const [firstUrl, init] = fetchImpl.mock.calls[0]
    expect(String(firstUrl)).toContain('/calendars/ich%40gmail.com/events?')
    expect(String(firstUrl)).toContain('singleEvents=true')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer tok')
    expect(String(fetchImpl.mock.calls[1][0])).toContain('pageToken=p2')
  })

  it('liest die Kalenderliste mit Schreibrecht', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      json({ items: [{ id: 'ich@gmail.com', summary: 'Ich', primary: true, accessRole: 'owner' }, { id: 'feiertage', summary: 'Feiertage', accessRole: 'reader' }] }),
    )
    expect(await listCalendars('tok', fetchImpl)).toEqual([
      { id: 'ich@gmail.com', name: 'Ich', color: undefined, primary: true, canWrite: true },
      { id: 'feiertage', name: 'Feiertage', color: undefined, primary: undefined, canWrite: false },
    ])
  })

  it('legt Termine per POST an', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(json({ id: 'neu', start: { date: '2026-10-31' } }))
    const created = await insertEvent('tok', 'ich@gmail.com', { summary: 'X', start: { date: '2026-10-31' } }, fetchImpl)
    expect(created.id).toBe('neu')
    expect(fetchImpl.mock.calls[0][1]?.method).toBe('POST')
  })

  it('unterscheidet abgelaufene Anmeldung und fehlende API', async () => {
    await expect(listCalendars('tok', vi.fn<typeof fetch>().mockResolvedValue(json({}, 401)))).rejects.toBeInstanceOf(GoogleAuthError)
    const error = await listCalendars(
      'tok',
      vi.fn<typeof fetch>().mockResolvedValue(json({ error: { message: 'API disabled', errors: [{ reason: 'accessNotConfigured' }] } }, 403)),
    ).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(GoogleApiError)
    expect(describeGoogleError(error)).toMatch(/nicht aktiviert/)
    expect(describeGoogleError(new GoogleAuthError('x'))).toMatch(/neu verbinden/)
  })
})

describe('Zugriffstoken', () => {
  it('gilt bis kurz vor Ablauf', () => {
    const token = { accessToken: 't', expiresAt: 1_000_000, scope: '' }
    expect(isTokenValid(token, 1_000_000 - 120_000)).toBe(true)
    expect(isTokenValid(token, 1_000_000 - 30_000)).toBe(false)
    expect(isTokenValid(null, 0)).toBe(false)
  })

  it('prüft die gewährten Berechtigungen', () => {
    expect(hasScopes('a b c', 'a c')).toBe(true)
    expect(hasScopes('a', 'a b')).toBe(false)
  })
})
