import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/Button'
import { CalendarDayList, CalendarRow } from '../components/CalendarDayList'
import { CalendarEditor } from '../components/CalendarEditor'
import { Card, PageHeader, SectionTitle } from '../components/misc'
import { GoogleSyncBar } from '../integrations/google/GoogleSyncBar'
import { filterByArea } from '../domain/actions'
import { daysInRange, overdueDayTasks, upcomingDays } from '../domain/calendar'
import { addDays } from '../domain/dates'
import { usePlanningData } from '../state/usePlanningData'
import { usePrefs } from '../state/prefs'
import { useToday } from '../state/useToday'

const DAYS = 14

/** Nur die „harte Landschaft“: heute und die nächsten 14 Tage */
export function CalendarPage() {
  const { calendar } = usePlanningData()
  const { areaFilter } = usePrefs()
  const today = useToday()
  const [creating, setCreating] = useState(false)
  const [showLater, setShowLater] = useState(false)

  const entries = filterByArea(calendar, areaFilter)
  const days = upcomingDays(entries, today, DAYS)
  const overdue = overdueDayTasks(entries, today)
  const later = daysInRange(entries, addDays(today, DAYS + 1), '9999-12-31')
  const laterCount = later.reduce((sum, day) => sum + day.entries.length, 0)

  return (
    <>
      <PageHeader
        title="Kalender"
        subtitle="Heute und die nächsten 14 Tage – nur, was wirklich an einen Tag gebunden ist."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} /> Neu
          </Button>
        }
      />

      <GoogleSyncBar showSetupHint />

      {overdue.length > 0 && (
        <section className="mb-4">
          <SectionTitle tone="danger" count={overdue.length}>
            Liegengebliebene Tagesaufgaben
          </SectionTitle>
          <Card className="divide-y divide-line border-danger/40">
            {overdue.map((entry) => (
              <CalendarRow key={entry.id} entry={entry} today={today} />
            ))}
          </Card>
        </section>
      )}

      <CalendarDayList days={days} today={today} emptyToday />

      {laterCount > 0 && (
        <div className="mt-6">
          <button type="button" onClick={() => setShowLater(!showLater)} className="px-1 text-sm text-ink-muted hover:text-ink">
            {showLater ? 'Spätere Einträge ausblenden' : `Spätere Einträge anzeigen (${laterCount})`}
          </button>
          {showLater && (
            <div className="mt-3">
              <CalendarDayList days={later} today={today} />
            </div>
          )}
        </div>
      )}

      {creating && <CalendarEditor onClose={() => setCreating(false)} />}
    </>
  )
}
