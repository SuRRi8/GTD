import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DexieRepository } from '../data/dexie/DexieRepository'
import { visibleInbox } from '../domain/tickler'
import { createTestRepository } from '../test/helpers'
import { applyClarifyDecision } from './clarify'

let repo: DexieRepository
const now = new Date('2026-10-22T09:00:00')

beforeEach(() => {
  repo = createTestRepository(() => now)
})
afterEach(() => repo.close())

describe('applyClarifyDecision', () => {
  it('nimmt den Eintrag aus dem Eingang und legt einen nächsten Schritt an', async () => {
    const item = await repo.inbox.add({ text: 'Angebot' })
    await applyClarifyDecision(
      repo,
      item.id,
      { kind: 'actionable', area: 'arbeit', doneActions: [], next: { kind: 'action', title: 'Anna anrufen wegen Angebot', contextId: 'c1', minutes: 15 } },
      now,
    )
    const snapshot = await repo.snapshot()
    expect(snapshot.inbox).toEqual([])
    expect(snapshot.actions).toHaveLength(1)
    expect(snapshot.actions[0]).toMatchObject({ title: 'Anna anrufen wegen Angebot', area: 'arbeit', contextId: 'c1', minutes: 15 })
    expect(snapshot.actions[0]).not.toHaveProperty('projectId')
  })

  it('legt Projekt, erledigte Schritte und „Warten auf“ verknüpft an', async () => {
    const item = await repo.inbox.add({ text: 'Website' })
    await applyClarifyDecision(
      repo,
      item.id,
      {
        kind: 'actionable',
        area: 'arbeit',
        project: { title: 'Neue Website', outcome: 'die Seite ist online' },
        doneActions: ['Agentur kurz anmailen'],
        next: { kind: 'waiting', title: 'Angebot der Agentur', personId: 'p1', followUpOn: '2026-10-29' },
      },
      now,
    )
    const { projects, actions, waiting } = await repo.snapshot()
    expect(projects).toHaveLength(1)
    expect(projects[0]).toMatchObject({ title: 'Neue Website', outcome: 'die Seite ist online', status: 'aktiv' })
    expect(actions[0]).toMatchObject({ title: 'Agentur kurz anmailen', projectId: projects[0].id, doneAt: now.toISOString() })
    expect(waiting[0]).toMatchObject({ personId: 'p1', projectId: projects[0].id, since: '2026-10-22', followUpOn: '2026-10-29' })
  })

  it('trägt Kalendereinträge ein', async () => {
    const item = await repo.inbox.add({ text: 'Zahnarzt' })
    await applyClarifyDecision(
      repo,
      item.id,
      { kind: 'actionable', area: 'privat', doneActions: [], next: { kind: 'calendar', title: 'Zahnarzt', calendarKind: 'termin', date: '2026-11-03', time: '08:15' } },
      now,
    )
    const { calendar } = await repo.snapshot()
    expect(calendar[0]).toMatchObject({ title: 'Zahnarzt', kind: 'termin', date: '2026-11-03', time: '08:15', area: 'privat' })
  })

  it('Wiedervorlage: Eintrag verschwindet und taucht am Datum wieder auf', async () => {
    const item = await repo.inbox.add({ text: 'Konzertkarten' })
    await applyClarifyDecision(repo, item.id, { kind: 'tickler', text: 'Konzertkarten kaufen', tickleDate: '2026-11-01' }, now)
    const { inbox } = await repo.snapshot()
    expect(visibleInbox(inbox, '2026-10-22')).toEqual([])
    expect(visibleInbox(inbox, '2026-11-01').map((i) => i.text)).toEqual(['Konzertkarten kaufen'])
  })

  it('speichert Referenz und Irgendwann/Vielleicht', async () => {
    const a = await repo.inbox.add({ text: 'WLAN-Passwort' })
    const b = await repo.inbox.add({ text: 'Tauchkurs' })
    await applyClarifyDecision(repo, a.id, { kind: 'reference', text: 'WLAN-Passwort', area: 'arbeit' }, now)
    await applyClarifyDecision(repo, b.id, { kind: 'someday', text: 'Tauchkurs', area: 'privat' }, now)
    const { references, projects, inbox } = await repo.snapshot()
    expect(inbox).toEqual([])
    expect(references[0]).toMatchObject({ title: 'WLAN-Passwort', area: 'arbeit' })
    expect(projects[0]).toMatchObject({ title: 'Tauchkurs', status: 'irgendwann', outcome: '' })
  })

  it('löscht den Eintrag', async () => {
    const item = await repo.inbox.add({ text: 'Spam' })
    await applyClarifyDecision(repo, item.id, { kind: 'delete' }, now)
    expect(await repo.inbox.list()).toEqual([])
  })
})
