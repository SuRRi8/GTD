import { CalendarSync, LogOut, RefreshCw } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { Segmented } from '../../components/Chips'
import { Field, Select, TextInput } from '../../components/forms'
import { Card, SectionTitle } from '../../components/misc'
import { useFeedback } from '../../state/feedback'
import { useGoogleCalendar } from './context'
import type { CalendarArea } from './types'

const AREA_OPTIONS: { value: CalendarArea; label: string }[] = [
  { value: 'arbeit', label: 'Arbeit' },
  { value: 'privat', label: 'Privat' },
  { value: 'beide', label: 'Beide' },
]

/** Einstellungen → Google Kalender */
export function GoogleSettingsSection() {
  const google = useGoogleCalendar()
  const { confirm } = useFeedback()
  const [editingId, setEditingId] = useState(false)

  // Direktlink /einstellungen#google
  useEffect(() => {
    if (window.location.hash === '#google') document.getElementById('google')?.scrollIntoView({ block: 'start' })
  }, [])

  const disconnect = async () => {
    const ok = await confirm({
      title: 'Google Kalender trennen?',
      message: 'Die Google-Termine verschwinden aus der App. In Google selbst ändert sich nichts.',
      confirmLabel: 'Trennen',
    })
    if (ok) google.disconnect()
  }

  return (
    <>
      <div id="google" className="scroll-mt-20" />
      <SectionTitle>Google Kalender</SectionTitle>
      <Card className="space-y-4 p-4">
        {!google.configured || editingId ? (
          <ClientIdForm onDone={() => setEditingId(false)} />
        ) : !google.connected ? (
          <div className="space-y-3">
            <p className="text-ink-muted">
              Zeigt deine Google-Termine in Kalender, Startseite und Wochenrückblick. Die Verbindung läuft direkt vom Browser zu Google.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => void google.connect()} disabled={google.syncing}>
                <CalendarSync size={18} /> Mit Google verbinden
              </Button>
              <Button variant="ghost" onClick={() => setEditingId(true)}>
                Client-ID ändern
              </Button>
            </div>
          </div>
        ) : (
          <ConnectedSettings onDisconnect={disconnect} />
        )}
        {google.error && (
          <p role="alert" className="text-sm text-danger">
            {google.error}
          </p>
        )}
      </Card>
    </>
  )
}

function ClientIdForm({ onDone }: { onDone: () => void }) {
  const google = useGoogleCalendar()
  const [value, setValue] = useState(google.settings.clientId ?? '')
  const origin = window.location.origin

  const save = (event: FormEvent) => {
    event.preventDefault()
    google.setClientId(value)
    onDone()
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <p className="text-ink-muted">
        Für die Verbindung braucht die App eine kostenlose OAuth-Client-ID aus der Google Cloud. Die Schritt-für-Schritt-Anleitung steht in
        der README unter „Google Kalender verbinden“.
      </p>
      <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm">
        Als „Autorisierte JavaScript-Quelle“ eintragen: <code className="font-semibold break-all">{origin}</code>
      </p>
      <Field
        label="OAuth-Client-ID"
        htmlFor="google-client-id"
        hint={google.clientIdFromBuild ? 'Leer lassen, um die Client-ID aus der App-Konfiguration zu nutzen.' : undefined}
      >
        <TextInput
          id="google-client-id"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="1234…apps.googleusercontent.com"
          autoComplete="off"
          spellCheck={false}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={!value.trim() && !google.clientIdFromBuild}>
          Speichern
        </Button>
        {google.configured && (
          <Button variant="ghost" onClick={onDone}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  )
}

function ConnectedSettings({ onDisconnect }: { onDisconnect: () => void }) {
  const google = useGoogleCalendar()
  const writable = google.settings.calendars.filter((c) => c.canWrite)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <span className="block font-medium">Verbunden</span>
          <span className="block text-sm break-all text-ink-muted">{google.account}</span>
        </span>
        <Button size="sm" variant="ghost" onClick={() => void google.connect()} disabled={google.syncing}>
          <RefreshCw size={16} className={google.syncing ? 'animate-spin' : ''} /> Kalender neu laden
        </Button>
        <Button size="sm" variant="ghost" onClick={onDisconnect}>
          <LogOut size={16} /> Trennen
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink-muted">Welche Kalender anzeigen – und zu welchem Bereich gehören sie?</p>
        <div className="divide-y divide-line rounded-xl border border-line">
          {google.settings.calendars.map((calendar) => (
            <div key={calendar.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
              <label className="flex min-h-10 min-w-0 basis-full items-center gap-3 sm:flex-1 sm:basis-auto">
                <input
                  type="checkbox"
                  className="size-5 accent-[var(--accent)]"
                  checked={calendar.selected}
                  onChange={(e) =>
                    google.updateCalendar(calendar.id, {
                      selected: e.target.checked,
                    })
                  }
                />
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: calendar.color ?? 'currentColor' }}
                />
                <span className="break-words">{calendar.name}</span>
              </label>
              {calendar.selected && (
                <div className="pl-8 sm:pl-0">
                  <Segmented
                    label={`Bereich für ${calendar.name}`}
                    size="sm"
                    value={calendar.area}
                    onChange={(area) => google.updateCalendar(calendar.id, { area })}
                    options={AREA_OPTIONS}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Field
        label="Neue Termine aus der App eintragen in"
        htmlFor="google-write-calendar"
        hint="Termine aus dem Klären und dem Kalender landen dann direkt in Google (Dauer: 1 Stunde)."
      >
        <Select
          id="google-write-calendar"
          value={google.settings.writeCalendarId ?? ''}
          onChange={(e) => google.setWriteCalendar(e.target.value || undefined)}
        >
          <option value="">Nicht in Google – im eigenen Kalender der App</option>
          {writable.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <p className="text-sm text-ink-muted">
        Die Verbindung gilt jeweils etwa eine Stunde. Danach zeigt die App den zuletzt geladenen Stand; „Aktualisieren“ im Kalender öffnet
        kurz das Google-Fenster.
      </p>
    </div>
  )
}
