import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Check,
  Lightbulb,
  ListChecks,
  Send,
  Timer,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type Dispatch, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { Segmented } from '../../components/Chips'
import { Field, TextArea, TextInput } from '../../components/forms'
import { AREA_LABEL } from '../../components/labels'
import { ContextPicker, DatePicker, EnergyPicker, MinutesPicker, PersonPicker, type ContextSelection } from '../../components/pickers'
import type { Area, Energy, LocalDate, LocalTime, Minutes } from '../../data/types'
import type { ClarifyEvent, ClarifyState } from '../../domain/clarify'
import { addDays } from '../../domain/dates'
import { ACTION_EXAMPLES, ACTION_VERBS } from '../../domain/nextActionHint'

export interface StepProps {
  state: ClarifyState
  dispatch: Dispatch<ClarifyEvent>
  today: LocalDate
}

function Question({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {hint && <p className="mt-1 text-ink-muted">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

function ChoiceButton({
  icon: Icon,
  title,
  description,
  onClick,
  tone,
  autoFocus,
}: {
  icon: LucideIcon
  title: string
  description?: string
  onClick: () => void
  tone?: 'danger'
  autoFocus?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus={autoFocus}
      className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-accent hover:bg-accent-soft/40"
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
          tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent'
        }`}
      >
        <Icon size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {description && <span className="block text-sm text-ink-muted">{description}</span>}
      </span>
    </button>
  )
}

function YesNo({ onAnswer, yes = 'Ja', no = 'Nein' }: { onAnswer: (answer: boolean) => void; yes?: string; no?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button size="lg" variant="primary" onClick={() => onAnswer(true)} autoFocus>
        {yes}
      </Button>
      <Button size="lg" onClick={() => onAnswer(false)}>
        {no}
      </Button>
    </div>
  )
}

function ErrorText({ error }: { error?: string }) {
  if (!error) return null
  return (
    <p role="alert" className="text-sm font-medium text-danger">
      {error}
    </p>
  )
}

// 1. Text ansehen
export function ReviewStep({ state, dispatch }: StepProps) {
  const [text, setText] = useState(state.text)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    dispatch({ type: 'CONFIRM_TEXT', text })
  }
  return (
    <Question title="Was ist das genau?" hint="Lies den Eintrag. Formuliere ihn um, falls nicht sofort klar ist, worum es geht.">
      <form onSubmit={submit} className="space-y-4">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          aria-label="Eintrag"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e)
          }}
        />
        <ErrorText error={state.error} />
        <Button type="submit" variant="primary" size="lg" block disabled={!text.trim()} autoFocus>
          Weiter <ArrowRight size={18} />
        </Button>
      </form>
    </Question>
  )
}

// 2. Umsetzbar?
export function ActionableStep({ dispatch }: StepProps) {
  return (
    <Question title="Ist es umsetzbar?" hint="Gibt es etwas zu tun – für dich oder für jemand anderen?">
      <YesNo onAnswer={(answer) => dispatch({ type: 'ACTIONABLE', answer })} />
    </Question>
  )
}

// 2a. Nicht umsetzbar
export function NotActionableStep({ dispatch }: StepProps) {
  return (
    <Question title="Was soll damit passieren?">
      <div className="space-y-3">
        <ChoiceButton
          icon={Trash2}
          tone="danger"
          title="Löschen"
          description="Brauche ich nicht mehr."
          onClick={() => dispatch({ type: 'DISPOSE', disposition: 'delete' })}
        />
        <ChoiceButton
          icon={BookOpen}
          title="Als Referenz speichern"
          description="Nützliche Information zum Nachschlagen."
          onClick={() => dispatch({ type: 'DISPOSE', disposition: 'reference' })}
        />
        <ChoiceButton
          icon={Lightbulb}
          title="Irgendwann/Vielleicht"
          description="Vielleicht später – nicht jetzt."
          onClick={() => dispatch({ type: 'DISPOSE', disposition: 'someday' })}
        />
        <ChoiceButton
          icon={CalendarClock}
          title="Wiedervorlage an Datum"
          description="Verschwindet und taucht am Datum wieder im Eingang auf."
          onClick={() => dispatch({ type: 'DISPOSE', disposition: 'tickler' })}
        />
      </div>
    </Question>
  )
}

// 2b. Wiedervorlage
export function TicklerStep({ state, dispatch, today }: StepProps) {
  const [date, setDate] = useState<LocalDate | undefined>(state.tickleDate)
  const tomorrow = addDays(today, 1)
  return (
    <Question title="Wann soll es wieder auftauchen?" hint="An diesem Tag liegt der Eintrag wieder im Eingang.">
      <DatePicker
        label="Datum der Wiedervorlage"
        value={date}
        onChange={setDate}
        today={today}
        min={tomorrow}
        quick={[
          { label: 'Morgen', days: 1 },
          { label: 'In 1 Woche', days: 7 },
          { label: 'In 1 Monat', days: 30 },
          { label: 'In 3 Monaten', days: 91 },
        ]}
      />
      <ErrorText error={state.error} />
      <Button
        variant="primary"
        size="lg"
        block
        disabled={!date || date < tomorrow}
        onClick={() => date && dispatch({ type: 'SET_TICKLE_DATE', date })}
      >
        In Wiedervorlage legen
      </Button>
    </Question>
  )
}

// 3. Mehrere Schritte?
export function MultiStepStep({ dispatch }: StepProps) {
  return (
    <Question title="Braucht es mehr als einen Schritt?" hint="Dann ist es ein Projekt – zum Beispiel „Urlaub planen“ oder „Angebot erstellen“.">
      <YesNo
        yes="Ja, Projekt"
        no="Nein, ein Schritt"
        onAnswer={(answer) => dispatch({ type: 'MULTI_STEP', answer })}
      />
    </Question>
  )
}

// 3a. Projekt anlegen
export function ProjectStep({ state, dispatch }: StepProps) {
  const [title, setTitle] = useState(state.project?.title ?? state.text)
  const [outcome, setOutcome] = useState(state.project?.outcome ?? '')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    dispatch({ type: 'DEFINE_PROJECT', title, outcome })
  }
  return (
    <Question title="Projekt anlegen" hint="Beschreibe, woran du erkennst, dass das Projekt abgeschlossen ist.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Projekt" htmlFor="project-title">
          <TextInput id="project-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Erledigt ist es, wenn …" htmlFor="project-outcome">
          <TextInput
            id="project-outcome"
            autoFocus
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="… Flüge und Hotel gebucht sind"
          />
        </Field>
        <ErrorText error={state.error} />
        <Button type="submit" variant="primary" size="lg" block disabled={!title.trim() || !outcome.trim()}>
          Projekt anlegen und weiter <ArrowRight size={18} />
        </Button>
      </form>
    </Question>
  )
}

// 4. Nächster physischer Schritt
export function NextActionStep({ state, dispatch }: StepProps) {
  const [title, setTitle] = useState(state.actionTitle)
  const inputRef = useRef<HTMLInputElement>(null)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    dispatch({ type: 'DEFINE_ACTION', title })
  }
  return (
    <Question
      title="Was ist der nächste physische Schritt?"
      hint={
        state.project ? (
          <>
            Für das Projekt <strong className="font-medium text-ink">„{state.project.title}“</strong>
          </>
        ) : undefined
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <TextInput
          ref={inputRef}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z. B. Anna anrufen wegen Angebot"
          aria-label="Nächster Schritt"
        />
        <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-muted">
          <p>
            Eine sichtbare Handlung, die du sofort tun könntest – mit einem Verb wie {ACTION_VERBS.slice(0, 6).join(', ')} …
          </p>
          <p className="mt-1">Beispiele: {ACTION_EXAMPLES.map((e) => `„${e}“`).join(', ')}</p>
        </div>
        {state.oneWordWarning && (
          <div role="alert" className="rounded-xl border border-warn/40 bg-warn-soft px-4 py-3">
            <p className="flex items-start gap-2 text-warn">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              <span>
                „{state.actionTitle}“ klingt nach einem Thema. Was genau tust du als Erstes – anrufen, mailen, besorgen …?
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={() => inputRef.current?.focus()}>
                Umformulieren
              </Button>
              <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'DEFINE_ACTION', title, force: true })}>
                So übernehmen
              </Button>
            </div>
          </div>
        )}
        <ErrorText error={state.error} />
        <Button type="submit" variant="primary" size="lg" block disabled={!title.trim()}>
          Weiter <ArrowRight size={18} />
        </Button>
      </form>
    </Question>
  )
}

// 5. Weniger als 2 Minuten?
export function TwoMinutesStep({ state, dispatch }: StepProps) {
  return (
    <Question title="Dauert es weniger als 2 Minuten?" hint="Dann erledige es sofort – das geht schneller, als es zu verwalten.">
      <ActionTitle title={state.actionTitle} />
      <YesNo yes="Ja, jetzt erledigen" no="Nein" onAnswer={(answer) => dispatch({ type: 'TWO_MINUTES', answer })} />
    </Question>
  )
}

function ActionTitle({ title }: { title: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-accent-soft px-4 py-3 font-medium text-accent">
      <ListChecks size={20} className="mt-0.5 shrink-0" />
      {title}
    </p>
  )
}

const TWO_MINUTES = 120

// 5a. Jetzt erledigen mit Timer
export function DoNowStep({ state, dispatch }: StepProps) {
  const [left, setLeft] = useState(TWO_MINUTES)
  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => {
      const remaining = Math.max(0, TWO_MINUTES - Math.floor((Date.now() - started) / 1000))
      setLeft(remaining)
      if (remaining === 0) clearInterval(timer)
    }, 250)
    return () => clearInterval(timer)
  }, [])

  const elapsed = left === 0
  const minutes = Math.floor(left / 60)
  const seconds = String(left % 60).padStart(2, '0')

  return (
    <Question title="Jetzt erledigen">
      <ActionTitle title={state.actionTitle} />
      <div className="flex flex-col items-center py-2">
        <div
          className={`flex items-center gap-2 font-mono text-5xl font-semibold tabular-nums ${elapsed ? 'text-warn' : ''}`}
          role="timer"
          aria-label="Verbleibende Zeit"
        >
          <Timer size={36} className="text-ink-muted" />
          {minutes}:{seconds}
        </div>
        <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${elapsed ? 'bg-warn' : 'bg-accent'}`}
            style={{ width: `${(left / TWO_MINUTES) * 100}%` }}
          />
        </div>
        {elapsed && (
          <p className="mt-3 text-center text-sm text-warn">Die 2 Minuten sind um. Fertig machen – oder doch einplanen?</p>
        )}
      </div>
      <Button variant="primary" size="lg" block onClick={() => dispatch({ type: 'DONE_NOW' })} autoFocus>
        <Check size={20} /> Erledigt
      </Button>
      <Button variant={elapsed ? 'secondary' : 'ghost'} block onClick={() => dispatch({ type: 'DEFER' })}>
        Dauert länger – einplanen
      </Button>
    </Question>
  )
}

// 5b. Projekt nach sofort erledigtem Schritt
export function ProjectNextStep({ state, dispatch }: StepProps) {
  return (
    <Question title="Erledigt! Wie geht es weiter?" hint={`Projekt „${state.project?.title}“`}>
      <div className="space-y-3">
        <ChoiceButton
          icon={ArrowRight}
          title="Nächsten Schritt festlegen"
          description="Was ist jetzt die nächste physische Handlung?"
          onClick={() => dispatch({ type: 'PROJECT_NEXT', choice: 'another' })}
          autoFocus
        />
        <ChoiceButton
          icon={TriangleAlert}
          tone="danger"
          title="Später entscheiden"
          description="Das Projekt steht dann als „Stillstand“ in der Liste, bis es einen nächsten Schritt hat."
          onClick={() => dispatch({ type: 'PROJECT_NEXT', choice: 'later' })}
        />
      </div>
    </Question>
  )
}

// 6. Wer macht es?
export function WhoStep({ state, dispatch }: StepProps) {
  return (
    <Question title="Wer macht es?">
      <ActionTitle title={state.actionTitle} />
      <div className="space-y-3">
        <ChoiceButton
          icon={Send}
          title="Jemand anderes"
          description="Abgeben und auf „Warten auf“ setzen."
          onClick={() => dispatch({ type: 'WHO', answer: 'other' })}
        />
        <ChoiceButton
          icon={CalendarDays}
          title="Ich – an einem bestimmten Tag"
          description="Termin oder Tagesaufgabe im Kalender."
          onClick={() => dispatch({ type: 'WHO', answer: 'calendar' })}
        />
        <ChoiceButton
          icon={ListChecks}
          title="Ich – sobald wie möglich"
          description="Auf die Liste der nächsten Schritte."
          onClick={() => dispatch({ type: 'WHO', answer: 'me' })}
        />
      </div>
    </Question>
  )
}

// 6a. Delegieren
export function DelegateStep({ state, dispatch, today }: StepProps) {
  const previous = state.next?.kind === 'waiting' ? state.next : undefined
  const [personId, setPersonId] = useState<string | undefined>(previous?.personId)
  const [followUpOn, setFollowUpOn] = useState<LocalDate | undefined>(previous?.followUpOn)
  const [title, setTitle] = useState(state.actionTitle)
  return (
    <Question title="An wen gibst du es ab?" hint="Der Eintrag landet auf „Warten auf“ – mit dem heutigen Datum.">
      <PersonPicker value={personId} onChange={setPersonId} />
      <Field label="Worauf wartest du?" htmlFor="waiting-title">
        <TextInput id="waiting-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Nachfassen am (optional)">
        <DatePicker
          label="Nachfassen am"
          value={followUpOn}
          onChange={setFollowUpOn}
          today={today}
          min={today}
          clearable
          quick={[
            { label: 'In 3 Tagen', days: 3 },
            { label: 'In 1 Woche', days: 7 },
            { label: 'In 2 Wochen', days: 14 },
          ]}
        />
      </Field>
      <ErrorText error={state.error} />
      <Button
        variant="primary"
        size="lg"
        block
        disabled={!personId || !title.trim()}
        onClick={() => personId && dispatch({ type: 'DELEGATE', personId, followUpOn, title })}
      >
        Weiter <ArrowRight size={18} />
      </Button>
    </Question>
  )
}

// 6b. Kalender
export function ScheduleStep({ state, dispatch, today }: StepProps) {
  const previous = state.next?.kind === 'calendar' ? state.next : undefined
  const [kind, setKind] = useState<'termin' | 'tagesaufgabe'>(previous?.calendarKind ?? 'termin')
  const [date, setDate] = useState<LocalDate | undefined>(previous?.date)
  const [time, setTime] = useState<LocalTime>(previous?.time ?? '')
  const valid = Boolean(date) && (kind === 'tagesaufgabe' || Boolean(time))
  return (
    <Question title="Wann?" hint="Nur, wenn es wirklich an diesen Tag gebunden ist.">
      <Segmented
        label="Art"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'termin', label: 'Termin' },
          { value: 'tagesaufgabe', label: 'Tagesaufgabe' },
        ]}
      />
      <DatePicker
        label="Datum"
        value={date}
        onChange={setDate}
        today={today}
        quick={[
          { label: 'Heute', days: 0 },
          { label: 'Morgen', days: 1 },
        ]}
      />
      {kind === 'termin' && (
        <Field label="Uhrzeit" htmlFor="schedule-time">
          <TextInput id="schedule-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      )}
      <ErrorText error={state.error} />
      <Button
        variant="primary"
        size="lg"
        block
        disabled={!valid}
        onClick={() => date && dispatch({ type: 'SCHEDULE', calendarKind: kind, date, time: time || undefined })}
      >
        Weiter <ArrowRight size={18} />
      </Button>
    </Question>
  )
}

