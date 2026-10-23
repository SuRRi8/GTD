import { ExternalLink, FolderKanban } from 'lucide-react'
import { Link } from 'react-router'
import { CALENDAR_KIND_LABEL } from '../../components/labels'
import { AreaBadge } from '../../components/misc'
import { Sheet } from '../../components/Sheet'
import { useData } from '../../data/hooks'
import type { CalendarItem } from '../../domain/calendar'
import { formatLongDate } from '../../domain/dates'

/** Google-Termine sind in der App nur zu sehen – bearbeitet wird in Google Kalender */
export function GoogleEventSheet({ item, onClose }: { item: CalendarItem; onClose: () => void }) {
  const { projects } = useData()
  const project = item.projectId ? projects.find((p) => p.id === item.projectId) : undefined
  const external = item.external!

  return (
    <Sheet
      open
      onClose={onClose}
      title="Termin aus Google Kalender"
      footer={
        external.htmlLink ? (
          <a
            href={external.htmlLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 font-medium text-on-accent hover:brightness-110"
          >
            <ExternalLink size={18} /> In Google Kalender öffnen
          </a>
        ) : undefined
      }
    >
      <div className="space-y-3">
        <p className="text-lg font-medium break-words">{item.title}</p>
        <p className="text-ink-muted">
          {formatLongDate(item.date)}
          {item.time ? `, ${item.time}${external.endTime ? `–${external.endTime}` : ''} Uhr` : ` · ${CALENDAR_KIND_LABEL[item.kind]}`}
        </p>
        <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: external.color ?? 'currentColor' }} />
          {external.calendarName}
          {item.anyArea ? <span>· Arbeit und Privat</span> : <AreaBadge area={item.area} />}
        </p>
        {project && (
          <Link to={`/projekte/${project.id}`} onClick={onClose} className="inline-flex items-center gap-1.5 text-accent hover:underline">
            <FolderKanban size={16} /> {project.title}
          </Link>
        )}
        <p className="text-sm text-ink-muted">Ändern oder löschen kannst du den Termin in Google Kalender.</p>
      </div>
    </Sheet>
  )
}
