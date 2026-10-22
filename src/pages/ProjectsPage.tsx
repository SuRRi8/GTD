import { ChevronRight, FolderKanban, Lightbulb, Plus, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../components/Button'
import { AreaBadge, Card, EmptyState, PageHeader, SectionTitle } from '../components/misc'
import { NewProjectSheet } from '../components/ProjectSheets'
import { useData } from '../data/hooks'
import type { Project } from '../data/types'
import { filterByArea } from '../domain/actions'
import { formatDate, localDateOf } from '../domain/dates'
import { isStalled, openItemsOf, sortActiveProjects } from '../domain/projects'
import { compareText } from '../domain/sorting'
import { usePrefs } from '../state/prefs'
import { useToday } from '../state/useToday'

export function ProjectsPage() {
  const data = useData()
  const { areaFilter } = usePrefs()
  const today = useToday()
  const [creating, setCreating] = useState(false)
  const [showClosed, setShowClosed] = useState(false)

  const projects = filterByArea(data.projects, areaFilter)
  const active = sortActiveProjects(projects, data, today)
  const stalled = active.filter((p) => isStalled(p, data, today))
  const moving = active.filter((p) => !isStalled(p, data, today))
  const somedayCount = projects.filter((p) => p.status === 'irgendwann').length
  const closed = projects
    .filter((p) => p.status === 'erledigt' || p.status === 'verworfen')
    .sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt) || compareText(a.title, b.title))

  return (
    <>
      <PageHeader
        title="Projekte"
        subtitle={`${active.length} aktiv${stalled.length ? ` · ${stalled.length} im Stillstand` : ''}`}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} /> Neu
          </Button>
        }
      />

      {active.length === 0 && (
        <EmptyState icon={<FolderKanban size={32} strokeWidth={1.5} />} title="Keine aktiven Projekte">
          Alles, was mehr als einen Schritt braucht, ist ein Projekt.
        </EmptyState>
      )}

      {stalled.length > 0 && (
        <section>
          <SectionTitle tone="danger" count={stalled.length}>
            <TriangleAlert size={16} /> Stillstand
          </SectionTitle>
          <Card className="divide-y divide-line border-danger/40">
            {stalled.map((project) => (
              <ProjectRow key={project.id} project={project} stalled />
            ))}
          </Card>
        </section>
      )}

      {moving.length > 0 && (
        <section>
          <SectionTitle count={moving.length}>Aktiv</SectionTitle>
          <Card className="divide-y divide-line">
            {moving.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </Card>
        </section>
      )}

      <Link to="/irgendwann" className="mt-6 flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-surface px-4 hover:bg-surface-2">
        <Lightbulb size={18} className="text-ink-muted" />
        <span className="flex-1">Irgendwann/Vielleicht</span>
        <span className="text-ink-muted">{somedayCount}</span>
        <ChevronRight size={18} className="text-ink-muted" />
      </Link>

      {closed.length > 0 && (
        <section className="mt-2">
          <button type="button" onClick={() => setShowClosed(!showClosed)} className="mt-4 px-1 text-sm text-ink-muted hover:text-ink">
            {showClosed ? 'Abgeschlossene ausblenden' : `Abgeschlossene Projekte anzeigen (${closed.length})`}
          </button>
          {showClosed && (
            <Card className="mt-2 divide-y divide-line">
              {closed.map((project) => (
                <Link key={project.id} to={`/projekte/${project.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                  <span className="flex-1 text-ink-muted line-through decoration-ink-muted/40">{project.title}</span>
                  <span className="text-sm text-ink-muted">
                    {project.status === 'erledigt' ? 'erledigt' : 'verworfen'}
                    {project.completedAt && ` · ${formatDate(localDateOf(project.completedAt), today)}`}
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </section>
      )}

      {creating && <NewProjectSheet onClose={() => setCreating(false)} />}
    </>
  )
}

function ProjectRow({ project, stalled }: { project: Project; stalled?: boolean }) {
  const data = useData()
  const today = useToday()
  const { areaFilter } = usePrefs()
  const open = openItemsOf(project.id, data, today)
  const parts = [
    open.actions.length && `${open.actions.length} ${open.actions.length === 1 ? 'Schritt' : 'Schritte'}`,
    open.waiting.length && `${open.waiting.length} Warten auf`,
    open.calendar.length && `${open.calendar.length} im Kalender`,
  ].filter(Boolean)

  return (
    <Link to={`/projekte/${project.id}`} className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-2 ${stalled ? 'border-l-4 border-danger' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className="font-medium break-words">{project.title}</p>
        {project.outcome && <p className="truncate text-sm text-ink-muted">Erledigt, wenn {project.outcome}</p>}
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          {stalled ? (
            <span className="font-medium text-danger">Kein nächster Schritt</span>
          ) : (
            <span className="text-ink-muted">{parts.join(' · ')}</span>
          )}
          {areaFilter === 'alle' && <AreaBadge area={project.area} />}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-ink-muted" />
    </Link>
  )
}
