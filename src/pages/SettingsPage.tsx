import { ArrowDown, ArrowUp, Check, Download, Pencil, Plus, Sparkles, Trash2, TriangleAlert, Upload, X } from 'lucide-react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Button, IconButton } from '../components/Button'
import { Segmented } from '../components/Chips'
import { TextInput } from '../components/forms'
import { Card, PageHeader, SectionTitle } from '../components/misc'
import { BackupError, parseBackup } from '../data/backup'
import { buildDemoData } from '../data/demoData'
import { useData, useRepo } from '../data/hooks'
import { COLLECTION_NAMES } from '../data/types'
import { todayLocal } from '../domain/dates'
import { sortContexts, sortPeople } from '../domain/sorting'
import { addContext, moveContext } from '../services/settings'
import { useFeedback } from '../state/feedback'
import { usePrefs, type Theme } from '../state/prefs'

export function SettingsPage() {
  const { theme, setTheme } = usePrefs()
  return (
    <>
      <PageHeader title="Einstellungen" />

      <SectionTitle>Darstellung</SectionTitle>
      <Card className="p-4">
        <Segmented<Theme>
          label="Farbschema"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: 'Wie System' },
            { value: 'hell', label: 'Hell' },
            { value: 'dunkel', label: 'Dunkel' },
          ]}
        />
      </Card>

      <ContextSettings />
      <PeopleSettings />
      <DataSettings />

      <p className="mt-8 px-1 text-sm text-ink-muted">
        Alle Daten liegen nur in diesem Browser auf diesem Gerät. Exportiere regelmäßig eine Sicherung.
      </p>
    </>
  )
}

/** Eine Zeile mit Umbenennen-Funktion */
function EditableRow({
  name,
  onRename,
  children,
  meta,
}: {
  name: string
  onRename: (name: string) => Promise<void>
  children?: ReactNode
  meta?: ReactNode
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim()) return
    await onRename(value.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <form onSubmit={save} className="flex items-center gap-1 py-1.5 pr-2 pl-3">
        <TextInput autoFocus value={value} onChange={(e) => setValue(e.target.value)} aria-label="Neuer Name" />
        <IconButton type="submit" aria-label="Speichern" className="text-accent">
          <Check size={20} />
        </IconButton>
        <IconButton
          aria-label="Abbrechen"
          onClick={() => {
            setValue(name)
            setEditing(false)
          }}
        >
          <X size={20} />
        </IconButton>
      </form>
    )
  }
  return (
    <div className="flex items-center gap-1 py-1 pr-2 pl-4">
      <span className="min-w-0 flex-1">
        <span className="block truncate">{name}</span>
        {meta && <span className="block text-sm text-ink-muted">{meta}</span>}
      </span>
      {children}
      <IconButton aria-label={`„${name}“ umbenennen`} onClick={() => setEditing(true)}>
        <Pencil size={18} />
      </IconButton>
    </div>
  )
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => Promise<void> }) {
  const [value, setValue] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim()) return
    await onAdd(value.trim())
    setValue('')
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2 px-3 py-2">
      <TextInput value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      <Button type="submit" disabled={!value.trim()}>
        <Plus size={18} /> Hinzufügen
      </Button>
    </form>
  )
}

function ContextSettings() {
  const repo = useRepo()
  const { contexts, actions } = useData()
  const { confirm, toast } = useFeedback()
  const sorted = sortContexts(contexts)

  const remove = async (id: string, name: string) => {
    const open = actions.filter((a) => a.contextId === id && !a.doneAt).length
    const ok = await confirm({
      title: `Kontext „${name}“ löschen?`,
      message: open
        ? `${open === 1 ? '1 offener Schritt steht' : `${open} offene Schritte stehen`} danach unter „Ohne Kontext“.`
        : undefined,
      confirmLabel: 'Löschen',
      danger: true,
    })
    if (!ok) return
    await repo.contexts.remove(id)
    toast('Kontext gelöscht', { actionLabel: 'Rückgängig', onAction: () => repo.contexts.restore(id) })
  }

  return (
    <>
      <SectionTitle count={sorted.length}>Kontexte</SectionTitle>
      <Card className="divide-y divide-line">
        {sorted.map((context, index) => (
          <EditableRow key={context.id} name={context.name} onRename={(name) => repo.contexts.update(context.id, { name })}>
            <IconButton aria-label={`„${context.name}“ nach oben`} disabled={index === 0} onClick={() => moveContext(repo, context.id, -1)}>
              <ArrowUp size={18} />
            </IconButton>
            <IconButton
              aria-label={`„${context.name}“ nach unten`}
              disabled={index === sorted.length - 1}
              onClick={() => moveContext(repo, context.id, 1)}
            >
              <ArrowDown size={18} />
            </IconButton>
            <IconButton aria-label={`„${context.name}“ löschen`} onClick={() => remove(context.id, context.name)}>
              <Trash2 size={18} />
            </IconButton>
          </EditableRow>
        ))}
        <AddRow placeholder="Neuer Kontext" onAdd={async (name) => void (await addContext(repo, name))} />
      </Card>
    </>
  )
}

