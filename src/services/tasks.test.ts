import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { emptyProjectNotes } from '../data/defaults'
import type { DexieRepository } from '../data/dexie/DexieRepository'
import { createTestRepository } from '../test/helpers'
import { completeAction, deleteProject, reopenAction, setProjectStatus } from './tasks'

let repo: DexieRepository
const now = new Date('2026-10-22T09:00:00Z')
beforeEach(() => {
  repo = createTestRepository(() => now)
})
afterEach(() => repo.close())

async function projectWithItems() {
  const project = await repo.projects.add({ title: 'Umzug', outcome: 'wohnen neu', area: 'privat', status: 'aktiv', notes: emptyProjectNotes() })
  const action = await repo.actions.add({ title: 'Kartons besorgen', area: 'privat', projectId: project.id, contextId: 'c' })
  const waiting = await repo.waiting.add({ title: 'Angebot Umzugsfirma', area: 'privat', projectId: project.id, personId: 'p', since: '2026-10-20' })
  return { project, action, waiting }
}

describe('Schritte und Projekte abschließen', () => {
  it('hakt einen Schritt ab und kann es rückgängig machen', async () => {
    const { action } = await projectWithItems()
    await completeAction(repo, action.id, now)
    expect((await repo.actions.get(action.id))?.doneAt).toBe(now.toISOString())
    await reopenAction(repo, action.id)
    expect((await repo.actions.get(action.id))?.doneAt).toBeUndefined()
  })

  it('schließt beim Erledigen eines Projekts offene Einträge mit ab', async () => {
    const { project, action, waiting } = await projectWithItems()
    await setProjectStatus(repo, project.id, 'erledigt', now)
    expect(await repo.projects.get(project.id)).toMatchObject({ status: 'erledigt', completedAt: now.toISOString() })
    expect((await repo.actions.get(action.id))?.doneAt).toBe(now.toISOString())
    expect((await repo.waiting.get(waiting.id))?.doneAt).toBe(now.toISOString())
  })

  it('lässt beim Zurückstellen auf Irgendwann die Schritte offen', async () => {
    const { project, action } = await projectWithItems()
    await setProjectStatus(repo, project.id, 'irgendwann', now)
    expect((await repo.actions.get(action.id))?.doneAt).toBeUndefined()
  })

  it('löscht ein Projekt samt Schritten', async () => {
    const { project } = await projectWithItems()
    await deleteProject(repo, project.id)
    const snapshot = await repo.snapshot()
    expect([snapshot.projects.length, snapshot.actions.length, snapshot.waiting.length]).toEqual([0, 0, 0])
  })
})
