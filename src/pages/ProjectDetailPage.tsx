import { ArrowLeft, CalendarDays, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ActionEditor } from '../components/ActionEditor'
import { ActionRow } from '../components/ActionRow'
import { Button } from '../components/Button'
import { Segmented } from '../components/Chips'
import { TextArea } from '../components/forms'
import { CALENDAR_KIND_LABEL } from '../components/labels'
import { AreaBadge, Card, EmptyState, SectionTitle } from '../components/misc'
import { ActivateProjectSheet, EditProjectSheet } from '../components/ProjectSheets'
import { WaitingEditor } from '../components/WaitingEditor'
import { WaitingRow } from '../components/WaitingRow'
import { useData, useRepo } from '../data/hooks'
import type { Project, ProjectNotes, ProjectStatus } from '../data/types'
import { formatDay, localDateOf } from '../domain/dates'
import { countOpenItems, isStalled, openItemsOf } from '../domain/projects'
import { deleteProject, setProjectStatus } from '../services/tasks'
import { useFeedback } from '../state/feedback'
import { usePlanningData } from '../state/usePlanningData'
import { useToday } from '../state/useToday'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'irgendwann', label: 'Irgendwann' },
  { value: 'erledigt', label: 'Erledigt' },
  { value: 'verworfen', label: 'Verworfen' },
]

const NOTE_SECTIONS: { key: keyof ProjectNotes; title: string; hint: string }[] = [
  { key: 'zweck', title: 'Zweck', hint: 'Warum mache ich das? Was ist der Sinn dahinter?' },
  { key: 'vision', title: 'Vision / Ergebnis', hint: 'Wie sieht es aus, wenn es richtig gut gelaufen ist?' },
  { key: 'brainstorming', title: 'Brainstorming', hint: 'Alle Ideen, ungeordnet – nichts bewerten.' },
  { key: 'ordnen', title: 'Ordnen', hint: 'Bestandteile, Reihenfolge, Meilensteine.' },
]

export function ProjectDetailPage() {
  const { id } = useParams()
  const project = useData().projects.find((p) => p.id === id)
  if (!project) {
    return (
      <>
        <BackLink />
        <EmptyState title="Projekt nicht gefunden" />
      </>
    )
  }
  return <ProjectDetail project={project} />
}

function BackLink({ to = '/projekte', label = 'Projekte' }: { to?: string; label?: string }) {
  return (
    <Link to={to} className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-ink-muted hover:text-ink">
      <ArrowLeft size={18} /> {label}
    </Link>
  )
}

