import { COLLECTION_NAMES, type BackupData } from './types'

export class BackupError extends Error {}

/**
 * Prüft eine eingelesene JSON-Sicherung und gibt sie typisiert zurück.
 * Wirft `BackupError` mit einer verständlichen Meldung, wenn etwas nicht passt.
 */
export function parseBackup(input: unknown): BackupData {
  if (!isObject(input) || input.app !== 'gtd') {
    throw new BackupError('Das ist keine Sicherung dieser App.')
  }
  if (input.version !== 1) {
    throw new BackupError(`Unbekannte Version der Sicherung: ${String(input.version)}`)
  }
  const data = input.data
  if (!isObject(data)) throw new BackupError('Die Sicherung enthält keine Daten.')

  for (const name of COLLECTION_NAMES) {
    const list = data[name] ?? []
    if (!Array.isArray(list)) throw new BackupError(`„${name}“ ist keine Liste.`)
    for (const record of list) {
      if (!isObject(record) || typeof record.id !== 'string' || typeof record.createdAt !== 'string') {
        throw new BackupError(`Ungültiger Eintrag in „${name}“.`)
      }
    }
  }

  const normalized = Object.fromEntries(COLLECTION_NAMES.map((name) => [name, data[name] ?? []]))
  return {
    app: 'gtd',
    version: 1,
    exportedAt: typeof input.exportedAt === 'string' ? input.exportedAt : new Date().toISOString(),
    data: normalized as BackupData['data'],
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
