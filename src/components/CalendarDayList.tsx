import { CalendarDays, Info } from 'lucide-react'
import { useState } from 'react'
import { useRepo } from '../data/hooks'
import type { LocalDate } from '../data/types'
import type { CalendarDay, CalendarItem } from '../domain/calendar'
import { formatDay } from '../domain/dates'
import { GoogleEventSheet } from '../integrations/google/GoogleEventSheet'
import { useFeedback } from '../state/feedback'
import { usePrefs } from '../state/prefs'
import { CheckButton } from './ActionRow'
import { CalendarEditor } from './CalendarEditor'
import { AreaBadge, Card } from './misc'

/** Kalender als Liste nach Tagen */
export function CalendarDayList({ days, today, emptyToday }: { days: CalendarDay[]; today: LocalDate; emptyToday?: boolean }) {
  const list = emptyToday && !days.some((d) => d.date === today) ? [{ date: today, entries: [] }, ...days] : days
  return (
    <div className="space-y-4">
      {list.map((day) => (
        <section key={day.date}>
          <h2 className={`mb-2 px-1 text-sm font-semibold ${day.date === today ? 'text-accent' : 'text-ink-muted'}`}>
            {formatDay(day.date, today)}
          </h2>
          <Card className="divide-y divide-line">
            {day.entries.length === 0 ? (
              <p className="px-4 py-3 text-ink-muted">Nichts eingetragen</p>
            ) : (
              day.entries.map((entry) => <CalendarRow key={entry.id} entry={entry} today={today} />)
            )}
          </Card>
        </section>
      ))}
    </div>
  )
}

export function CalendarRow({ entry, today }: { entry: CalendarItem; today: LocalDate }) {
  if (entry.external) return <GoogleCalendarRow entry={entry} today={today} />
  return <OwnCalendarRow entry={entry} today={today} />
}

/** Termin aus Google: nur Anzeige, Tippen öffnet die Details */
function GoogleCalendarRow({ entry, today }: { entry: CalendarItem; today: LocalDate }) {
  const { areaFilter } = usePrefs()
  const [open, setOpen] = useState(false)
  const external = entry.external!
  return (
    <div className="flex items-center gap-1 py-1 pr-3 pl-1">
      {entry.kind === 'termin' ? (
        <span className="w-14 shrink-0 pl-3 text-sm font-semibold tabular-nums">{entry.time}</span>
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center text-ink-muted">
          {entry.kind === 'tagesaufgabe' ? <CalendarDays size={18} /> : <Info size={18} />}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`min-w-0 flex-1 py-2 text-left break-words hover:text-accent ${entry.date < today ? 'text-ink-muted' : ''}`}
      >
        <span className="block">{entry.title}</span>
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="inline-block size-2 shrink-0 rounded-full" style={{ backgroundColor: external.color ?? 'currentColor' }} />
          {external.calendarName}
          {external.endTime && ` · bis ${external.endTime}`}
          {entry.kind === 'tagesaufgabe' && ' · Tagesaufgabe'}
        </span>
      </button>
      {areaFilter === 'alle' && !entry.anyArea && <AreaBadge area={entry.area} />}
      {open && <GoogleEventSheet item={entry} onClose={() => setOpen(false)} />}
    </div>
  )
}

function OwnCalendarRow({ entry, today }: { entry: CalendarItem; today: LocalDate }) {
  const repo = useRepo()
  const { toast } = useFeedback()
  const { areaFilter } = usePrefs()
  const [editing, setEditing] = useState(false)
  const past = entry.date < today
  const done = Boolean(entry.doneAt)

  const toggleDone = async () => {
    await repo.calendar.update(entry.id, { doneAt: new Date().toISOString() })
    toast('Erledigt', { actionLabel: 'Rückgängig', onAction: () => repo.calendar.update(entry.id, { doneAt: undefined }) })
  }

  return (
    <div className="flex items-center gap-1 py-1 pr-3 pl-1">
      {entry.kind === 'termin' && (
        <span className="w-14 shrink-0 pl-3 text-sm font-semibold tabular-nums">{entry.time}</span>
      )}
      {entry.kind === 'tagesaufgabe' &&
        (done ? (
          <span className="flex size-11 shrink-0 items-center justify-center">
            <span className="size-6 rounded-full border-2 border-ok bg-ok" />
          </span>
        ) : (
          <CheckButton label={`„${entry.title}“ erledigt`} onCheck={toggleDone} />
        ))}
      {entry.kind === 'tagesinfo' && (
        <span className="flex size-11 shrink-0 items-center justify-center text-ink-muted">
          <Info size={18} />
        </span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`min-w-0 flex-1 py-2.5 text-left break-words hover:text-accent ${done || past ? 'text-ink-muted' : ''} ${done ? 'line-through' : ''}`}
      >
        {entry.title}
        {entry.kind === 'tagesinfo' && <span className="ml-2 text-sm text-ink-muted">Info</span>}
      </button>
      {areaFilter === 'alle' && <AreaBadge area={entry.area} />}
      {editing && <CalendarEditor entry={entry} onClose={() => setEditing(false)} />}
    </div>
  )
}
