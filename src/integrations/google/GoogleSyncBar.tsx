import { CalendarSync, RefreshCw } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { formatDay, localDateOf } from '../../domain/dates'
import { useToday } from '../../state/useToday'
import { useGoogleCalendar } from './context'

const time = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' })

/** Stand der Google-Termine mit „Aktualisieren“ – für Kalender und Wochenrückblick */
export function GoogleSyncBar({ showSetupHint = false }: { showSetupHint?: boolean }) {
  const google = useGoogleCalendar()
  const today = useToday()

  if (!google.connected) {
    if (!showSetupHint) return null
    return (
      <p className="mb-4 flex items-center gap-2 px-1 text-sm text-ink-muted">
        <CalendarSync size={16} />
        <Link to="/einstellungen#google" className="hover:text-accent hover:underline">
          Termine aus Google Kalender einblenden
        </Link>
      </p>
    )
  }

  const last = google.lastSync
  const stand = last
    ? `${localDateOf(last) === today ? 'heute' : formatDay(localDateOf(last), today)}, ${time.format(new Date(last))}`
    : 'noch nicht geladen'

  return (
    <div className="mb-4 rounded-2xl border border-line bg-surface px-4 py-2.5">
      <div className="flex items-center gap-3">
        <CalendarSync size={18} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1 text-sm">
          <span className="font-medium">Google Kalender</span>
          <span className="text-ink-muted"> · Stand {stand}</span>
        </span>
        <Button size="sm" variant="ghost" onClick={() => void google.refresh(true)} disabled={google.syncing} aria-label="Google-Termine aktualisieren">
          <RefreshCw size={16} className={google.syncing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Aktualisieren</span>
        </Button>
      </div>
      {google.error && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {google.error}
        </p>
      )}
    </div>
  )
}
