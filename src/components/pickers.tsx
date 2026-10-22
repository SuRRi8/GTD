import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useData, useRepo } from '../data/hooks'
import type { Energy, LocalDate, Minutes } from '../data/types'
import { addDays } from '../domain/dates'
import { sortContexts, sortPeople } from '../domain/sorting'
import { Button } from './Button'
import { ChoiceChips } from './Chips'
import { TextInput } from './forms'
import { ENERGY_LABEL, MINUTES_LABEL } from './labels'

const chip =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[15px] transition select-none'
const chipOn = 'border-accent bg-accent-soft text-accent font-medium'
const chipOff = 'border-line bg-surface text-ink hover:bg-surface-2'

/** Inline „Neue Person“: Name eintippen, Enter legt an */
function NewPersonInline({ onCreated, label = 'Neue Person' }: { onCreated: (id: string) => void; label?: string }) {
  const repo = useRepo()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const value = name.trim()
    if (!value) return
    const person = await repo.people.add({ name: value })
    setName('')
    setOpen(false)
    onCreated(person.id)
  }

  if (!open) {
    return (
      <button type="button" className={`${chip} border-dashed border-line text-ink-muted hover:text-ink`} onClick={() => setOpen(true)}>
        <Plus size={16} /> {label}
      </button>
    )
  }
  return (
    <form onSubmit={submit} className="flex w-full items-center gap-2">
      <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name der neuen Person" />
      <Button type="submit" variant="primary" disabled={!name.trim()}>
        Anlegen
      </Button>
    </form>
  )
}

export function PersonPicker({ value, onChange }: { value: string | undefined; onChange: (personId: string) => void }) {
  const people = sortPeople(useData().people)
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Person">
      {people.map((person) => (
        <button
          key={person.id}
          type="button"
          role="radio"
          aria-checked={person.id === value}
          className={`${chip} ${person.id === value ? chipOn : chipOff}`}
          onClick={() => onChange(person.id)}
        >
          {person.name}
        </button>
      ))}
      <NewPersonInline onCreated={onChange} />
    </div>
  )
}

export interface ContextSelection {
  contextId?: string
  agendaPersonId?: string
}

/** Kontext wählen: normale Kontexte oder „Agenda: Person“ */
export function ContextPicker({ value, onChange }: { value: ContextSelection; onChange: (value: ContextSelection) => void }) {
  const { contexts, people } = useData()
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kontext">
        {sortContexts(contexts).map((context) => {
          const active = value.contextId === context.id
          return (
            <button
              key={context.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`${chip} ${active ? chipOn : chipOff}`}
              onClick={() => onChange({ contextId: context.id })}
            >
              {context.name}
            </button>
          )
        })}
      </div>
      <div>
        <p className="mb-2 text-sm text-ink-muted">oder auf die Agenda für ein Gespräch mit …</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Agenda">
          {sortPeople(people).map((person) => {
            const active = value.agendaPersonId === person.id
            return (
              <button
                key={person.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`${chip} ${active ? chipOn : chipOff}`}
                onClick={() => onChange({ agendaPersonId: person.id })}
              >
                Agenda: {person.name}
              </button>
            )
          })}
          <NewPersonInline label="Person" onCreated={(id) => onChange({ agendaPersonId: id })} />
        </div>
      </div>
    </div>
  )
}

const MINUTE_OPTIONS = ([5, 15, 30, 60] as Minutes[]).map((value) => ({ value, label: MINUTES_LABEL[value] }))
const ENERGY_OPTIONS = (['niedrig', 'mittel', 'hoch'] as Energy[]).map((value) => ({
  value,
  label: ENERGY_LABEL[value].replace('Energie ', ''),
}))

export function MinutesPicker({ value, onChange }: { value?: Minutes; onChange: (value?: Minutes) => void }) {
  return <ChoiceChips label="Zeitbedarf" options={MINUTE_OPTIONS} value={value} onChange={onChange} allowNone />
}

export function EnergyPicker({ value, onChange }: { value?: Energy; onChange: (value?: Energy) => void }) {
  return <ChoiceChips label="Energie" options={ENERGY_OPTIONS} value={value} onChange={onChange} allowNone />
}

export interface QuickDate {
  label: string
  days: number
}

/** Datumsfeld mit Schnellauswahl („Morgen“, „In 1 Woche“ …) */
export function DatePicker({
  value,
  onChange,
  today,
  quick,
  min,
  label,
  clearable,
}: {
  value: LocalDate | undefined
  onChange: (value: LocalDate | undefined) => void
  today: LocalDate
  quick: QuickDate[]
  min?: LocalDate
  label: string
  clearable?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => {
          const date = addDays(today, q.days)
          const active = value === date
          return (
            <button key={q.label} type="button" className={`${chip} ${active ? chipOn : chipOff}`} onClick={() => onChange(date)}>
              {q.label}
            </button>
          )
        })}
        {clearable && value && (
          <button type="button" className={`${chip} ${chipOff} text-ink-muted`} onClick={() => onChange(undefined)}>
            Kein Datum
          </button>
        )}
      </div>
      <TextInput type="date" aria-label={label} value={value ?? ''} min={min} onChange={(e) => onChange(e.target.value || undefined)} />
    </div>
  )
}