function ProjectDetail({ project }: { project: Project }) {
  const data = usePlanningData()
  const repo = useRepo()
  const today = useToday()
  const navigate = useNavigate()
  const { confirm, toast } = useFeedback()
  const [editing, setEditing] = useState(false)
  const [addingAction, setAddingAction] = useState(false)
  const [addingWaiting, setAddingWaiting] = useState(false)
  const [activating, setActivating] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const open = openItemsOf(project.id, data, today)
  const stalled = isStalled(project, data, today)
  const doneActions = data.actions
    .filter((a) => a.projectId === project.id && a.doneAt)
    .sort((a, b) => b.doneAt!.localeCompare(a.doneAt!))
  const isSomeday = project.status === 'irgendwann'
  const backTo = isSomeday ? { to: '/irgendwann', label: 'Irgendwann/Vielleicht' } : {}

  const changeStatus = async (status: ProjectStatus) => {
    if (status === project.status) return
    if (status === 'aktiv' && project.status === 'irgendwann') {
      setActivating(true)
      return
    }
    const remaining = countOpenItems(open) - open.calendar.length
    if ((status === 'erledigt' || status === 'verworfen') && remaining > 0) {
      const ok = await confirm({
        title: status === 'erledigt' ? 'Projekt abschließen?' : 'Projekt verwerfen?',
        message: `${remaining === 1 ? '1 offener Eintrag wird' : `${remaining} offene Einträge werden`} mit abgeschlossen.`,
        confirmLabel: status === 'erledigt' ? 'Abschließen' : 'Verwerfen',
      })
      if (!ok) return
    }
    if (status === 'aktiv' && !project.outcome.trim()) {
      setEditing(true)
    }
    await setProjectStatus(repo, project.id, status)
    toast(`Status: ${STATUS_OPTIONS.find((o) => o.value === status)?.label}`)
  }

  const remove = async () => {
    const ok = await confirm({
      title: 'Projekt löschen?',
      message: 'Das Projekt und seine Schritte und „Warten auf“-Einträge werden gelöscht.',
      confirmLabel: 'Löschen',
      danger: true,
    })
    if (!ok) return
    await deleteProject(repo, project.id)
    toast('Projekt gelöscht')
    navigate(isSomeday ? '/irgendwann' : '/projekte')
  }

  return (
    <>
      <BackLink {...backTo} />

      <header className="mb-5">
        <div className="flex items-start gap-2">
          <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight break-words">{project.title}</h1>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Projekt bearbeiten">
            <Pencil size={16} /> Bearbeiten
          </Button>
        </div>
        <p className="mt-1 text-ink-muted">
          {project.outcome ? (
            <>
              Erledigt ist es, wenn <span className="text-ink">{project.outcome}</span>
            </>
          ) : (
            <em>Noch kein Ergebnis-Satz</em>
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <AreaBadge area={project.area} />
          <span className="text-sm text-ink-muted">angelegt {formatDay(localDateOf(project.createdAt), today)}</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Segmented label="Status" size="sm" options={STATUS_OPTIONS} value={project.status} onChange={changeStatus} />
        </div>
      </header>

      {stalled && (
        <div role="alert" className="mb-4 flex flex-col gap-3 rounded-2xl border border-danger/40 bg-danger-soft px-4 py-3 text-danger sm:flex-row sm:items-center">
          <span className="flex flex-1 items-start gap-2 font-medium">
            <TriangleAlert size={20} className="mt-0.5 shrink-0" />
            Stillstand: Dieses Projekt hat keinen nächsten Schritt.
          </span>
          <Button size="sm" variant="danger" onClick={() => setAddingAction(true)}>
            Nächsten Schritt festlegen
          </Button>
        </div>
      )}

      {isSomeday && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3 text-accent">
          <span className="flex-1">Auf Irgendwann/Vielleicht. Bereit loszulegen?</span>
          <Button size="sm" variant="primary" onClick={() => setActivating(true)}>
            Aktivieren
          </Button>
        </div>
      )}

      <SectionTitle count={open.actions.length}>Nächste Schritte</SectionTitle>
      <Card className="divide-y divide-line">
        {open.actions.map((action) => (
          <ActionRow key={action.id} action={action} showContext showProject={false} />
        ))}
        <button type="button" onClick={() => setAddingAction(true)} className="flex min-h-12 w-full items-center gap-2 px-4 text-accent hover:bg-surface-2">
          <Plus size={18} /> Schritt hinzufügen
        </button>
      </Card>

      <SectionTitle count={open.waiting.length}>Warten auf</SectionTitle>
      <Card className="divide-y divide-line">
        {open.waiting.map((entry) => (
          <WaitingRow key={entry.id} entry={entry} showProject={false} />
        ))}
        <button type="button" onClick={() => setAddingWaiting(true)} className="flex min-h-12 w-full items-center gap-2 px-4 text-accent hover:bg-surface-2">
          <Plus size={18} /> „Warten auf“ hinzufügen
        </button>
      </Card>

      {open.calendar.length > 0 && (
        <>
          <SectionTitle count={open.calendar.length}>Im Kalender</SectionTitle>
          <Card className="divide-y divide-line">
            {open.calendar.map((entry) => (
              <Link key={entry.id} to="/kalender" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                <CalendarDays size={18} className="text-ink-muted" />
                <span className="flex-1">{entry.title}</span>
                <span className="text-sm text-ink-muted">
                  {CALENDAR_KIND_LABEL[entry.kind]} · {formatDay(entry.date, today)}
                  {entry.time && `, ${entry.time}`}
                </span>
              </Link>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>Notizen</SectionTitle>
      <Card className="divide-y divide-line">
        {NOTE_SECTIONS.map((section) => (
          <NoteField key={section.key} project={project} section={section} />
        ))}
      </Card>

      {doneActions.length > 0 && (
        <>
          <button type="button" onClick={() => setShowDone(!showDone)} className="mt-6 px-1 text-sm text-ink-muted hover:text-ink">
            {showDone ? 'Erledigte Schritte ausblenden' : `Erledigte Schritte anzeigen (${doneActions.length})`}
          </button>
          {showDone && (
            <Card className="mt-2 divide-y divide-line">
              {doneActions.map((action) => (
                <div key={action.id} className="flex items-center gap-3 px-4 py-2.5 text-ink-muted">
                  <span className="flex-1 line-through decoration-ink-muted/40">{action.title}</span>
                  <span className="text-sm">{formatDay(localDateOf(action.doneAt!), today)}</span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      <div className="mt-10 border-t border-line pt-4">
        <Button variant="danger-soft" onClick={remove}>
          <Trash2 size={18} /> Projekt löschen
        </Button>
      </div>

      {editing && <EditProjectSheet project={project} onClose={() => setEditing(false)} />}
      {activating && <ActivateProjectSheet project={project} onClose={() => setActivating(false)} />}
      {addingAction && <ActionEditor preset={{ projectId: project.id, area: project.area }} onClose={() => setAddingAction(false)} />}
      {addingWaiting && <WaitingEditor preset={{ projectId: project.id, area: project.area }} onClose={() => setAddingWaiting(false)} />}
    </>
  )
}

/** Freitext-Abschnitt; speichert beim Tippen (verzögert), beim Verlassen des Felds und der Seite */
function NoteField({ project, section }: { project: Project; section: (typeof NOTE_SECTIONS)[number] }) {
  const repo = useRepo()
  const [value, setValue] = useState(project.notes[section.key])
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pending = useRef<string | null>(null)

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    const text = pending.current
    if (text === null) return
    pending.current = null
    // frisch lesen, damit parallel bearbeitete Abschnitte sich nicht überschreiben
    void repo.transaction(async () => {
      const current = await repo.projects.get(project.id)
      if (current && current.notes[section.key] !== text) {
        await repo.projects.update(project.id, { notes: { ...current.notes, [section.key]: text } })
      }
    })
  }, [repo, project.id, section.key])

  useEffect(() => flush, [flush])

  return (
    <div className="px-4 py-3">
      <label htmlFor={`note-${section.key}`} className="block font-medium">
        {section.title}
      </label>
      <p className="mb-2 text-sm text-ink-muted">{section.hint}</p>
      <TextArea
        id={`note-${section.key}`}
        value={value}
        rows={3}
        onChange={(e) => {
          setValue(e.target.value)
          pending.current = e.target.value
          clearTimeout(timer.current)
          timer.current = setTimeout(flush, 800)
        }}
        onBlur={flush}
      />
    </div>
  )
}
