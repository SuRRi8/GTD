import { createContext, useContext } from 'react'
import type { Area, AreaFilter } from '../data/types'

export type Theme = 'system' | 'hell' | 'dunkel'

/** Einstellungen, die nur auf diesem Gerät gelten (localStorage) */
export interface Prefs {
  areaFilter: AreaFilter
  setAreaFilter(filter: AreaFilter): void
  /** Zuletzt beim Klären gewählter Bereich – Vorauswahl beim nächsten Mal */
  lastArea: Area
  setLastArea(area: Area): void
  theme: Theme
  setTheme(theme: Theme): void
}

export const PrefsContext = createContext<Prefs | null>(null)

export function usePrefs(): Prefs {
  const prefs = useContext(PrefsContext)
  if (!prefs) throw new Error('usePrefs außerhalb von <PrefsProvider>')
  return prefs
}

export const isArea = (v: unknown): v is Area => v === 'arbeit' || v === 'privat'
export const isAreaFilter = (v: unknown): v is AreaFilter => v === 'alle' || isArea(v)
export const isTheme = (v: unknown): v is Theme => v === 'system' || v === 'hell' || v === 'dunkel'
