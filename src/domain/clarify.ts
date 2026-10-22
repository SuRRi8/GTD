import type { Area, CalendarKind, Energy, LocalDate, LocalTime, Minutes } from '../data/types'
import { isValidLocalDate } from './dates'
import { isSingleWord } from './nextActionHint'

/**
 * Der Klären-Ablauf als reiner Zustandsautomat (Reducer).
 * Die Oberfläche schickt Ereignisse, der Reducer entscheidet über den nächsten Schritt.
 * Am Ende liefert `decisionOf` eine fertige Entscheidung, die der
 * Klären-Service in Datensätze übersetzt.
 */

export type ClarifyStep =
  | 'review' // 1. Text ansehen, ggf. umformulieren
  | 'actionable' // 2. Ist es umsetzbar?
  | 'notActionable' // 2a. Löschen / Referenz / Irgendwann / Wiedervorlage
  | 'tickler' // 2b. Datum der Wiedervorlage
  | 'multiStep' // 3. Mehr als ein Schritt?
  | 'project' // 3a. Projekt mit Ergebnis-Satz anlegen
  | 'nextAction' // 4. Nächster physischer Schritt
  | 'twoMinutes' // 5. Weniger als 2 Minuten?
  | 'doNow' // 5a. Jetzt erledigen (Timer)
  | 'projectNext' // 5b. Nach „Erledigt“ im Projekt: weiterer Schritt oder später
  | 'who' // 6. Wer macht es?
  | 'delegate' // 6a. Warten auf
  | 'schedule' // 6b. Kalender
  | 'context' // 6c. Kontext, Zeit, Energie
  | 'area' // 7. Arbeit oder Privat
  | 'finished'

export type Disposition = 'delete' | 'reference' | 'someday' | 'tickler'

export interface ProjectDraft {
  title: string
  outcome: string
}

export type NextStepDraft =
  | { kind: 'action'; contextId?: string; agendaPersonId?: string; minutes?: Minutes; energy?: Energy }
  | { kind: 'waiting'; personId: string; followUpOn?: LocalDate }
  | { kind: 'calendar'; calendarKind: Exclude<CalendarKind, 'tagesinfo'>; date: LocalDate; time?: LocalTime }

export type NextStep = NextStepDraft & { title: string }

export interface ClarifyState {
  step: ClarifyStep
  /** Bisherige Schritte für „Zurück“ */
  history: ClarifyStep[]
  text: string
  disposition?: Disposition
  tickleDate?: LocalDate
  project?: ProjectDraft
  /** Formulierung des aktuellen nächsten Schritts */
  actionTitle: string
  /** Eingabe war nur ein Wort – sanft nachfragen */
  oneWordWarning: boolean
  /** Bereits sofort erledigte Schritte (2-Minuten-Regel) */
  doneActions: string[]
  next?: NextStepDraft
  area: Area
  error?: string
}

export type ClarifyEvent =
  | { type: 'CONFIRM_TEXT'; text: string }
  | { type: 'ACTIONABLE'; answer: boolean }
  | { type: 'DISPOSE'; disposition: Disposition }
  | { type: 'SET_TICKLE_DATE'; date: LocalDate }
  | { type: 'MULTI_STEP'; answer: boolean }
  | { type: 'DEFINE_PROJECT'; title: string; outcome: string }
  | { type: 'DEFINE_ACTION'; title: string; force?: boolean }
  | { type: 'TWO_MINUTES'; answer: boolean }
  | { type: 'DONE_NOW' }
  /** Doch nicht in 2 Minuten zu schaffen */
  | { type: 'DEFER' }
  | { type: 'PROJECT_NEXT'; choice: 'another' | 'later' }
  | { type: 'WHO'; answer: 'other' | 'calendar' | 'me' }
  | { type: 'DELEGATE'; personId: string; followUpOn?: LocalDate; title?: string }
  | { type: 'SCHEDULE'; calendarKind: Exclude<CalendarKind, 'tagesinfo'>; date: LocalDate; time?: LocalTime }
  | { type: 'ASSIGN_CONTEXT'; contextId?: string; agendaPersonId?: string; minutes?: Minutes; energy?: Energy }
  | { type: 'CHOOSE_AREA'; area: Area }
  | { type: 'BACK' }

