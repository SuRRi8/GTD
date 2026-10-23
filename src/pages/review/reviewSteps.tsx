import { ArrowLeft, ArrowRight, Check, CircleCheck, FolderKanban, Inbox, Plus, TriangleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ActionEditor } from '../../components/ActionEditor'
import { ActionRow } from '../../components/ActionRow'
import { Button } from '../../components/Button'
import { CalendarDayList } from '../../components/CalendarDayList'
import { Segmented } from '../../components/Chips'
import { TextInput } from '../../components/forms'
import { AreaBadge, Card, EmptyState, SectionTitle } from '../../components/misc'
import { WaitingRow } from '../../components/WaitingRow'
import { useData, useRepo } from '../../data/hooks'
import type { Area, Project } from '../../data/types'
import { activeActions, groupByContext } from '../../domain/actions'
import { daysInRange } from '../../domain/calendar'
import { addDays } from '../../domain/dates'
import { isStalled, openItemsOf, sortActiveProjects } from '../../domain/projects'
import { compareText } from '../../domain/sorting'
import { visibleInbox } from '../../domain/tickler'
import { TRIGGER_LISTS } from '../../domain/triggers'
import { sortWaiting } from '../../domain/waiting'
import { setProjectStatus } from '../../services/tasks'
import { useCapture, useFeedback } from '../../state/feedback'
import { GoogleSyncBar } from '../../integrations/google/GoogleSyncBar'
import { usePlanningData } from '../../state/usePlanningData'
import { useToday } from '../../state/useToday'
import { SomedayList } from '../SomedayPage'
import { WaitingList } from '../WaitingPage'

export function NotesStep() {
  const { openCapture } = useCapture()
  return (
    <div className="space-y-4">
      <ul className="list-disc space-y-1 pl-5 text-ink-muted">
        <li>Zettel aus Taschen, Tasche und Schreibtisch</li>
        <li>Belege, Briefe, Visitenkarten</li>
        <li>Notizen und Fotos im Handy, Sprachnachrichten</li>
        <li>Mitschriften aus Meetings</li>
      </ul>
      <Button variant="primary" onClick={openCapture}>
        <Plus size={18} /> Erfassen
      </Button>
    </div>
  )
}

export function InboxStep() {
  const { inbox } = useData()
  const today = useToday()
  const navigate = useNavigate()
  const count = visibleInbox(inbox, today).length
  if (count === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-ok-soft px-4 py-4 text-ok">
        <CircleCheck size={24} />
        <span className="font-medium">Dein Eingang ist leer.</span>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-4">
        <Inbox size={24} className="text-ink-muted" />
        <span className="font-medium">{count === 1 ? '1 Eintrag' : `${count} Einträge`} im Eingang</span>
      </div>
      <Button variant="primary" size="lg" onClick={() => navigate('/klaeren?zurueck=/rueckblick')}>
        Eingang klären
      </Button>
    </div>
  )
}

