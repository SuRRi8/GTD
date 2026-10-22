import { BookOpen, ExternalLink, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AreaPicker } from '../components/AreaPicker'
import { Button } from '../components/Button'
import { Field, TextArea, TextInput } from '../components/forms'
import { AreaBadge, Card, EmptyState, PageHeader } from '../components/misc'
import { Sheet } from '../components/Sheet'
import { useData, useRepo } from '../data/hooks'
import type { Area, ReferenceNote } from '../data/types'
import { filterByArea } from '../domain/actions'
import { searchReferences } from '../domain/reference'
import { useFeedback } from '../state/feedback'
import { usePrefs } from '../state/prefs'
import { useDefaultArea } from '../state/useDefaultArea'

export function ReferencePage() {
  const { references } = useData()
  const { areaFilter } = usePrefs()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<ReferenceNote | 'new' | null>(null)
  const all = filterByArea(references, areaFilter)
  const results = searchReferences(all, query)

  return (
    <>
      <PageHeader
        title="Referenz"
        subtitle="Informationen zum Nachschlagen – ohne Handlungsbedarf."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus size={18} /> Neu
          </Button>
        }
      />
      <div className="relative mb-4">
        <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted" />
        <TextInput type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Durchsuchen" aria-label="Referenz durchsuchen" className="pl-10" />
      </div>
      {results.length === 0 ? (
        <EmptyState icon={<BookOpen size={32} strokeWidth={1.5} />} title={all.length === 0 ? 'Noch keine Referenz-Notizen' : 'Nichts gefunden'} />
      ) : (
        <Card className="divide-y divide-line">
          {results.map((note) => (
            <div key={note.id} className="flex items-start gap-2 px-4 py-3">
              <button type="button" onClick={() => setEditing(note)} className="min-w-0 flex-1 text-left hover:text-accent">
                <p className="font-medium break-words">{note.title}</p>
                {note.body && <p className="mt-0.5 line-clamp-2 text-sm whitespace-pre-line text-ink-muted">{note.body}</p>}
              </button>
              <div className="flex shrink-0 items-center gap-2">
                {areaFilter === 'alle' && <AreaBadge area={note.area} />}
                {note.url && (
                  <a href={note.url} target="_blank" rel="noreferrer" aria-label="Link öffnen" className="flex size-9 items-center justify-center rounded-lg text-accent hover:bg-surface-2">
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
      {editing && <ReferenceEditor note={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function ReferenceEditor({ note, onClose }: { note?: ReferenceNote; onClose: () => void }) {
  const repo = useRepo()
  const { toast } = useFeedback()
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [url, setUrl] = useState(note?.url ?? '')
  const defaultArea = useDefaultArea()
  const [area, setArea] = useState<Area>(note?.area ?? defaultArea)

  const save = async () => {
    const data = { title: title.trim(), body, url: url.trim() || undefined, area }
    if (note) await repo.references.update(note.id, data)
    else await repo.references.add(data)
    onClose()
  }

  const remove = async () => {
    if (!note) return
    await repo.references.remove(note.id)
    toast('Gelöscht', { actionLabel: 'Rückgängig', onAction: () => repo.references.restore(note.id) })
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={note ? 'Referenz bearbeiten' : 'Neue Referenz'}
      footer={
        <>
          {note && (
            <Button variant="danger-soft" onClick={remove} className="mr-auto">
              <Trash2 size={18} /> Löschen
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={save} disabled={!title.trim()}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Titel" htmlFor="ref-title">
          <TextInput id="ref-title" autoFocus={!note} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Text" htmlFor="ref-body">
          <TextArea id="ref-body" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <Field label="Link (optional)" htmlFor="ref-url">
          <TextInput id="ref-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Bereich">
          <AreaPicker value={area} onChange={setArea} />
        </Field>
      </div>
    </Sheet>
  )
}
