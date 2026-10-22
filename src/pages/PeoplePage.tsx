import { ChevronRight, Plus, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '../components/Button'
import { TextInput } from '../components/forms'
import { Card, EmptyState, PageHeader } from '../components/misc'
import { useData, useRepo } from '../data/hooks'
import { activeActions, filterByArea } from '../domain/actions'
import { sortPeople } from '../domain/sorting'
import { usePrefs } from '../state/prefs'

export function PeoplePage() {
  const { people, actions, projects, waiting } = useData()
  const { areaFilter } = usePrefs()
  const repo = useRepo()
  const [name, setName] = useState('')
  const agendaItems = filterByArea(activeActions(actions, projects), areaFilter)
  const openWaiting = filterByArea(waiting, areaFilter).filter((w) => !w.doneAt)

  const add = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    await repo.people.add({ name: name.trim() })
    setName('')
  }

  return (
    <>
      <PageHeader title="Agenden" subtitle="Was du mit wem besprechen willst – und worauf du von wem wartest." />
      <form onSubmit={add} className="mb-4 flex gap-2">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Neue Person" aria-label="Name der neuen Person" />
        <Button type="submit" disabled={!name.trim()}>
          <Plus size={18} /> Anlegen
        </Button>
      </form>
      {people.length === 0 ? (
        <EmptyState icon={<Users size={32} strokeWidth={1.5} />} title="Noch keine Personen" />
      ) : (
        <Card className="divide-y divide-line">
          {sortPeople(people).map((person) => {
            const items = agendaItems.filter((a) => a.agendaPersonId === person.id).length
            const wait = openWaiting.filter((w) => w.personId === person.id).length
            const summary = [items && `${items} zu besprechen`, wait && `${wait} Warten auf`].filter(Boolean).join(' · ')
            return (
              <Link key={person.id} to={`/agenden/${person.id}`} className="flex min-h-13 items-center gap-3 px-4 py-2 hover:bg-surface-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent">
                  {person.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{person.name}</span>
                  <span className="block text-sm text-ink-muted">{summary || 'Nichts offen'}</span>
                </span>
                <ChevronRight size={18} className="text-ink-muted" />
              </Link>
            )
          })}
        </Card>
      )}
    </>
  )
}
