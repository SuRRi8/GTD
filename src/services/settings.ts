import type { GtdRepository } from '../data/repository'
import type { Context } from '../data/types'
import { sortContexts } from '../domain/sorting'

export async function addContext(repo: GtdRepository, name: string): Promise<Context> {
  const contexts = await repo.contexts.list()
  const order = contexts.reduce((max, c) => Math.max(max, c.order), -1) + 1
  return repo.contexts.add({ name: name.trim(), order })
}

/** Verschiebt einen Kontext eine Position nach oben (-1) oder unten (+1) */
export async function moveContext(repo: GtdRepository, contextId: string, direction: -1 | 1): Promise<void> {
  await repo.transaction(async () => {
    const sorted = sortContexts(await repo.contexts.list())
    const index = sorted.findIndex((c) => c.id === contextId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= sorted.length) return
    ;[sorted[index], sorted[target]] = [sorted[target], sorted[index]]
    for (const [order, context] of sorted.entries()) {
      if (context.order !== order) await repo.contexts.update(context.id, { order })
    }
  })
}
