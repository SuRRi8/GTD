import { Lightbulb, Plus, Rocket, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AreaPicker } from '../components/AreaPicker'
import { Button, IconButton } from '../components/Button'
import { Field, TextInput } from '../components/forms'
import { AreaBadge, Card, EmptyState, PageHeader } from '../components/misc'
import { ActivateProjectSheet } from '../components/ProjectSheets'
import { Sheet } from '../components/Sheet'
import { emptyProjectNotes } from '../data/defaults'
import { useData, useRepo } from '../data/hooks'
import type { Area, Project } from '../data/types'
import { filterByArea } from '../domain/actions'
import { formatDay, localDateOf } from '../domain/dates'
import { compareText } from '../domain/sorting'
import { useFeedback } from '../state/feedback'
import { usePrefs } from '../state/prefs'
import { useDefaultArea } from '../state/useDefaultArea'
import { useToday } from '../state/useToday'

export function SomedayPage() {
  const { projects } = useData()
  const { areaFilter } = usePrefs()
  const [creating, setCreating] = useState(false)
  const items = filterByArea(projects, areaFilter)
    .filter((p) => p.status === 'irgendwann')
    .sort((a, b) => compareText(a.title, b.title))

  return (
    <>
      <PageHeader
        title="Irgendwann/Vielleicht"
        subtitle="Ideen und Wünsche ohne Verpflichtung. Beim Wochenrückblick durchsehen."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} /> Neu
          </Button>
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={<Lightbulb size={32} strokeWidth={1.5} />} title="Noch keine Ideen gesammelt" />
      ) : (
        <SomedayList items={items} />
      )}
      {creating && <NewSomedaySheet onClose={() => setCreating(false)} />}
    </>
  )
}

/** Liste mit „Aktivieren“ – auch im Wochenrückblick verwendet */
export function SomedayList({ items }: { items: Project[] }) {
  const repo = useRepo()
  const today = useToday()
  const { areaFilter } = usePrefs()
  const { toast } = useFeedback()
  const [activating, setActivating] = useState<Project | null>(null)

  const remove = async (project: Project) => {
    await repo.projects.remove(project.id)
    toast('Gelöscht', { actionLabel: 'Rückgängig', onAction: () => repo.projects.restore(project.id) })
  }

  return (
    <>
      <Card className="divide-y divide-line">
        {items.map((project) => (
          <div key={project.id} className="flex items-center gap-2 py-2 pr-2 pl-4">
            <Link to={`/projekte/${project.id}`} className="min-w-0 flex-1 py-1 hover:text-accent">
              <p className="break-words">{project.title}</p>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-ink-muted">
                seit {formatDay(localDateOf(project.createdAt), today)}
                {areaFilter === 'alle' && <AreaBadge area={project.area} />}
              </p>
            </Link>
            <Button size="sm" variant="secondary" onClick={() => setActivating(project)}>
              <Rocket size={16} /> Aktivieren
            </Button>
            <IconButton aria-label={`„${project.title}“ löschen`} onClick={() => remove(project)}>
              <Trash2 size={18} />
            </IconButton>
          </div>
        ))}
      </Card>
      {activating && <ActivateProjectSheet project={activating} onClose={() => setActivating(null)} />}
    </>
  )
}

function NewSomedaySheet({ onClose }: { onClose: () => void }) {
  const repo = useRepo()
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<Area>(useDefaultArea())

  const save = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!title.trim()) return
    await repo.projects.add({ title: title.trim(), outcome: '', area, status: 'irgendwann', notes: emptyProjectNotes() })
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Neu auf Irgendwann/Vielleicht"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={() => save()} disabled={!title.trim()}>
            Speichern
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <Field label="Idee" htmlFor="someday-title">
          <TextInput id="someday-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Tauchschein machen" />
        </Field>
        <Field label="Bereich">
          <AreaPicker value={area} onChange={setArea} />
        </Field>
      </form>
    </Sheet>
  )
}
