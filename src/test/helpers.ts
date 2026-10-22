import { DexieRepository } from '../data/dexie/DexieRepository'
import { newId } from '../data/ids'

/** Frische Repository-Instanz mit eigener (In-Memory-)Datenbank */
export function createTestRepository(now: () => Date = () => new Date('2026-10-22T09:00:00')) {
  return new DexieRepository({ name: `test-${newId()}`, now })
}