export function MindSweepStep() {
  const repo = useRepo()
  const [area, setArea] = useState<Area>('arbeit')
  const [text, setText] = useState('')
  const [captured, setCaptured] = useState(0)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!text.trim()) return
    await repo.inbox.add({ text: text.trim() })
    setText('')
    setCaptured((n) => n + 1)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="sticky top-16 z-10 -mx-1 flex gap-2 bg-canvas/95 px-1 py-2 backdrop-blur">
        <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder="Einfall erfassen – Enter" aria-label="Einfall erfassen" enterKeyHint="send" />
        <Button type="submit" variant="primary" disabled={!text.trim()}>
          <Plus size={18} />
        </Button>
      </form>
      {captured > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-ok">
          <Check size={16} /> {captured === 1 ? '1 Einfall' : `${captured} Einfälle`} im Eingang – kläre sie danach.
        </p>
      )}
      <Segmented
        label="Bereich"
        value={area}
        onChange={setArea}
        options={[
          { value: 'arbeit', label: 'Arbeit' },
          { value: 'privat', label: 'Privat' },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {TRIGGER_LISTS[area].map((group) => (
          <Card key={group.title} className="px-4 py-3">
            <p className="font-medium">{group.title}</p>
            <p className="mt-1 text-sm text-ink-muted">{group.prompts.join(' · ')}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ActionsStep() {
  const { actions, projects, contexts, people } = useData()
  const groups = groupByContext(activeActions(actions, projects), contexts, people)
  if (groups.length === 0) return <EmptyState title="Keine offenen nächsten Schritte" />
  return (
    <div>
      {groups.map((group) => (
        <section key={group.key}>
          <SectionTitle count={group.actions.length}>{group.title}</SectionTitle>
          <Card className="divide-y divide-line">
            {group.actions.map((action) => (
              <ActionRow key={action.id} action={action} />
            ))}
          </Card>
        </section>
      ))}
    </div>
  )
}

export function CalendarStep() {
  const { calendar } = usePlanningData()
  const today = useToday()
  const past = daysInRange(calendar, addDays(today, -14), addDays(today, -1)).reverse()
  const future = daysInRange(calendar, today, addDays(today, 28))
  return (
    <div>
      <GoogleSyncBar />
      <SectionTitle>Letzte 2 Wochen – noch etwas offen?</SectionTitle>
      {past.length ? <CalendarDayList days={past} today={today} /> : <p className="px-1 text-ink-muted">Keine Einträge.</p>}
      <SectionTitle>Nächste 4 Wochen – was ist vorzubereiten?</SectionTitle>
      {future.length ? <CalendarDayList days={future} today={today} /> : <p className="px-1 text-ink-muted">Keine Einträge.</p>}
    </div>
  )
}

export function WaitingStep() {
  const { waiting } = useData()
  const today = useToday()
  return <WaitingList entries={sortWaiting(waiting, today)} today={today} />
}

/** Jedes aktive Projekt einzeln: Hat es einen nächsten Schritt? */
export function ProjectsStep({ index, onIndex }: { index: number; onIndex: (index: number) => void }) {
  const data = usePlanningData()
  const today = useToday()
  const projects = sortActiveProjects(data.projects, data, today)
  if (projects.length === 0) return <EmptyState icon={<FolderKanban size={32} strokeWidth={1.5} />} title="Keine aktiven Projekte" />
  const current = Math.min(index, projects.length - 1)
  const stalledCount = projects.filter((p) => isStalled(p, data, today)).length
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" disabled={current === 0} onClick={() => onIndex(current - 1)} aria-label="Vorheriges Projekt">
          <ArrowLeft size={16} />
        </Button>
        <span className="flex-1 text-center text-sm text-ink-muted">
          Projekt {current + 1} von {projects.length}
          {stalledCount > 0 && <span className="text-danger"> · {stalledCount} im Stillstand</span>}
        </span>
        <Button size="sm" variant="ghost" disabled={current === projects.length - 1} onClick={() => onIndex(current + 1)} aria-label="Nächstes Projekt">
          <ArrowRight size={16} />
        </Button>
      </div>
      <ProjectReviewCard key={projects[current].id} project={projects[current]} />
      {current < projects.length - 1 && (
        <Button block onClick={() => onIndex(current + 1)}>
          Nächstes Projekt <ArrowRight size={18} />
        </Button>
      )}
    </div>
  )
}

function ProjectReviewCard({ project }: { project: Project }) {
  const data = usePlanningData()
  const repo = useRepo()
  const today = useToday()
  const { toast } = useFeedback()
  const [adding, setAdding] = useState(false)
  const open = openItemsOf(project.id, data, today)
  const stalled = isStalled(project, data, today)

  const setStatus = async (status: 'erledigt' | 'irgendwann') => {
    await setProjectStatus(repo, project.id, status)
    toast(status === 'erledigt' ? 'Projekt erledigt' : 'Auf Irgendwann/Vielleicht verschoben')
  }

  return (
    <Card className={`overflow-hidden ${stalled ? 'border-danger/50' : ''}`}>
      <div className="px-4 pt-4">
        <div className="flex items-start gap-2">
          <Link to={`/projekte/${project.id}`} className="flex-1 text-lg font-semibold break-words hover:text-accent">
            {project.title}
          </Link>
          <AreaBadge area={project.area} />
        </div>
        {project.outcome && <p className="mt-1 text-ink-muted">Erledigt, wenn {project.outcome}</p>}
        <p className={`mt-3 flex items-center gap-2 font-medium ${stalled ? 'text-danger' : 'text-ok'}`}>
          {stalled ? <TriangleAlert size={18} /> : <CircleCheck size={18} />}
          {stalled ? 'Kein nächster Schritt – was ist als Nächstes zu tun?' : 'Hat einen nächsten Schritt'}
        </p>
      </div>
      <div className="mt-3 divide-y divide-line border-t border-line">
        {open.actions.map((action) => (
          <ActionRow key={action.id} action={action} showContext showProject={false} />
        ))}
        {open.waiting.map((entry) => (
          <WaitingRow key={entry.id} entry={entry} showProject={false} />
        ))}
        <button type="button" onClick={() => setAdding(true)} className="flex min-h-12 w-full items-center gap-2 px-4 text-accent hover:bg-surface-2">
          <Plus size={18} /> Nächsten Schritt hinzufügen
        </button>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
        <Button size="sm" variant="ghost" onClick={() => setStatus('erledigt')}>
          <CircleCheck size={16} /> Projekt erledigt
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setStatus('irgendwann')}>
          Auf Irgendwann/Vielleicht
        </Button>
      </div>
      {adding && <ActionEditor preset={{ projectId: project.id, area: project.area }} onClose={() => setAdding(false)} />}
    </Card>
  )
}

export function SomedayStep() {
  const { projects } = useData()
  const items = projects.filter((p) => p.status === 'irgendwann').sort((a, b) => compareText(a.title, b.title))
  return items.length ? <SomedayList items={items} /> : <EmptyState title="Irgendwann/Vielleicht ist leer" />
}
