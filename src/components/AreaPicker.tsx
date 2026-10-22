import type { Area } from '../data/types'
import { Segmented } from './Chips'

export function AreaPicker({ value, onChange }: { value: Area; onChange: (area: Area) => void }) {
  return (
    <Segmented
      label="Bereich"
      value={value}
      onChange={onChange}
      options={[
        { value: 'arbeit', label: 'Arbeit' },
        { value: 'privat', label: 'Privat' },
      ]}
    />
  )
}
