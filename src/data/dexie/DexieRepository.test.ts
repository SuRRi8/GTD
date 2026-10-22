import { afterEach, describe, expect, it } from 'vitest'
import { createTestRepository } from '../../test/helpers'
import { DEFAULT_CONTEXT_NAMES } from '../defaults'
import type { DexieRepository } from './DexieRepository'

let repo: DexieRepository
afterEach(() => repo?.close())

describe('DexieRepository', () => {
  it('legt beim ersten Start die Standard-Kontexte an', async () => {
    repo = createTestRepository()
    const contexts = await repo.contexts.list()
    expect(contexts.map((c) => c.name).sort()).toEqual([...DEFAULT_CONTEXT_NAMES].sort())
  })

  it('setzt id und Zeitstempel automatisch', async () => {
    let clock = new Date('2026-10-22T09:00:00Z')
    repo = createTestRepository(() => clock)
    const item = await repo.inbox.add({ text: 'Anna anrufen' })
    expect(item.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(item.createdAt).toBe('2026-10-22T09:00:00.000Z')

    clock = new Date('2026-10-23T10:00:00Z')
    await repo.inbox.update(item.id, { text: 'Anna wegen Angebot anrufen' })
    const updated = await repo.inbox.get(item.id)
    expect(updated?.text).toBe('Anna wegen Angebot anrufen')
    expect(updated?.createdAt).toBe('2026-10-22T09:00:00.000Z')
    expect(updated?.updatedAt).toBe('2026-10-23T10:00:00.000Z')
  })

  it('löscht weich: Grabstein bleibt im Export, verschwindet aus Listen', async () => {
    repo = createTestRepository()
    const item = await repo.inbox.add({ text: 'weg damit' })
    await repo.inbox.remove(item.id)
    expect(await repo.inbox.list()).toEqual([])
    expect(await repo.inbox.get(item.id)).toBeUndefined()
    const backup = await repo.exportAll()
    expect(backup.data.inbox[0].deletedAt).toBeDefined()
  })

  it('macht Transaktionen bei einem Fehler vollständig rückgängig', async () => {
    repo = createTestRepository()
    await expect(
      repo.transaction(async () => {
        await repo.inbox.add({ text: 'eins' })
        throw new Error('kaputt')
      }),
    ).rejects.toThrow('kaputt')
    expect(await repo.inbox.list()).toEqual([])
  })

  it('exportiert und importiert alle Daten verlustfrei', async () => {
    repo = createTestRepository()
    await repo.inbox.add({ text: 'Idee' })
    await repo.people.add({ name: 'Anna' })
    const backup = await repo.exportAll()

    const other = createTestRepository()
    await other.importAll(JSON.parse(JSON.stringify(backup)))
    const snapshot = await other.snapshot()
    expect(snapshot.inbox.map((i) => i.text)).toEqual(['Idee'])
    expect(snapshot.people.map((p) => p.name)).toEqual(['Anna'])
    expect(snapshot.contexts).toHaveLength(DEFAULT_CONTEXT_NAMES.length)
    other.close()
  })

  it('löscht alles und legt die Standard-Kontexte neu an', async () => {
    repo = createTestRepository()
    await repo.inbox.add({ text: 'Idee' })
    await repo.clearAll()
    const snapshot = await repo.snapshot()
    expect(snapshot.inbox).toEqual([])
    expect(snapshot.contexts).toHaveLength(DEFAULT_CONTEXT_NAMES.length)
  })
})
