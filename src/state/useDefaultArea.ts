import type { Area } from '../data/types'
import { usePrefs } from './prefs'

/** Bereich für neue Einträge: der gefilterte Bereich, sonst der zuletzt verwendete */
export function useDefaultArea(): Area {
  const { areaFilter, lastArea } = usePrefs()
  return areaFilter === 'alle' ? lastArea : areaFilter
}