export type ClarifyDecision =
  | { kind: 'delete' }
  | { kind: 'tickler'; text: string; tickleDate: LocalDate }
  | { kind: 'reference'; text: string; area: Area }
  | { kind: 'someday'; text: string; area: Area }
  | { kind: 'actionable'; area: Area; project?: ProjectDraft; doneActions: string[]; next?: NextStep }

export function initClarify(text: string, lastArea: Area): ClarifyState {
  return { step: 'review', history: [], text, actionTitle: text, oneWordWarning: false, doneActions: [], area: lastArea }
}

function go(state: ClarifyState, step: ClarifyStep, patch: Partial<ClarifyState> = {}): ClarifyState {
  return { ...state, ...patch, step, history: [...state.history, state.step], error: undefined }
}

function fail(state: ClarifyState, error: string): ClarifyState {
  return { ...state, error }
}

export function clarifyReducer(state: ClarifyState, event: ClarifyEvent): ClarifyState {
  if (event.type === 'BACK') {
    const previous = state.history.at(-1)
    if (!previous || state.step === 'finished') return state
    return { ...state, step: previous, history: state.history.slice(0, -1), error: undefined, oneWordWarning: false }
  }

  switch (state.step) {
    case 'review':
      if (event.type !== 'CONFIRM_TEXT') break
      if (!event.text.trim()) return fail(state, 'Der Eintrag braucht einen Text.')
      return go(state, 'actionable', {
        text: event.text.trim(),
        // Solange nichts anderes formuliert wurde, ist der Text der Vorschlag für den Schritt
        actionTitle: state.actionTitle === state.text ? event.text.trim() : state.actionTitle,
      })

    case 'actionable':
      if (event.type !== 'ACTIONABLE') break
      return event.answer ? go(state, 'multiStep', { disposition: undefined }) : go(state, 'notActionable')

    case 'notActionable':
      if (event.type !== 'DISPOSE') break
      if (event.disposition === 'delete') return go(state, 'finished', { disposition: 'delete' })
      if (event.disposition === 'tickler') return go(state, 'tickler', { disposition: 'tickler' })
      return go(state, 'area', { disposition: event.disposition })

    case 'tickler':
      if (event.type !== 'SET_TICKLE_DATE') break
      if (!isValidLocalDate(event.date)) return fail(state, 'Bitte ein gültiges Datum wählen.')
      return go(state, 'finished', { tickleDate: event.date })

    case 'multiStep':
      if (event.type !== 'MULTI_STEP') break
      if (event.answer) return go(state, 'project', { project: state.project ?? { title: state.text, outcome: '' } })
      return go(state, 'nextAction', { project: undefined })

    case 'project':
      if (event.type !== 'DEFINE_PROJECT') break
      if (!event.title.trim()) return fail(state, 'Das Projekt braucht einen Namen.')
      if (!event.outcome.trim()) return fail(state, 'Bitte beschreibe, wann das Projekt erledigt ist.')
      return go(state, 'nextAction', {
        project: { title: event.title.trim(), outcome: event.outcome.trim() },
        // Projektname ist kein Schritt – neu formulieren lassen
        actionTitle: state.actionTitle === state.text ? '' : state.actionTitle,
      })

    case 'nextAction': {
      if (event.type !== 'DEFINE_ACTION') break
      const title = event.title.trim()
      if (!title) return fail(state, 'Bitte formuliere den nächsten Schritt.')
      if (isSingleWord(title) && !event.force) {
        return { ...state, actionTitle: title, oneWordWarning: true, error: undefined }
      }
      return go(state, 'twoMinutes', { actionTitle: title, oneWordWarning: false })
    }

    case 'twoMinutes':
      if (event.type !== 'TWO_MINUTES') break
      return go(state, event.answer ? 'doNow' : 'who')

    case 'doNow': {
      if (event.type === 'DEFER') return go(state, 'who')
      if (event.type !== 'DONE_NOW') break
      const doneActions = [...state.doneActions, state.actionTitle]
      // Erledigtes lässt sich nicht „zurück“ nehmen
      if (state.project) return { ...go(state, 'projectNext', { doneActions }), history: [] }
      return go(state, 'finished', { doneActions, next: undefined })
    }

    case 'projectNext':
      if (event.type !== 'PROJECT_NEXT') break
      if (event.choice === 'another') return go(state, 'nextAction', { actionTitle: '' })
      return go(state, 'area', { next: undefined })

    case 'who':
      if (event.type !== 'WHO') break
      return go(state, event.answer === 'other' ? 'delegate' : event.answer === 'calendar' ? 'schedule' : 'context')

    case 'delegate':
      if (event.type !== 'DELEGATE') break
      if (!event.personId) return fail(state, 'Bitte wähle eine Person.')
      if (event.followUpOn && !isValidLocalDate(event.followUpOn)) return fail(state, 'Ungültiges Nachfass-Datum.')
      return go(state, 'area', {
        actionTitle: event.title?.trim() || state.actionTitle,
        next: { kind: 'waiting', personId: event.personId, followUpOn: event.followUpOn || undefined },
      })

    case 'schedule':
      if (event.type !== 'SCHEDULE') break
      if (!isValidLocalDate(event.date)) return fail(state, 'Bitte ein gültiges Datum wählen.')
      if (event.calendarKind === 'termin' && !event.time) return fail(state, 'Ein Termin braucht eine Uhrzeit.')
      return go(state, 'area', {
        next: {
          kind: 'calendar',
          calendarKind: event.calendarKind,
          date: event.date,
          time: event.calendarKind === 'termin' ? event.time : undefined,
        },
      })

    case 'context':
      if (event.type !== 'ASSIGN_CONTEXT') break
      if (Boolean(event.contextId) === Boolean(event.agendaPersonId)) {
        return fail(state, 'Bitte wähle einen Kontext.')
      }
      return go(state, 'area', {
        next: {
          kind: 'action',
          contextId: event.contextId,
          agendaPersonId: event.agendaPersonId,
          minutes: event.minutes,
          energy: event.energy,
        },
      })

    case 'area':
      if (event.type !== 'CHOOSE_AREA') break
      return go(state, 'finished', { area: event.area })

    case 'finished':
      break
  }
  return state
}

