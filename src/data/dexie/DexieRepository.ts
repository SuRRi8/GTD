import { liveQuery, type Table, type UpdateSpec } from 'dexie'
import { parseBackup } from '../backup'
import { DEFAULT_CONTEXT_NAMES } from '../defaults'
import { newId } from '../ids'
import type { Collection, Collections, GtdRepository, Unsubscribe } from '../repository'
import {
  COLLECTION_NAMES,
  type BackupData,
  type BaseRecord,
  type Context,
  type GtdSnapshot,
  type NewRecord,
  type RecordChanges,
} from '../types'
import { GtdDatabase } from './db'

export interface DexieRepositoryOptions {
  /** Name der IndexedDB-Datenbank */
  name?: string
  /** Uhr, in Tests ersetzbar */
  now?: () => Date
}

class DexieCollection<T extends BaseRecord> implements Collection<T> {
  private readonly table: Table<T, string>
  private readonly now: () => string

  constructor(table: Table<T, string>, now: () => string) {
    this.table = table
    this.now = now
  }

  async list(): Promise<T[]> {
    const all = await this.table.toArray()
    return all.filter((record) => !record.deletedAt)
  }

  async get(id: string): Promise<T | undefined> {
    const record = await this.table.get(id)
    return record && !record.deletedAt ? record : undefined
  }

  async add(data: NewRecord<T>): Promise<T> {
    const timestamp = this.now()
    const record = { ...withoutUndefined(data), id: newId(), createdAt: timestamp, updatedAt: timestamp } as T
    await this.table.add(record)
    return record
  }

  async update(id: string, changes: RecordChanges<T>): Promise<void> {
    await this.table.update(id, { ...changes, updatedAt: this.now() } as unknown as UpdateSpec<T>)
  }

  async remove(id: string): Promise<void> {
    const timestamp = this.now()
    await this.table.update(id, { deletedAt: timestamp, updatedAt: timestamp } as unknown as UpdateSpec<T>)
  }

  async restore(id: string): Promise<void> {
    await this.table.update(id, { deletedAt: undefined, updatedAt: this.now() } as unknown as UpdateSpec<T>)
  }
}

/** Entfernt Felder mit `undefined`, damit gespeicherte Datensätze schlank bleiben */
function withoutUndefined<T extends object>(data: T): T {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T
}

export class DexieRepository implements GtdRepository {
  readonly db: GtdDatabase
  private readonly clock: () => Date
  private readonly collections: Collections

  constructor(options: DexieRepositoryOptions = {}) {
    this.db = new GtdDatabase(options.name ?? 'gtd')
    this.clock = options.now ?? (() => new Date())
    const now = () => this.clock().toISOString()

    this.collections = Object.fromEntries(
      COLLECTION_NAMES.map((name) => [name, new DexieCollection(this.db[name] as Table<BaseRecord, string>, now)]),
    ) as unknown as Collections

    // Beim allerersten Öffnen die Standard-Kontexte anlegen
    this.db.on('populate', (tx) => {
      tx.table('contexts').bulkAdd(this.defaultContexts())
    })
  }

  get inbox() { return this.collections.inbox }
  get projects() { return this.collections.projects }
  get actions() { return this.collections.actions }
  get waiting() { return this.collections.waiting }
  get calendar() { return this.collections.calendar }
  get references() { return this.collections.references }
  get contexts() { return this.collections.contexts }
  get people() { return this.collections.people }
  get reviews() { return this.collections.reviews }

  transaction<R>(fn: () => Promise<R>): Promise<R> {
    return this.db.transaction('rw', this.db.tables, fn)
  }

  async snapshot(): Promise<GtdSnapshot> {
    return this.db.transaction('r', this.db.tables, async () => {
      const entries = await Promise.all(
        COLLECTION_NAMES.map(async (name) => [name, await this.collections[name].list()] as const),
      )
      return Object.fromEntries(entries) as GtdSnapshot
    })
  }

  watch<T>(query: () => Promise<T>, onNext: (value: T) => void, onError?: (error: unknown) => void): Unsubscribe {
    const subscription = liveQuery(query).subscribe({ next: onNext, error: onError })
    return () => subscription.unsubscribe()
  }

  async exportAll(): Promise<BackupData> {
    const data = await this.db.transaction('r', this.db.tables, async () => {
      const entries = await Promise.all(
        COLLECTION_NAMES.map(async (name) => [name, await this.db[name].toArray()] as const),
      )
      return Object.fromEntries(entries)
    })
    return { app: 'gtd', version: 1, exportedAt: this.clock().toISOString(), data: data as BackupData['data'] }
  }

  async importAll(backup: BackupData): Promise<void> {
    const checked = parseBackup(backup)
    await this.db.transaction('rw', this.db.tables, async () => {
      for (const name of COLLECTION_NAMES) {
        const table = this.db[name] as Table<BaseRecord, string>
        await table.clear()
        await table.bulkAdd(checked.data[name])
      }
    })
  }

  async clearAll(): Promise<void> {
    await this.db.transaction('rw', this.db.tables, async () => {
      for (const name of COLLECTION_NAMES) await this.db[name].clear()
      await this.db.contexts.bulkAdd(this.defaultContexts())
    })
  }

  /** Schließt die Datenbankverbindung (für Tests) */
  close(): void {
    this.db.close()
  }

  private defaultContexts(): Context[] {
    const timestamp = this.clock().toISOString()
    return DEFAULT_CONTEXT_NAMES.map((name, index) => ({
      id: newId(),
      name,
      order: index,
      createdAt: timestamp,
      updatedAt: timestamp,
    }))
  }
}
