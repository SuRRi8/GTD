import { CalendarDays, RotateCcw, Zap } from 'lucide-react'
import { Link } from 'react-router'
import { ActionRow } from '../components/ActionRow'
import { Button } from '../components/Button'
import { ChoiceChips, MultiChips } from '../components/Chips'
import { Field } from '../components/forms'
import { Card, EmptyState, PageHeader, SectionTitle } from '../components/misc'
import { useData } from '../data/hooks'
import type { Energy, Minutes } from '../data/types'
import { activeActions, filterByArea, groupByContext } from '../domain/actions'
import { entriesOnDay } from '../domain/calendar'
import { AGENDA_FILTER, engageActions, type EngageFilter } from '../domain/engage'
import { sortContexts } from '../domain/sorting'
import { usePrefs } from '../state/prefs'
import { usePersistentState } from '../state/storage'
import { useToday } from '../state/useToday'

const EMPTY_FILTER: EngageFilter = { contextIds: [] }

const isEngageFilter = (v: unknown): v is EngageFilter =>
  typeof v === 'object' && v !== null && Array.isArray((v as EngageFilter).contextIds)

/** Jetzt-Ansicht: Kontext, Zeit und Energie wählen – die Entscheidung triffst du selbst. */
export function EngagePage() {
  const data = useData()
  const { areaFilter } = usePrefs()
  const today = useToday()
  const [filter, setFilter] = usePersistentState<EngageFilter>('gtd.engageFilter', EMPTY_FILTER, isEngageFilter)

  const available = filterByArea(activeActions(data.actions, data.projects), areaFilter)
  const matching = engageActions(available, filter)
  const groups = groupByContext(matching, data.contexts, data.people)
  const todayEntries = filterByArea(entriesOnDay(data.calendar, today), areaFilter).filter((e) => !e.doneAt)

  const contextOptions = [
    ...sortContexts(data.contexts).map((c) => ({ value: c.id, label: c.name })),
    { value: AGENDA_FILTER, label: 'Agenden' },
  ]
  const isFiltered = filter.contextIds.length > 0 || filter.availableMinutes !== undefined || filter.energy !== undefined

  return (
    <>
      <PageHeader title="Was kann ich jetzt tun?" subtitle="Wähle, wo du bist, wie viel Zeit und Energie du hast. Entscheiden tust du." />

      {todayEntries.length > 0 && (
        <Link to="/kalender" className="mb-4 flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3 text-accent">
          <CalendarDays size={20} className="shrink-0" />
          <span className="flex-1">
            Zuerst der Kalender: heute {todayEntries.length === 1 ? '1 Eintrag' : `${todayEntries.length} Einträge`}
          </span>
        </Link>
      )}

      <Card className="space-y-4 p-4">
        <Field label="Wo bin ich, was habe ich zur Hand?">
          <MultiChips
            label="Kontexte"
            options={contextOptions}
            values={filter.contextIds}
            onChange={(contextIds) => setFilter({ ...filter, contextIds })}
          />
        </Field>
        <Field label="Wie viel Zeit habe ich?">
          <ChoiceChips<Minutes>
            label="Verfügbare Zeit"
            allowNone
            value={filter.availableMinutes}
            onChange={(availableMinutes) => setFilter({ ...filter, availableMinutes })}
            options={[
              { value: 5, label: '5 Min.' },
              { value: 15, label: '15 Min.' },
              { value: 30, label: '30 Min.' },
              { value: 60, label: '60+ Min.' },
            ]}
          />
        </Field>
        <Field label="Wie viel Energie habe ich?">
          <ChoiceChips<Energy>
            label="Energie"
            allowNone
            value={filter.energy}
            onChange={(energy) => setFilter({ ...filter, energy })}
            options={[
              { value: 'niedrig', label: 'Niedrig' },
              { value: 'mittel', label: 'Mittel' },
              { value: 'hoch', label: 'Hoch' },
            ]}
          />
        </Field>
        <div className="flex items-center justify-between gap-3 text-sm text-ink-muted">
          <span>Schritte ohne Zeit- oder Energieangabe werden immer gezeigt.</span>
          {isFiltered && (
            <Button size="sm" variant="ghost" onClick={() => setFilter(EMPTY_FILTER)}>
              <RotateCcw size={14} /> Zurücksetzen
            </Button>
          )}
        </div>
      </Card>

      <p className="mt-6 px-1 font-medium">
        {matching.length === 1 ? '1 passender Schritt' : `${matching.length} passende Schritte`}
      </p>

      {groups.length === 0 ? (
        <div className="mt-3">
          <EmptyState icon={<Zap size={32} strokeWidth={1.5} />} title="Nichts Passendes">
            {available.length === 0 ? 'Es gibt noch keine offenen nächsten Schritte.' : 'Probier einen anderen Kontext oder mehr Zeit.'}
          </EmptyState>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.key}>
            <SectionTitle count={group.actions.length}>{group.title}</SectionTitle>
            <Card className="divide-y divide-line">
              {group.actions.map((action) => (
                <ActionRow key={action.id} action={action} />
              ))}
            </Card>
          </section>
        ))
      )}
    </>
  )
}