function PeopleSettings() {
  const repo = useRepo()
  const { people, actions, waiting } = useData()
  const { confirm, toast } = useFeedback()

  const remove = async (id: string, name: string) => {
    const agenda = actions.filter((a) => a.agendaPersonId === id && !a.doneAt).length
    const waits = waiting.filter((w) => w.personId === id && !w.doneAt).length
    const parts = [agenda && `${agenda} Agenda-Punkte`, waits && `${waits} „Warten auf“`].filter(Boolean).join(' und ')
    const ok = await confirm({
      title: `„${name}“ löschen?`,
      message: parts ? `Es gibt noch ${parts}. Diese bleiben erhalten, aber ohne Person.` : undefined,
      confirmLabel: 'Löschen',
      danger: true,
    })
    if (!ok) return
    await repo.people.remove(id)
    toast('Person gelöscht', { actionLabel: 'Rückgängig', onAction: () => repo.people.restore(id) })
  }

  return (
    <>
      <SectionTitle count={people.length}>Personen</SectionTitle>
      <Card className="divide-y divide-line">
        {sortPeople(people).map((person) => (
          <EditableRow key={person.id} name={person.name} onRename={(name) => repo.people.update(person.id, { name })}>
            <IconButton aria-label={`„${person.name}“ löschen`} onClick={() => remove(person.id, person.name)}>
              <Trash2 size={18} />
            </IconButton>
          </EditableRow>
        ))}
        <AddRow placeholder="Neue Person" onAdd={async (name) => void (await repo.people.add({ name }))} />
      </Card>
    </>
  )
}

function DataSettings() {
  const repo = useRepo()
  const { confirm, toast } = useFeedback()
  const fileInput = useRef<HTMLInputElement>(null)

  const exportData = async () => {
    const backup = await repo.exportAll()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gtd-sicherung-${todayLocal()}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast('Sicherung heruntergeladen')
  }

  const importData = async (file: File) => {
    try {
      const backup = parseBackup(JSON.parse(await file.text()))
      const count = COLLECTION_NAMES.reduce((sum, name) => sum + backup.data[name].filter((r) => !r.deletedAt).length, 0)
      const ok = await confirm({
        title: 'Sicherung einspielen?',
        message: `Alle aktuellen Daten werden durch die Sicherung vom ${new Date(backup.exportedAt).toLocaleString('de-DE')} ersetzt (${count} Einträge).`,
        confirmLabel: 'Ersetzen',
        danger: true,
      })
      if (!ok) return
      await repo.importAll(backup)
      toast('Sicherung eingespielt')
    } catch (error) {
      toast(error instanceof BackupError ? error.message : 'Die Datei ist keine gültige Sicherung.')
    }
  }

  const loadDemo = async () => {
    const ok = await confirm({
      title: 'Demo-Daten laden?',
      message: 'Alle aktuellen Daten werden durch Beispieldaten ersetzt. Exportiere vorher eine Sicherung, wenn du sie behalten willst.',
      confirmLabel: 'Demo-Daten laden',
      danger: true,
    })
    if (!ok) return
    await repo.importAll(buildDemoData())
    toast('Demo-Daten geladen')
  }

  const clearAll = async () => {
    const ok = await confirm({
      title: 'Alle Daten löschen?',
      message: 'Eingang, Projekte, Schritte, Kalender, Referenz und Personen werden unwiderruflich gelöscht. Die Standard-Kontexte werden neu angelegt.',
      confirmLabel: 'Alles löschen',
      danger: true,
    })
    if (!ok) return
    await repo.clearAll()
    toast('Alle Daten gelöscht')
  }

  return (
    <>
      <SectionTitle>Daten</SectionTitle>
      <Card className="divide-y divide-line">
        <DataRow icon={<Download size={20} />} title="Exportieren" description="Alle Daten als JSON-Datei sichern.">
          <Button onClick={exportData}>Exportieren</Button>
        </DataRow>
        <DataRow icon={<Upload size={20} />} title="Importieren" description="Eine JSON-Sicherung einspielen (ersetzt alle Daten).">
          <Button onClick={() => fileInput.current?.click()}>Importieren</Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void importData(file)
            }}
          />
        </DataRow>
        <DataRow icon={<Sparkles size={20} />} title="Demo-Daten laden" description="Beispiele zum Ausprobieren (ersetzt alle Daten).">
          <Button onClick={loadDemo}>Laden</Button>
        </DataRow>
        <DataRow icon={<TriangleAlert size={20} />} title="Alle Daten löschen" description="Neu anfangen – mit Bestätigung." tone="danger">
          <Button variant="danger-soft" onClick={clearAll}>
            Löschen
          </Button>
        </DataRow>
      </Card>
    </>
  )
}

function DataRow({
  icon,
  title,
  description,
  tone,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  tone?: 'danger'
  children: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className={tone === 'danger' ? 'text-danger' : 'text-ink-muted'}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-ink-muted">{description}</span>
      </span>
      {children}
    </div>
  )
}
