import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useData, useRepo } from '../data/hooks'
import type { Area, LocalDate, WaitingFor } from '../data/types'
import { sortByTitle } from '../domain/sorting'
import { useFeedback } from '../state/feedback'
import { useDefaultArea } from '../state/useDefaultArea'
import { useToday } from '../state/useToday'
import { AreaPicker } from './AreaPicker'
import { Button } from './Button'
import { Field, Select, TextInput } from './forms'
import { DatePicker, PersonPicker } from './pickers'
import { Sheet } from './Sheet'

export interface WaitingEditorProps {
  entry?: WaitingFor
  preset?: Partial<Pick<WaitingFor, 'projectId' | 'personId' | 'area'>>
  onClose: () => void
}

export function WaitingEditor({ entry, preset = {}, onClose }: WaitingEditorProps) {
  const repo = useRepo()
  const { projects } = useData()
  const { toast } = useFeedback()
  const today = useToday()
  const defaultArea = useDefaultArea()
  const presetProject = projects.find((p) => p.id === (entry?.projectId ?? preset.projectId))

  const [title, setTitle] = useState(entry?.title ?? '')
  const [personId, setPersonId] = useState<string | undefined>(entry?.personId ?? preset.personId)
  const [since, setSince] = useState<LocalDate>(entry?.since ?? today)
  const [followUpOn, setFollowUpOn] = useState<LocalDate | undefined>(entry?.followUpOn)
  const [projectId, setProjectId] = useState<string | undefined>(entry?.projectId ?? preset.projectId)
  const [area, setArea] = useState<Area>(entry?.area ?? preset.area ?? presetProject?.area ?? defaultArea)
  const valid = Boolean(title.trim() && personId && since)

  const save = async () => {
    if (!personId) return
    const data = { title: title.trim(), personId, since, followUpOn, projectId, area }
    if (entry) await repo.waiting.update(entry.id, data)
    else {
      await repo.waiting.add(data)
      toast('Auf „Warten auf“ gesetzt')
    }
    onClose()
  }

  const remove = async () => {
    if (!entry) return
    await repo.waiting.remove(entry.id)
    toast('Gelöscht', { actionLabel: 'Rückgängig', onAction: () => repo.waiting.restore(entry.id) })
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={entry ? '„Warten auf“ bearbeiten' : 'Neu: Warten auf'}
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
        <Field label="Worauf wartest du?" htmlFor="waiting-title">
          <TextInput id="waiting-title" autoFocus={!entry} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Angebot der Druckerei" />
        </Field>
        <Field label="Von wem?">
          <PersonPicker value={personId} onChange={setPersonId} />
        </Field>
        <Field label="Seit" htmlFor="waiting-since">
          <TextInput id="waiting-since" type="date" value={since} max={today} onChange={(e) => e.target.value && setSince(e.target.value)} />
        </Field>
        <Field label="Nachfassen am (optional)">
          <DatePicker
            label="Nachfassen am"
            value={followUpOn}
            onChange={setFollowUpOn}
            today={today}
            clearable
            quick={[
              { label: 'In 3 Tagen', days: 3 },
              { label: 'In 1 Woche', days: 7 },
              { label: 'In 2 Wochen', days: 14 },
            ]}
          />
        </Field>
        <Field label="Projekt (optional)" htmlFor="waiting-project">
          <Select id="waiting-project" value={projectId ?? ''} onChange={(e) => setProjectId(e.target.value || undefined)}>
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
