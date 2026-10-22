import { CalendarClock, Inbox, Play, Undo2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '../components/Button'
import { Card, EmptyState, PageHeader, Pill, SectionTitle } from '../components/misc'
import { useData, useRepo } from '../data/hooks'
import { formatDay, localDateOf } from '../domain/dates'
import { pendingTickler, visibleInbox } from '../domain/tickler'
import { useToday } from '../state/useToday'

export function InboxPage() {
  const { inbox } = useData()
  const repo = useRepo()
  const today = useToday()
  const navigate = useNavigate()
  const items = visibleInbox(inbox, today)
  const tickler = pendingTickler(inbox, today)

  return (
    <>
      <PageHeader
        title="Eingang"
        subtitle={
          items.length === 0
            ? 'Alles geklärt.'
            : items.length === 1
              ? '1 ungeklärter Eintrag'
              : `${items.length} ungeklärte Einträge`
        }
      />

      {items.length > 0 && (
        <Button variant="primary" size="lg" block className="mb-4" onClick={() => navigate('/klaeren')}>
          <Play size={18} /> Klären starten
        </Button>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<Inbox size={32} strokeWidth={1.5} />} title="Dein Eingang ist leer">
          Neue Gedanken landen hier, sobald du sie mit „+“ erfasst.
        </EmptyState>
      ) : (
        <Card className="divide-y divide-line">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <p className="min-w-0 flex-1 break-words">{item.text}</p>
              <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5 text-xs text-ink-muted">
                <span>{formatDay(localDateOf(item.createdAt), today)}</span>
                {item.tickleDate && <Pill tone="accent">Wiedervorlage</Pill>}
              </div>
            </div>
          ))}
        </Card>
      )}

      {tickler.length > 0 && (
        <>
          <SectionTitle count={tickler.length}>Wiedervorlage</SectionTitle>
          <Card className="divide-y divide-line">
            {tickler.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 pr-2 pl-4">
                <CalendarClock size={18} className="shrink-0 text-ink-muted" />
                <div className="min-w-0 flex-1">
                  <p className="break-words">{item.text}</p>
                  <p className="text-sm text-ink-muted">ab {formatDay(item.tickleDate!, today)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => repo.inbox.update(item.id, { tickleDate: undefined })}
                  title="Sofort zurück in den Eingang"
                >
                  <Undo2 size={16} /> Jetzt
                </Button>
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  )
}
