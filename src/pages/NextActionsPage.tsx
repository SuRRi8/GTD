import { ListChecks, Plus } from 'lucide-react'
import { useState } from 'react'
import { ActionEditor } from '../components/ActionEditor'
import { ActionRow } from '../components/ActionRow'
import { Button } from '../components/Button'
import { Card, EmptyState, PageHeader, SectionTitle } from '../components/misc'
import { useData } from '../data/hooks'
import { activeActions, filterByArea, groupByContext } from '../domain/actions'
import { usePrefs } from '../state/prefs'

export function NextActionsPage() {
  const { actions, projects, contexts, people } = useData()
  const { areaFilter } = usePrefs()
  const [creating, setCreating] = useState(false)
  const visible = filterByArea(activeActions(actions, projects), areaFilter)
  const groups = groupByContext(visible, contexts, people)

  return (
    <>
      <PageHeader
        title="Nächste Schritte"
        subtitle={visible.length === 1 ? '1 offener Schritt' : `${visible.length} offene Schritte`}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} /> Neu
          </Button>
        }
      />
      {groups.length === 0 ? (
        <EmptyState icon={<ListChecks size={32} strokeWidth={1.5} />} title="Keine offenen Schritte">
          Kläre deinen Eingang – dabei entstehen die nächsten Schritte.
        </EmptyState>
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
      {creating && <ActionEditor onClose={() => setCreating(false)} />}
    </>
  )
}
