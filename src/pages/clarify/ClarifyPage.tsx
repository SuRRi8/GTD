import { ArrowLeft, Pause, PartyPopper } from 'lucide-react'
import { useEffect, useReducer, useRef, useState, type ComponentType } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../components/Button'
import { Card } from '../../components/misc'
import { useData, useRepo } from '../../data/hooks'
import type { InboxItem } from '../../data/types'
import { clarifyProgress, clarifyReducer, decisionOf, initClarify, type ClarifyStep } from '../../domain/clarify'
import { formatDay, localDateOf } from '../../domain/dates'
import { visibleInbox } from '../../domain/tickler'
import { useGoogleCalendar } from '../../integrations/google/context'
import { applyClarifyDecision, describeDecision } from '../../services/clarify'
import { useFeedback } from '../../state/feedback'
import { usePrefs } from '../../state/prefs'
import { useToday } from '../../state/useToday'
import {
  ActionableStep,
  AreaStep,
  ContextStep,
  DelegateStep,
  DoNowStep,
  MultiStepStep,
  NextActionStep,
  NotActionableStep,
  ProjectNextStep,
  ProjectStep,
  ReviewStep,
  ScheduleStep,
  TicklerStep,
  TwoMinutesStep,
  WhoStep,
  type StepProps,
} from './steps'

const STEPS: Record<Exclude<ClarifyStep, 'finished'>, ComponentType<StepProps>> = {
  review: ReviewStep,
  actionable: ActionableStep,
  notActionable: NotActionableStep,
  tickler: TicklerStep,
  multiStep: MultiStepStep,
  project: ProjectStep,
  nextAction: NextActionStep,
  twoMinutes: TwoMinutesStep,
  doNow: DoNowStep,
  projectNext: ProjectNextStep,
  who: WhoStep,
  delegate: DelegateStep,
  schedule: ScheduleStep,
  context: ContextStep,
  area: AreaStep,
}

/**
 * Klären-Modus: zeigt immer nur den ältesten Eintrag. Kein Überspringen,
 * kein Zurücklegen – nur Pausieren (der Eintrag bleibt dann oben).
 */
export function ClarifyPage() {
  const { inbox } = useData()
  const today = useToday()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = params.get('zurueck') ?? '/eingang'
  const items = visibleInbox(inbox, today)
  const item = items[0]

  if (!item) return <InboxZero returnTo={returnTo} />

  return (
    <>
      <header className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Klären</h1>
          <p className="text-ink-muted">{items.length === 1 ? 'Letzter Eintrag im Eingang' : `Noch ${items.length} im Eingang`}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(returnTo)}>
          <Pause size={18} /> Klären pausieren
        </Button>
      </header>
      <ClarifyFlow key={item.id} item={item} />
    </>
  )
}

function ClarifyFlow({ item }: { item: InboxItem }) {
  const repo = useRepo()
  const today = useToday()
  const { lastArea, setLastArea } = usePrefs()
  const { toast } = useFeedback()
  const { createEvent } = useGoogleCalendar()
  const [state, dispatch] = useReducer(clarifyReducer, undefined, () => initClarify(item.text, lastArea))
  const [saveError, setSaveError] = useState<string>()
  const saving = useRef(false)

  useEffect(() => {
    const decision = decisionOf(state)
    if (!decision || saving.current) return
    saving.current = true
    if ('area' in decision) setLastArea(decision.area)
    applyClarifyDecision(repo, item.id, decision, new Date(), { createExternalEvent: createEvent })
      .then((result) => {
        if (decision.kind === 'delete') {
          toast('Gelöscht', { actionLabel: 'Rückgängig', onAction: () => repo.inbox.restore(item.id) })
        } else if (result.calendarFallback) {
          toast('Google war nicht erreichbar – der Termin steht im Kalender der App.')
        } else {
          toast(describeDecision(decision))
        }
      })
      .catch((error: unknown) => {
        saving.current = false
        setSaveError(String(error))
      })
  }, [state, repo, item.id, setLastArea, toast, createEvent])

  const Step = state.step === 'finished' ? null : STEPS[state.step]

  return (
    <div className="space-y-5">
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${clarifyProgress(state.step) * 100}%` }} />
      </div>

      {state.step !== 'review' && (
        <Card className="px-4 py-3">
          <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
            Eintrag · {formatDay(localDateOf(item.createdAt), today)}
          </p>
          <p className="mt-1 text-lg break-words">{state.text}</p>
        </Card>
      )}

      {Step ? <Step state={state} dispatch={dispatch} today={today} /> : <p className="text-ink-muted">Wird gespeichert …</p>}

      {saveError && (
        <p role="alert" className="text-danger">
          Speichern fehlgeschlagen: {saveError}
        </p>
      )}

      {state.history.length > 0 && state.step !== 'finished' && (
        <Button variant="ghost" onClick={() => dispatch({ type: 'BACK' })}>
          <ArrowLeft size={18} /> Zurück
        </Button>
      )}
    </div>
  )
}

function InboxZero({ returnTo }: { returnTo: string }) {
  const fromReview = returnTo.startsWith('/rueckblick')
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-ok-soft text-ok">
        <PartyPopper size={38} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold">Eingang leer!</h1>
      <p className="mt-1 text-ink-muted">Alles ist geklärt. Dein Kopf ist frei.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {fromReview ? (
          <Link to={returnTo} className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 font-medium text-on-accent">
            Weiter mit dem Wochenrückblick
          </Link>
        ) : (
          <>
            <Link to="/jetzt" className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 font-medium text-on-accent">
              Was kann ich jetzt tun?
            </Link>
            <Link to="/" className="inline-flex min-h-11 items-center rounded-xl bg-surface-2 px-4 font-medium">
              Zur Startseite
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
