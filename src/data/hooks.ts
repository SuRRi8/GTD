import { createContext, useContext } from 'react'
import type { GtdRepository } from './repository'
import type { GtdSnapshot } from './types'

export const RepositoryContext = createContext<GtdRepository | null>(null)
export const SnapshotContext = createContext<GtdSnapshot | null>(null)

/** Zugriff auf die Datenschicht (zum Schreiben) */
export function useRepo(): GtdRepository {
  const repo = useContext(RepositoryContext)
  if (!repo) throw new Error('useRepo außerhalb von <DataProvider>')
  return repo
}

/** Aktueller Stand aller Daten; aktualisiert sich bei jeder Änderung selbst */
export function useData(): GtdSnapshot {
  const snapshot = useContext(SnapshotContext)
  if (!snapshot) throw new Error('useData außerhalb von <DataProvider>')
  return snapshot
}
