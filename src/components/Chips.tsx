import type { ReactNode } from 'react'

export interface ChipOption<T> {
  value: T
  label: ReactNode
}

const chipBase =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[15px] transition select-none'
const chipOn = 'border-accent bg-accent-soft text-accent font-medium'
const chipOff = 'border-line bg-surface text-ink hover:bg-surface-2'

/** Einfachauswahl als Chips; `allowNone` erlaubt Abwählen */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  allowNone,
  label,
}: {
  options: ChipOption<T>[]
  value: T | undefined
  onChange: (value: T | undefined) => void
  allowNone?: boolean
  label?: string
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            className={`${chipBase} ${active ? chipOn : chipOff}`}
            onClick={() => onChange(active && allowNone ? undefined : option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** Mehrfachauswahl als Chips */
export function MultiChips<T extends string>({
  options,
  values,
  onChange,
  label,
}: {
  options: ChipOption<T>[]
  values: T[]
  onChange: (values: T[]) => void
  label?: string
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => {
        const active = values.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            className={`${chipBase} ${active ? chipOn : chipOff}`}
            onClick={() => onChange(active ? values.filter((v) => v !== option.value) : [...values, option.value])}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** Kompakter Umschalter, z. B. für den Bereichsfilter */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
}: {
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  size?: 'sm' | 'md'
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-surface-2 p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 font-medium transition ${size === 'sm' ? 'min-h-8 text-sm' : 'min-h-10 text-[15px]'} ${
              active ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
