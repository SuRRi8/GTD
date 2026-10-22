import { CalendarDays, ChevronRight, FolderKanban, Hourglass, Inbox, Play, RotateCcw, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../components/Button'
import { AreaBadge, Card } from '../components/misc'
import { useData } from '../data/hooks'
import { filterByArea } from '../domain/actions'
import { entriesOnDay } from '../domain/calendar'
import { daysBetween, formatDay, formatLongDate, formatSince, localDateOf } from '../domain/dates'
import { sortActiveProjects, stalledProjects } from '../domain/projects'
import { visibleInbox } from '../domain/tickler'
import { dueWaiting } from '../domain/waiting'
import { daysSinceLastReview, isReviewDue, lastReview } from '../domain/weeklyReview'
import { usePrefs } from '../state/prefs'
import { useToday } from '../state/useToday'

export function HomePage() {
  const data = useData()
  const { areaFilter } = usePrefs()
  const today = useToday()
  const navigate = useNavigate()

  const inboxCount = visibleInbox(data.inbox, today).length
  const todayEntries = filterByArea(entriesOnDay(data.calendar, today), areaFilter)
  const projects = filterByArea(data.projects, areaFilter)
  const stalled = sortActiveProjects(stalledProjects(projects, data, today), data, today)
  const overdue = dueWaiting(filterByArea(data.waiting, areaFilter), today)
  const last = lastReview(data.reviews)
  const reviewDays = daysSinceLastReview(data.reviews, today)
  const reviewDue = isReviewDue(data.reviews, today)

  return (
    <>
      <header className="mb-5">
        <p className="text-ink-muted">{formatLongDate(today)}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Überblick</h1>
      </header>

      {reviewDue && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-warn/40 bg-warn-soft px-4 py-3 text-warn sm:flex-row sm:items-center">
          <span className="flex flex-1 items-start gap-2">
            <RotateCcw size={20} className="mt-0.5 shrink-0" />
            {reviewDays === undefined
              ? 'Du hast noch keinen Wochenrückblick gemacht.'
              : `Dein letzter Wochenrückblick ist ${reviewDays} Tage her.`}
          </span>
          <Button size="sm" variant="primary" onClick={() => navigate('/rueckblick')}>
            Jetzt starten
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Tile icon={<Inbox size={20} />} title="Eingang" to="/eingang" count={inboxCount}>
          {inboxCount === 0 ? (
            <p className="text-ink-muted">Leer – alles geklärt.</p>
          ) : (
            <Button variant="primary" onClick={() => navigate('/klaeren')}>
              <Play size={16} /> Klären starten
            </Button>
          )}
        </Tile>

        <Tile icon={<CalendarDays size={20} />} title="Heute im Kalender" to="/kalender" count={todayEntries.length}>
          {todayEntries.length === 0 ? (
            <p className="text-ink-muted">Nichts eingetragen.</p>
          ) : (
            <ul className="space-y-1.5">
              {todayEntries.map((entry) => (
                <li key={entry.id} className={`flex gap-2 ${entry.doneAt ? 'text-ink-muted line-through' : ''}`}>
                  <span className="w-12 shrink-0 font-semibold tabular-nums">
                    {entry.kind === 'termin' ? entry.time : entry.kind === 'tagesaufgabe' ? 'Tag' : 'Info'}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{entry.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        <Tile icon={<FolderKanban size={20} />} title="Projekte im Stillstand" to="/projekte" count={stalled.length} tone={stalled.length ? 'danger' : undefined}>
          {stalled.length === 0 ? (
            <p className="text-ink-muted">Jedes aktive Projekt hat einen nächsten Schritt.</p>
          ) : (
            <ul className="space-y-1">
              {stalled.map((project) => (
                <li key={project.id}>
                  <Link to={`/projekte/${project.id}`} className="flex items-center gap-2 text-danger hover:underline">
                    <TriangleAlert size={14} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{project.title}</span>
                    {areaFilter === 'alle' && <AreaBadge area={project.area} />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        <Tile icon={<Hourglass size={20} />} title="Überfällige „Warten auf“" to="/warten" count={overdue.length} tone={overdue.length ? 'danger' : undefined}>
          {overdue.length === 0 ? (
            <p className="text-ink-muted">Nichts überfällig.</p>
          ) : (
            <ul className="space-y-2">
              {overdue.map((entry) => (
                <li key={entry.id}>
                  <p className="break-words">{entry.title}</p>
                  <p className="text-sm text-ink-muted">
                    {data.people.find((p) => p.id === entry.personId)?.name} · {formatSince(entry.since, today)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        <Tile icon={<RotateCcw size={20} />} title="Letzter Wochenrückblick" to="/rueckblick" tone={reviewDue ? 'warn' : undefined}>
          <p className={reviewDue ? 'text-warn' : 'text-ink-muted'}>
            {last
              ? `${formatDay(localDateOf(last.completedAt), today)} (vor ${daysBetween(localDateOf(last.completedAt), today)} ${
                  daysBetween(localDateOf(last.completedAt), today) === 1 ? 'Tag' : 'Tagen'
                })`
              : 'Noch nie'}
          </p>
        </Tile>
      </div>
    </>
  )
}

function Tile({
  icon,
  title,
  to,
  count,
  tone,
  children,
}: {
  icon: ReactNode
  title: string
  to: string
  count?: number
  tone?: 'danger' | 'warn'
  children: ReactNode
}) {
  const accent = tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn' : 'text-accent'
  return (
    <Card className={`p-4 ${tone === 'danger' ? 'border-danger/40' : ''}`}>
      <Link to={to} className="mb-3 flex items-center gap-2 hover:opacity-80">
        <span className={accent}>{icon}</span>
        <span className="flex-1 font-medium">{title}</span>
        {count !== undefined && <span className={`text-2xl font-semibold tabular-nums ${count ? accent : 'text-ink-muted'}`}>{count}</span>}
        <ChevronRight size={18} className="text-ink-muted" />
      </Link>
      {children}
    </Card>
  )
}
