import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useData, useRepo } from '../data/hooks'
import type { Area, NextAction } from '../data/types'
import { sortByTitle } from '../domain/sorting'
import { useFeedback } from '../state/feedback'
import { useDefaultArea } from '../state/useDefaultArea'
import { AreaPicker } from './AreaPicker'
import { Button } from './Button'
import { Field, Select } from './forms'
import { isActionDraftValid, type ActionDraft } from './actionDraft'
import { NextActionFields } from './NextActionFields'
import { Sheet } from './Sheet'

export interface ActionEditorProps {
  /** Vorhandener Schritt (Bearbeiten) – ohne: neuer Schritt */
  action?: NextAction
  /** Vorbelegung für neue Schritte, z. B. Projekt oder Agenda-Person */
  preset?: Partial<Pick<NextAction, 'projectId' | 'agendaPersonId' | 'contextId' | 'area'>>
  onClose: () => void
}

export function ActionEditor({ action, preset = {}, onClose }: ActionEditorProps) {
  const repo = useRepo()
  const { projects } = useData()
  const { toast } = useFeedback()
  const defaultArea = useDefaultArea()
  const presetProject = projects.find((p) => p.id === (action?.projectId ?? preset.projectId))

  const [draft, setDraft] = useState<ActionDraft>({
    title: action?.title ?? '',
    contextId: action?.contextId ?? preset.contextId,
    agendaPersonId: action?.agendaPersonId ?? preset.agendaPersonId,
    minutes: action?.minutes,
    energy: action?.energy,
  })
  const [projectId, setProjectId] = useState<string | undefined>(action?.projectId ?? preset.projectId)
  const [area, setArea] = useState<Area>(action?.area ?? preset.area ?? presetProject?.area ?? defaultArea)

  const selectableProjects = sortByTitle(projects.filter((p) => p.status === 'aktiv' || p.id === projectId))

  const save = async () => {
    const data = {
      title: draft.title.trim(),
      contextId: draft.contextId,
      agendaPersonId: draft.agendaPersonId,
      minutes: draft.minutes,
      energy: draft.energy,
      projectId,
      area,
    }
    if (action) {
      await repo.actions.update(action.id, data)
    } else {
      await repo.actions.add(data)
      toast('Nächster Schritt angelegt')
    }
    onClose()
  }

  const remove = async () => {
    if (!action) return
    await repo.actions.remove(action.id)
    toast('Schritt gelöscht', { actionLabel: 'Rückgängig', onAction: () => repo.actions.restore(action.id) })
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={action ? 'Schritt bearbeiten' : 'Neuer nächster Schritt'}
      footer={
        <>
          {action && (
            <Button variant="danger-soft" onClick={remove} className="mr-auto">
              <Trash2 size={18} /> Löschen
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={save} disabled={!isActionDraftValid(draft)}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <NextActionFields draft={draft} onChange={setDraft} autoFocus={!action} />
        <Field label="Projekt (optional)" htmlFor="action-project">
          <Select
            id="action-project"
            value={projectId ?? ''}
            onChange={(e) => {
              const id = e.target.value || undefined
              setProjectId(id)
              const project = projects.find((p) => p.id === id)
              if (project) setArea(project.area)
            }}
          >
            <option value="">Kein Projekt</option>
            {selectableProjects.map((p) => (
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
