import { BellRing, FolderKanban, User } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useData } from '../data/hooks'
import type { WaitingFor } from '../data/types'
import { daysBetween, formatDay, formatSince } from '../domain/dates'
import { isFollowUpDue } from '../domain/waiting'
import { useCompletion } from '../state/feedback'
import { usePrefs } from '../state/prefs'
import { useToday } from '../state/useToday'
import { CheckButton } from './ActionRow'
import { AreaBadge, Pill } from './misc'
import { WaitingEditor } from './WaitingEditor'

export function WaitingRow({ entry, showPerson = true, showProject = true }: { entry: WaitingFor; showPerson?: boolean; showProject?: boolean }) {
  const { people, projects } = useData()
  const { areaFilter } = usePrefs()
  const { completeWaiting } = useCompletion()
  const today = useToday()
  const [editing, setEditing] = useState(false)
  const person = people.find((p) => p.id === entry.personId)
  const project = entry.projectId ? projects.find((p) => p.id === entry.projectId) : undefined
  const due = isFollowUpDue(entry, today)
  const overdueDays = entry.followUpOn ? daysBetween(entry.followUpOn, today) : 0

  return (
    <div className={`flex items-start gap-1 py-1 pr-3 pl-1 ${due ? 'bg-danger-soft/50' : ''}`}>
      <CheckButton label={`„${entry.title}“ ist eingetroffen`} onCheck={() => completeWaiting(entry)} />
      <div className="min-w-0 flex-1 py-2">
        <button type="button" onClick={() => setEditing(true)} className="block w-full text-left break-words hover:text-accent">
          {entry.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
          {showPerson && person && (
            <Link to={`/agenden/${person.id}`} className="inline-flex items-center gap-1 hover:text-accent">
              <User size={14} /> {person.name}
            </Link>
          )}
          <span>{formatSince(entry.since, today)}</span>
          {entry.followUpOn && (
            <Pill tone={due ? 'danger' : 'neutral'}>
              <BellRing size={12} />
              {due
                ? overdueDays === 0
                  ? 'heute nachfassen'
                  : `Nachfassen seit ${overdueDays === 1 ? 'gestern' : `${overdueDays} Tagen`} überfällig`
                : `Nachfassen ${formatDay(entry.followUpOn, today)}`}
            </Pill>
          )}
          {showProject && project && (
            <Link to={`/projekte/${project.id}`} className="inline-flex items-center gap-1 hover:text-accent">
              <FolderKanban size={14} /> {project.title}
            </Link>
          )}
          {areaFilter === 'alle' && <AreaBadge area={entry.area} />}
        </div>
      </div>
      {editing && <WaitingEditor entry={entry} onClose={() => setEditing(false)} />}
    </div>
  )
}
