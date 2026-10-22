import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DexieRepository } from '../data/dexie/DexieRepository'
import { sortContexts } from '../domain/sorting'
import { createTestRepository } from '../test/helpers'
import { addContext, moveContext } from './settings'

let repo: DexieRepository
beforeEach(() => {
  repo = createTestRepository()
})
afterEach(() => repo.close())

const names = async () => sortContexts(await repo.contexts.list()).map((c) => c.name)

describe('Kontexte verwalten', () => {
  it('hängt neue Kontexte hinten an', async () => {
    await addContext(repo, '  Auto ')
    expect((await names()).at(-1)).toBe('Auto')
  })

  it('verschiebt Kontexte nach oben und unten', async () => {
    const before = await names()
    const second = sortContexts(await repo.contexts.list())[1]
    await moveContext(repo, second.id, -1)
    expect((await names()).slice(0, 2)).toEqual([before[1], before[0]])
    await moveContext(repo, second.id, 1)
    expect(await names()).toEqual(before)
  })

  it('ignoriert Verschieben über den Rand hinaus', async () => {
    const before = await names()
    const first = sortContexts(await repo.contexts.list())[0]
    await moveContext(repo, first.id, -1)
    expect(await names()).toEqual(before)
  })
})
