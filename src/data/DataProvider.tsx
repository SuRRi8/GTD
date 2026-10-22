import { useEffect, useState, type ReactNode } from 'react'
import { RepositoryContext, SnapshotContext } from './hooks'
import type { GtdRepository } from './repository'
import type { GtdSnapshot } from './types'

/**
 * Hält einen stets aktuellen Schnappschuss aller Daten im Speicher.
 * Seitenwechsel sind dadurch sofort da, ohne Ladezustände.
 */
export function DataProvider({ repository, children }: { repository: GtdRepository; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<GtdSnapshot>()
  const [error, setError] = useState<unknown>()

  useEffect(() => repository.watch(() => repository.snapshot(), setSnapshot, setError), [repository])

  if (error) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="text-lg font-semibold">Daten konnten nicht geladen werden</h1>
        <p className="mt-2 text-ink-muted">
          Der Browser erlaubt keinen lokalen Speicher (z. B. im privaten Modus). Bitte in einem normalen Fenster öffnen.
        </p>
        <pre className="mt-4 overflow-auto text-left text-xs text-ink-muted">{String(error)}</pre>
      </div>
    )
  }
  if (!snapshot) return null

  return (
    <RepositoryContext.Provider value={repository}>
      <SnapshotContext.Provider value={snapshot}>{children}</SnapshotContext.Provider>
    </RepositoryContext.Provider>
  )
}
