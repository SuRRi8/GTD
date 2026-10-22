import { ArrowLeft, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ActionEditor } from '../components/ActionEditor'
import { ActionRow } from '../components/ActionRow'
import { Card, EmptyState, SectionTitle } from '../components/misc'
import { WaitingEditor } from '../components/WaitingEditor'
import { WaitingRow } from '../components/WaitingRow'
import { useData } from '../data/hooks'
import type { Person } from '../data/types'
import { activeActions, filterByArea } from '../domain/actions'
import { sortWaiting } from '../domain/waiting'
import { usePrefs } from '../state/prefs'
import { useToday } from '../state/useToday'

export function PersonPage() {
  const { id } = useParams()
  const person = useData().people.find((p) => p.id === id)
  return (
    <>
      <Link to="/agenden" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-ink-muted hover:text-ink">
        <ArrowLeft size={18} /> Agenden
      </Link>
      {person ? <PersonAgenda person={person} /> : <EmptyState title="Person nicht gefunden" />}
    </>
  )
}

function PersonAgenda({ person }: { person: Person }) {
  const { actions, projects, waiting } = useData()
  const { areaFilter } = usePrefs()
  const today = useToday()
  const [addingItem, setAddingItem] = useState(false)
  const [addingWaiting, setAddingWaiting] = useState(false)

  const items = filterByArea(activeActions(actions, projects), areaFilter)
    .filter((a) => a.agendaPersonId === person.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const fromPerson = sortWaiting(filterByArea(waiting, areaFilter), today).filter((w) => w.personId === person.id)

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{person.name}</h1>

      <SectionTitle count={items.length}>Zu besprechen</SectionTitle>
      <Card className="divide-y divide-line">
        {items.map((action) => (
          <ActionRow key={action.id} action={action} />
        ))}
        <button type="button" onClick={() => setAddingItem(true)} className="flex min-h-12 w-full items-center gap-2 px-4 text-accent hover:bg-surface-2">
          <Plus size={18} /> Punkt hinzufügen
        </button>
      </Card>

      <SectionTitle count={fromPerson.length}>Warten auf {person.name}</SectionTitle>
      <Card className="divide-y divide-line">
        {fromPerson.map((entry) => (
          <WaitingRow key={entry.id} entry={entry} showPerson={false} />
        ))}
        <button type="button" onClick={() => setAddingWaiting(true)} className="flex min-h-12 w-full items-center gap-2 px-4 text-accent hover:bg-surface-2">
          <Plus size={18} /> „Warten auf“ hinzufügen
        </button>
      </Card>

      {addingItem && <ActionEditor preset={{ agendaPersonId: person.id }} onClose={() => setAddingItem(false)} />}
      {addingWaiting && <WaitingEditor preset={{ personId: person.id }} onClose={() => setAddingWaiting(false)} />}
    </>
  )
}