// 6c. Kontext
export function ContextStep({ state, dispatch }: StepProps) {
  const previous = state.next?.kind === 'action' ? state.next : undefined
  const [selection, setSelection] = useState<ContextSelection>({
    contextId: previous?.contextId,
    agendaPersonId: previous?.agendaPersonId,
  })
  const [minutes, setMinutes] = useState<Minutes | undefined>(previous?.minutes)
  const [energy, setEnergy] = useState<Energy | undefined>(previous?.energy)
  const valid = Boolean(selection.contextId || selection.agendaPersonId)
  return (
    <Question title="Wo oder womit kannst du es tun?">
      <ActionTitle title={state.actionTitle} />
      <ContextPicker value={selection} onChange={setSelection} />
      <Field label="Zeitbedarf (optional)">
        <MinutesPicker value={minutes} onChange={setMinutes} />
      </Field>
      <Field label="Energie (optional)">
        <EnergyPicker value={energy} onChange={setEnergy} />
      </Field>
      <ErrorText error={state.error} />
      <Button
        variant="primary"
        size="lg"
        block
        disabled={!valid}
        onClick={() => dispatch({ type: 'ASSIGN_CONTEXT', ...selection, minutes, energy })}
      >
        Weiter <ArrowRight size={18} />
      </Button>
    </Question>
  )
}

// 7. Bereich
export function AreaStep({ state, dispatch }: StepProps) {
  const areas: Area[] = ['arbeit', 'privat']
  return (
    <Question title="Arbeit oder Privat?" hint="Vorausgewählt ist der zuletzt verwendete Bereich.">
      <div className="grid grid-cols-2 gap-3">
        {areas.map((area) => (
          <Button
            key={area}
            size="lg"
            variant={area === state.area ? 'primary' : 'secondary'}
            autoFocus={area === state.area}
            onClick={() => dispatch({ type: 'CHOOSE_AREA', area })}
          >
            {AREA_LABEL[area]}
          </Button>
        ))}
      </div>
    </Question>
  )
}
