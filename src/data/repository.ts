import type {
  BackupData,
  BaseRecord,
  CollectionMap,
  CollectionName,
  GtdSnapshot,
  NewRecord,
  RecordChanges,
} from './types'

/**
 * Zugriff auf eine Liste von Datensätzen. Gelöschte Datensätze liefern
 * `list` und `get` nicht mehr aus.
 */
export interface Collection<T extends BaseRecord> {
  list(): Promise<T[]>
  get(id: string): Promise<T | undefined>
  add(data: NewRecord<T>): Promise<T>
  update(id: string, changes: RecordChanges<T>): Promise<void>
  /** Weiches Löschen: setzt `deletedAt` */
  remove(id: string): Promise<void>
  /** Macht ein weiches Löschen rückgängig */
  restore(id: string): Promise<void>
}

export type Unsubscribe = () => void

export type Collections = { readonly [K in CollectionName]: Collection<CollectionMap[K]> }

/**
 * Die einzige Schnittstelle, über die die Oberfläche auf Daten zugreift.
 *
 * Heute steckt IndexedDB (Dexie) dahinter. Eine spätere Synchronisierung
 * (z. B. Supabase) ist eine weitere Umsetzung dieser Schnittstelle.
 */
export interface GtdRepository extends Collections {
  /** Führt mehrere Schreibvorgänge atomar aus (ganz oder gar nicht). */
  transaction<R>(fn: () => Promise<R>): Promise<R>

  /** Liest alle nicht gelöschten Datensätze. */
  snapshot(): Promise<GtdSnapshot>

  /**
   * Beobachtet eine Abfrage: `onNext` wird sofort und nach jeder relevanten
   * Änderung (auch aus anderen Tabs) mit dem neuen Ergebnis aufgerufen.
   */
  watch<T>(query: () => Promise<T>, onNext: (value: T) => void, onError?: (error: unknown) => void): Unsubscribe

  /** Vollständige Sicherung inklusive gelöschter Datensätze */
  exportAll(): Promise<BackupData>
  /** Ersetzt alle Daten durch die Sicherung */
  importAll(backup: BackupData): Promise<void>
  /** Löscht alles und legt die Standard-Kontexte wieder an */
  clearAll(): Promise<void>
}
