import { describe, expect, it } from 'vitest'
import { isStalled } from '../../domain/projects'
import { emptyProjectNotes } from '../../data/defaults'
import { buildEventPayload, eventToItems, itemsFromCache } from './mapping'
import type { CachedEvent, GoogleCalendarSetting, GoogleSettings } from './types'

const work: GoogleCalendarSetting = { id: 'arbeit@x', name: 'Arbeit', color: '#3a5f94', canWrite: true, selected: true, area: 'arbeit' }
const shared: GoogleCalendarSetting = { id: 'familie@x', name: 'Familie', canWrite: true, selected: true, area: 'beide' }
const from = '2026-10-08'
const to = '2026-12-21'

const event = (extra: Partial<CachedEvent>): CachedEvent => ({
  id: 'e1',
  calendarId: work.id,
  summary: 'Team-Meeting',
  start: { dateTime: '2026-10-23T10:00:00+02:00' },
  end: { dateTime: '2026-10-23T11:30:00+02:00' },
  created: '2026-10-01T08:00:00Z',
  ...extra,
})

describe('Google-Termine umrechnen', () => {
  it('läuft in der Testzeitzone Europe/Berlin', () => {
    expect(new Date('2026-10-23T08:00:00Z').getHours()).toBe(10)
  })

  it('macht aus einem Termin mit Uhrzeit einen Termin am lokalen Tag', () => {
    const [item] = eventToItems(event({}), work, from, to)
    expect(item).toMatchObject({ kind: 'termin', date: '2026-10-23', time: '10:00', title: 'Team-Meeting', area: 'arbeit' })
    expect(item.external).toMatchObject({ source: 'google', calendarName: 'Arbeit', endTime: '11:30' })
  })

  it('rechnet andere Zeitzonen in die eigene um', () => {
    const [item] = eventToItems(event({ start: { dateTime: '2026-10-23T23:30:00-04:00' }, end: undefined }), work, from, to)
    expect(item).toMatchObject({ date: '2026-10-24', time: '05:30' })
  })

  it('verteilt ganztägige Termine auf jeden Tag (Ende exklusiv)', () => {
    const items = eventToItems(event({ start: { date: '2026-10-30' }, end: { date: '2026-11-02' } }), work, from, to)
    expect(items.map((i) => [i.date, i.kind])).toEqual([
      ['2026-10-30', 'tagesinfo'],
      ['2026-10-31', 'tagesinfo'],
      ['2026-11-01', 'tagesinfo'],
    ])
    expect(new Set(items.map((i) => i.id)).size).toBe(3)
  })

  it('begrenzt lange ganztägige Termine auf den abgerufenen Zeitraum', () => {
    const items = eventToItems(event({ start: { date: '2026-01-01' }, end: { date: '2027-01-01' } }), work, from, to)
    expect(items[0].date).toBe(from)
    expect(items.at(-1)?.date).toBe(to)
  })

  it('lässt abgesagte Termine weg und ergänzt fehlende Titel', () => {
    expect(eventToItems(event({ status: 'cancelled' }), work, from, to)).toEqual([])
    expect(eventToItems(event({ summary: '  ' }), work, from, to)[0].title).toBe('(Ohne Titel)')
  })

  it('liest Bereich, Projekt und Art aus Terminen, die die App angelegt hat', () => {
    const [item] = eventToItems(
      event({ start: { date: '2026-10-24' }, end: { date: '2026-10-25' }, extendedProperties: { private: { gtdKind: 'tagesaufgabe', gtdArea: 'privat', gtdProjectId: 'p1' } } }),
      work,
      from,
      to,
    )
    expect(item).toMatchObject({ kind: 'tagesaufgabe', area: 'privat', projectId: 'p1' })
    expect(item.anyArea).toBeUndefined()
  })

  it('markiert Termine aus gemeinsamen Kalendern für beide Bereiche', () => {
    const [item] = eventToItems(event({ calendarId: shared.id }), shared, from, to)
    expect(item.anyArea).toBe(true)
  })

  it('zeigt nur ausgewählte Kalender und doppelte Termine nur einmal', () => {
    const settings: GoogleSettings = { calendars: [work, { ...shared, selected: false }, { ...shared, id: 'kopie@x', selected: true }] }
    const cache = {
      fetchedAt: '2026-10-22T10:00:00Z',
      from,
      to,
      events: [event({}), event({ calendarId: 'familie@x', id: 'e2' }), event({ calendarId: 'kopie@x' })],
    }
    expect(itemsFromCache(cache, settings).map((i) => i.external?.calendarId)).toEqual(['arbeit@x'])
  })

  it('Google-Termine mit Projektbezug verhindern Stillstand', () => {
    const project = { id: 'p1', title: 'Workshop', outcome: 'gelaufen', area: 'arbeit' as const, status: 'aktiv' as const, notes: emptyProjectNotes(), createdAt: '', updatedAt: '' }
    const [item] = eventToItems(event({ extendedProperties: { private: { gtdProjectId: 'p1' } } }), work, from, to)
    expect(isStalled(project, { actions: [], waiting: [], calendar: [item] }, '2026-10-22')).toBe(false)
  })
})

describe('Termine für Google erstellen', () => {
  it('legt Termine mit Uhrzeit, Zeitzone und einer Stunde Dauer an', () => {
    const payload = buildEventPayload({ title: 'Zahnarzt', kind: 'termin', date: '2026-10-30', time: '23:30', area: 'privat', projectId: 'p1' }, 'Europe/Berlin')
    expect(payload.start).toEqual({ dateTime: '2026-10-30T23:30:00', timeZone: 'Europe/Berlin' })
    expect(payload.end).toEqual({ dateTime: '2026-10-31T00:30:00', timeZone: 'Europe/Berlin' })
    expect(payload.extendedProperties?.private).toEqual({ gtdKind: 'termin', gtdArea: 'privat', gtdProjectId: 'p1' })
  })

  it('legt Tagesaufgaben und Tagesinfos ganztägig an', () => {
    const payload = buildEventPayload({ title: 'Frist Angebot', kind: 'tagesaufgabe', date: '2026-10-31', area: 'arbeit' }, 'Europe/Berlin')
    expect(payload.start).toEqual({ date: '2026-10-31' })
    expect(payload.end).toEqual({ date: '2026-11-01' })
  })

  it('wird beim Zurücklesen wieder zum gleichen Eintrag', () => {
    const payload = buildEventPayload({ title: 'Frist Angebot', kind: 'tagesaufgabe', date: '2026-10-31', area: 'arbeit', projectId: 'p9' }, 'Europe/Berlin')
    const [item] = eventToItems({ ...payload, id: 'neu', calendarId: shared.id }, shared, from, to)
    expect(item).toMatchObject({ title: 'Frist Angebot', kind: 'tagesaufgabe', date: '2026-10-31', area: 'arbeit', projectId: 'p9' })
    expect(item.anyArea).toBeUndefined()
  })
})
