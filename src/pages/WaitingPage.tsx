import { Hourglass, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/Button'
import { Card, EmptyState, PageHeader, SectionTitle } from '../components/misc'
import { WaitingEditor } from '../components/WaitingEditor'
import { WaitingRow } from '../components/WaitingRow'
import { useData } from '../data/hooks'
import { filterByArea } from '../domain/actions'
import { isFollowUpDue, sortWaiting } from '../domain/waiting'
import { usePrefs } from '../state/prefs'
import { useToday } from '../state/useToday'

export function WaitingPage() {
  const { waiting } = useData()
  const { areaFilter } = usePrefs()
  const today = useToday()
  const [creating, setCreating] = useState(false)
  const open = sortWaiting(filterByArea(waiting, areaFilter), today)

  return (
    <>
      <PageHeader
        title="Warten auf"
        subtitle={open.length === 1 ? '1 offener Eintrag' : `${open.length} offene Einträge`}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} /> Neu
          </Button>
        }
      />
      <WaitingList entries={open} today={today} />
      {creating && <WaitingEditor onClose={() => setCreating(false)} />}
    </>
  )
}

/** Überfällige oben, hervorgehoben – auch im Wochenrückblick verwendet */
export function WaitingList({ entries, today }: { entries: ReturnType<typeof sortWaiting>; today: string }) {
  const due = entries.filter((e) => isFollowUpDue(e, today))
  const rest = entries.filter((e) => !isFollowUpDue(e, today))
  if (entries.length === 0) {
    return (
      <EmptyState icon={<Hourglass size={32} strokeWidth={1.5} />} title="Du wartest auf nichts">
        Delegiertes landet hier – mit Datum, damit du nachfassen kannst.
      </EmptyState>
    )
  }
  return (
    <>
      {due.length > 0 && (
        <section>
          <SectionTitle tone="danger" count={due.length}>
            Nachfassen fällig
          </SectionTitle>
          <Card className="divide-y divide-line overflow-hidden border-danger/40">
            {due.map((entry) => (
              <WaitingRow key={entry.id} entry={entry} />
            ))}
          </Card>
        </section>
      )}
      {rest.length > 0 && (
        <section>
          <SectionTitle count={rest.length}>Offen</SectionTitle>
          <Card className="divide-y divide-line">
            {rest.map((entry) => (
              <WaitingRow key={entry.id} entry={entry} />
            ))}
          </Card>
        </section>
      )}
    </>
  )
}
