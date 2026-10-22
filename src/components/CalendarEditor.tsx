import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useData, useRepo } from '../data/hooks'
import type { Area, CalendarEntry, CalendarKind, LocalDate } from '../data/types'
import { sortByTitle } from '../domain/sorting'
import { useFeedback } from '../state/feedback'
import { useDefaultArea } from '../state/useDefaultArea'
import { useToday } from '../state/useToday'
import { AreaPicker } from './AreaPicker'
import { Button } from './Button'
import { Segmented } from './Chips'
import { Field, Select, TextInput } from './forms'
import { DatePicker } from './pickers'
import { Sheet } from './Sheet'

const KIND_HINT: Record<CalendarKind, string> = {
  termin: 'Fester Zeitpunkt an einem Tag.',
  tagesaufgabe: 'Muss an diesem Tag erledigt werden – egal wann.',
  tagesinfo: 'Gut zu wissen an diesem Tag, z. B. Geburtstag.',
}

export function CalendarEditor({ entry, onClose }: { entry?: CalendarEntry; onClose: () => void }) {
  const repo = useRepo()
  const { projects } = useData()
  const { toast } = useFeedback()
  const today = useToday()
  const [kind, setKind] = useState<CalendarKind>(entry?.kind ?? 'termin')
  const [title, setTitle] = useState(entry?.title ?? '')
  const [date, setDate] = useState<LocalDate | undefined>(entry?.date ?? today)
  const [time, setTime] = useState(entry?.time ?? '')
  const [projectId, setProjectId] = useState<string | undefined>(entry?.projectId)
  const defaultArea = useDefaultArea()
  const [area, setArea] = useState<Area>(entry?.area ?? defaultArea)
  const valid = Boolean(title.trim() && date && (kind !== 'termin' || time))

  const save = async () => {
    if (!date) return
    const data = { kind, title: title.trim(), date, time: kind === 'termin' ? time : undefined, projectId, area }
    if (entry) await repo.calendar.update(entry.id, data)
    else {
      await repo.calendar.add(data)
      toast('Im Kalender eingetragen')
    }
    onClose()
  }

  const remove = async () => {
    if (!entry) return
    await repo.calendar.remove(entry.id)
    toast('Gelöscht', { actionLabel: 'Rückgängig', onAction: () => repo.calendar.restore(entry.id) })
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={entry ? 'Kalendereintrag bearbeiten' : 'Neuer Kalendereintrag'}
      footer={
        <>
          {entry && (
            <Button variant="danger-soft" onClick={remove} className="mr-auto">
              <Trash2 size={18} /> Löschen
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={save} disabled={!valid}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Segmented
            label="Art"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'termin', label: 'Termin' },
              { value: 'tagesaufgabe', label: 'Tagesaufgabe' },
              { value: 'tagesinfo', label: 'Tagesinfo' },
            ]}
          />
          <p className="mt-2 text-sm text-ink-muted">{KIND_HINT[kind]}</p>
        </div>
        <Field label="Was?" htmlFor="calendar-title">
          <TextInput id="calendar-title" autoFocus={!entry} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Datum">
          <DatePicker
            label="Datum"
            value={date}
            onChange={setDate}
            today={today}
            quick={[
              { label: 'Heute', days: 0 },
              { label: 'Morgen', days: 1 },
              { label: 'In 1 Woche', days: 7 },
            ]}
          />
        </Field>
        {kind === 'termin' && (
          <Field label="Uhrzeit" htmlFor="calendar-time">
            <TextInput id="calendar-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        )}
        <Field label="Projekt (optional)" htmlFor="calendar-project">
          <Select id="calendar-project" value={projectId ?? ''} onChange={(e) => setProjectId(e.target.value || undefined)}>
            <option value="">Kein Projekt</option>
            {sortByTitle(projects.filter((p) => p.status === 'aktiv' || p.id === projectId)).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Bereich">
          <AreaPicker value={area} onChange={setArea} />
        </Field>
      </div>
    </Sheet>
  )
}
