import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useRepo } from '../data/hooks'
import type { Area, Project } from '../data/types'
import { activateProject, createProject } from '../services/tasks'
import { useFeedback } from '../state/feedback'
import { useDefaultArea } from '../state/useDefaultArea'
import { isActionDraftValid, type ActionDraft } from './actionDraft'
import { AreaPicker } from './AreaPicker'
import { Button } from './Button'
import { Field, TextInput } from './forms'
import { NextActionFields } from './NextActionFields'
import { Sheet } from './Sheet'

/** Neues aktives Projekt: Name, Ergebnis-Satz (Pflicht), Bereich und erster Schritt */
export function NewProjectSheet({ onClose }: { onClose: () => void }) {
  const repo = useRepo()
  const navigate = useNavigate()
  const { toast } = useFeedback()
  const [title, setTitle] = useState('')
  const [outcome, setOutcome] = useState('')
  const [area, setArea] = useState<Area>(useDefaultArea())
  const [draft, setDraft] = useState<ActionDraft>({ title: '' })
  const hasAction = draft.title.trim().length > 0
  const valid = title.trim() && outcome.trim() && (!hasAction || isActionDraftValid(draft))

  const save = async () => {
    const project = await createProject(
      repo,
      { title: title.trim(), outcome: outcome.trim(), area },
      hasAction ? { ...draft, title: draft.title.trim() } : undefined,
    )
    toast(hasAction ? 'Projekt angelegt' : 'Projekt angelegt – es fehlt noch ein nächster Schritt')
    onClose()
    navigate(`/projekte/${project.id}`)
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Neues Projekt"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={save} disabled={!valid}>
            Anlegen
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Projekt" htmlFor="new-project-title">
          <TextInput id="new-project-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Sommerurlaub planen" />
        </Field>
        <Field label="Erledigt ist es, wenn …" htmlFor="new-project-outcome">
          <TextInput id="new-project-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="… Unterkunft und Anreise gebucht sind" />
        </Field>
        <Field label="Bereich">
          <AreaPicker value={area} onChange={setArea} />
        </Field>
        <div className="border-t border-line pt-4">
          <p className="mb-3 text-sm text-ink-muted">Ohne nächsten Schritt steht das Projekt sofort im Stillstand.</p>
          <NextActionFields draft={draft} onChange={setDraft} />
        </div>
      </div>
    </Sheet>
  )
}

/** Irgendwann/Vielleicht aktivieren: Ergebnis-Satz und nächster Schritt sind Pflicht */
export function ActivateProjectSheet({ project, onClose }: { project: Project; onClose: () => void }) {
  const repo = useRepo()
  const navigate = useNavigate()
  const { toast } = useFeedback()
  const [outcome, setOutcome] = useState(project.outcome)
  const [draft, setDraft] = useState<ActionDraft>({ title: '' })
  const valid = outcome.trim() && isActionDraftValid(draft)

  const save = async () => {
    await activateProject(repo, project.id, outcome, draft)
    toast(`„${project.title}“ ist jetzt ein aktives Projekt`)
    onClose()
    navigate(`/projekte/${project.id}`)
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Projekt aktivieren"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={save} disabled={!valid}>
            Aktivieren
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-lg font-medium">{project.title}</p>
        <Field label="Erledigt ist es, wenn …" htmlFor="activate-outcome">
          <TextInput id="activate-outcome" autoFocus value={outcome} onChange={(e) => setOutcome(e.target.value)} />
        </Field>
        <NextActionFields draft={draft} onChange={setDraft} />
      </div>
    </Sheet>
  )
}

/** Name, Ergebnis-Satz und Bereich eines Projekts bearbeiten */
export function EditProjectSheet({ project, onClose }: { project: Project; onClose: () => void }) {
  const repo = useRepo()
  const [title, setTitle] = useState(project.title)
  const [outcome, setOutcome] = useState(project.outcome)
  const [area, setArea] = useState<Area>(project.area)
  const needsOutcome = project.status === 'aktiv'
  const valid = title.trim() && (!needsOutcome || outcome.trim())

  const save = async () => {
    await repo.projects.update(project.id, { title: title.trim(), outcome: outcome.trim(), area })
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Projekt bearbeiten"
      footer={
        <>
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
        <Field label="Projekt" htmlFor="edit-project-title">
          <TextInput id="edit-project-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Erledigt ist es, wenn …" htmlFor="edit-project-outcome">
          <TextInput id="edit-project-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
        </Field>
        <Field label="Bereich">
          <AreaPicker value={area} onChange={setArea} />
        </Field>
      </div>
    </Sheet>
  )
}
