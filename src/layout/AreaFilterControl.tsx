import { Segmented } from '../components/Chips'
import type { AreaFilter } from '../data/types'
import { usePrefs } from '../state/prefs'

const OPTIONS: { value: AreaFilter; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'arbeit', label: 'Arbeit' },
  { value: 'privat', label: 'Privat' },
]

export function AreaFilterControl() {
  const { areaFilter, setAreaFilter } = usePrefs()
  return <Segmented label="Bereich" options={OPTIONS} value={areaFilter} onChange={setAreaFilter} size="sm" />
}
