import { useCallback, useState } from 'react'

/** Liest einen Wert aus localStorage; fällt bei Fehlern still auf `fallback` zurück */
export function readStored<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const value: unknown = JSON.parse(raw)
    return isValid(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Speicher voll oder gesperrt – Einstellung gilt dann nur bis zum Neuladen
  }
}

/** useState, das seinen Wert in localStorage behält (nur für Geräte-Einstellungen) */
export function usePersistentState<T>(key: string, fallback: T, isValid: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => readStored(key, fallback, isValid))
  const set = useCallback(
    (next: T) => {
      setValue(next)
      writeStored(key, next)
    },
    [key],
  )
  return [value, set] as const
}