/** Die fertige Entscheidung – nur im Schritt „finished“ */
export function decisionOf(state: ClarifyState): ClarifyDecision | undefined {
  if (state.step !== 'finished') return undefined
  switch (state.disposition) {
    case 'delete':
      return { kind: 'delete' }
    case 'tickler':
      return { kind: 'tickler', text: state.text, tickleDate: state.tickleDate! }
    case 'reference':
    case 'someday':
      return { kind: state.disposition, text: state.text, area: state.area }
  }
  return {
    kind: 'actionable',
    area: state.area,
    project: state.project,
    doneActions: state.doneActions,
    next: state.next ? { ...state.next, title: state.actionTitle } : undefined,
  }
}

/** Fortschritt für die Anzeige (grob, 0–1) */
export function clarifyProgress(step: ClarifyStep): number {
  const order: ClarifyStep[] = ['review', 'actionable', 'multiStep', 'nextAction', 'twoMinutes', 'who', 'area', 'finished']
  const mapped: Partial<Record<ClarifyStep, ClarifyStep>> = {
    notActionable: 'multiStep',
    tickler: 'area',
    project: 'multiStep',
    doNow: 'who',
    projectNext: 'who',
    delegate: 'area',
    schedule: 'area',
    context: 'area',
  }
  const index = order.indexOf(mapped[step] ?? step)
  return index / (order.length - 1)
}
