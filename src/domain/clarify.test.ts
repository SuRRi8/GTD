import { describe, expect, it } from 'vitest'
import { clarifyReducer, decisionOf, initClarify, type ClarifyEvent, type ClarifyState } from './clarify'

function run(text: string, events: ClarifyEvent[], lastArea: 'arbeit' | 'privat' = 'arbeit'): ClarifyState {
  return events.reduce(clarifyReducer, initClarify(text, lastArea))
}

describe('Klären: nicht umsetzbar', () => {
  it('löscht ohne weitere Fragen', () => {
    const state = run('Werbeprospekt', [
      { type: 'CONFIRM_TEXT', text: 'Werbeprospekt' },
      { type: 'ACTIONABLE', answer: false },
      { type: 'DISPOSE', disposition: 'delete' },
    ])
    expect(state.step).toBe('finished')
    expect(decisionOf(state)).toEqual({ kind: 'delete' })
  })

  it('speichert als Referenz mit Bereich', () => {
    const state = run('WLAN-Passwort Büro', [
      { type: 'CONFIRM_TEXT', text: 'WLAN-Passwort Büro' },
      { type: 'ACTIONABLE', answer: false },
      { type: 'DISPOSE', disposition: 'reference' },
      { type: 'CHOOSE_AREA', area: 'arbeit' },
    ])
    expect(decisionOf(state)).toEqual({ kind: 'reference', text: 'WLAN-Passwort Büro', area: 'arbeit' })
  })

  it('legt auf Irgendwann/Vielleicht', () => {
    const state = run('Tauchkurs', [
      { type: 'CONFIRM_TEXT', text: 'Tauchkurs machen' },
      { type: 'ACTIONABLE', answer: false },
      { type: 'DISPOSE', disposition: 'someday' },
      { type: 'CHOOSE_AREA', area: 'privat' },
    ])
    expect(decisionOf(state)).toEqual({ kind: 'someday', text: 'Tauchkurs machen', area: 'privat' })
  })

  it('legt in die Wiedervorlage mit gültigem Datum', () => {
    let state = run('Konzertkarten', [
      { type: 'CONFIRM_TEXT', text: 'Konzertkarten' },
      { type: 'ACTIONABLE', answer: false },
      { type: 'DISPOSE', disposition: 'tickler' },
      { type: 'SET_TICKLE_DATE', date: 'kein Datum' },
    ])
    expect(state.step).toBe('tickler')
    expect(state.error).toBeDefined()
    state = clarifyReducer(state, { type: 'SET_TICKLE_DATE', date: '2026-11-15' })
    expect(decisionOf(state)).toEqual({ kind: 'tickler', text: 'Konzertkarten', tickleDate: '2026-11-15' })
  })
})

describe('Klären: einzelner nächster Schritt', () => {
  const start: ClarifyEvent[] = [
    { type: 'CONFIRM_TEXT', text: 'Angebot' },
    { type: 'ACTIONABLE', answer: true },
    { type: 'MULTI_STEP', answer: false },
  ]

  it('fragt bei nur einem Wort sanft nach und lässt Umformulieren zu', () => {
    let state = run('Angebot', [...start, { type: 'DEFINE_ACTION', title: 'Angebot' }])
    expect(state.step).toBe('nextAction')
    expect(state.oneWordWarning).toBe(true)

    state = clarifyReducer(state, { type: 'DEFINE_ACTION', title: 'Anna anrufen wegen Angebot' })
    expect(state.step).toBe('twoMinutes')
    expect(state.oneWordWarning).toBe(false)
    expect(state.actionTitle).toBe('Anna anrufen wegen Angebot')
  })

  it('übernimmt ein Wort, wenn ausdrücklich gewollt', () => {
    const state = run('Angebot', [
      ...start,
      { type: 'DEFINE_ACTION', title: 'Staubsaugen' },
      { type: 'DEFINE_ACTION', title: 'Staubsaugen', force: true },
    ])
    expect(state.step).toBe('twoMinutes')
  })

  it('erledigt Zwei-Minuten-Aufgaben sofort, ohne weitere Fragen', () => {
    const state = run('Termin bestätigen', [
      { type: 'CONFIRM_TEXT', text: 'Termin bestätigen' },
      { type: 'ACTIONABLE', answer: true },
      { type: 'MULTI_STEP', answer: false },
      { type: 'DEFINE_ACTION', title: 'Zahnarzt-Termin per Mail bestätigen' },
      { type: 'TWO_MINUTES', answer: true },
      { type: 'DONE_NOW' },
    ])
    expect(decisionOf(state)).toEqual({
      kind: 'actionable',
      area: 'arbeit',
      project: undefined,
      doneActions: ['Zahnarzt-Termin per Mail bestätigen'],
      next: undefined,
    })
  })

  it('verlangt einen Kontext und übernimmt Zeit und Energie', () => {
    let state = run('Angebot', [
      ...start,
      { type: 'DEFINE_ACTION', title: 'Anna anrufen wegen Angebot' },
      { type: 'TWO_MINUTES', answer: false },
      { type: 'WHO', answer: 'me' },
      { type: 'ASSIGN_CONTEXT' },
    ])
    expect(state.step).toBe('context')
    expect(state.error).toBeDefined()

    state = clarifyReducer(state, { type: 'ASSIGN_CONTEXT', contextId: 'anrufe', minutes: 15, energy: 'niedrig' })
    state = clarifyReducer(state, { type: 'CHOOSE_AREA', area: 'arbeit' })
    expect(decisionOf(state)).toEqual({
      kind: 'actionable',
      area: 'arbeit',
      project: undefined,
      doneActions: [],
      next: { kind: 'action', title: 'Anna anrufen wegen Angebot', contextId: 'anrufe', agendaPersonId: undefined, minutes: 15, energy: 'niedrig' },
    })
  })

  it('kann einen Schritt auf die Agenda einer Person legen', () => {
    const state = run('Urlaub', [
      { type: 'CONFIRM_TEXT', text: 'Urlaub' },
      { type: 'ACTIONABLE', answer: true },
      { type: 'MULTI_STEP', answer: false },
      { type: 'DEFINE_ACTION', title: 'Urlaubsplanung mit Chefin besprechen' },
      { type: 'TWO_MINUTES', answer: false },
      { type: 'WHO', answer: 'me' },
      { type: 'ASSIGN_CONTEXT', agendaPersonId: 'chefin' },
      { type: 'CHOOSE_AREA', area: 'arbeit' },
    ])
    const decision = decisionOf(state)
    expect(decision?.kind === 'actionable' && decision.next).toMatchObject({ kind: 'action', agendaPersonId: 'chefin' })
  })

  it('delegiert an eine Person mit optionalem Nachfass-Datum', () => {
    const state = run('Bericht', [
      ...start,
      { type: 'DEFINE_ACTION', title: 'Quartalsbericht von Tom' },
      { type: 'TWO_MINUTES', answer: false },
      { type: 'WHO', answer: 'other' },
      { type: 'DELEGATE', personId: 'tom', followUpOn: '2026-10-29' },
      { type: 'CHOOSE_AREA', area: 'arbeit' },
    ])
    const decision = decisionOf(state)
    expect(decision?.kind === 'actionable' && decision.next).toEqual({
      kind: 'waiting',
      title: 'Quartalsbericht von Tom',
      personId: 'tom',
      followUpOn: '2026-10-29',
    })
  })

  it('verlangt für Termine eine Uhrzeit, für Tagesaufgaben nicht', () => {
    const base: ClarifyEvent[] = [
      ...start,
      { type: 'DEFINE_ACTION', title: 'Reifenwechsel in der Werkstatt' },
      { type: 'TWO_MINUTES', answer: false },
      { type: 'WHO', answer: 'calendar' },
    ]
    const withoutTime = run('x', [...base, { type: 'SCHEDULE', calendarKind: 'termin', date: '2026-10-30' }])
    expect(withoutTime.step).toBe('schedule')
    expect(withoutTime.error).toBeDefined()

    const termin = run('x', [...base, { type: 'SCHEDULE', calendarKind: 'termin', date: '2026-10-30', time: '08:30' }])
    expect(termin.step).toBe('area')
    expect(termin.next).toEqual({ kind: 'calendar', calendarKind: 'termin', date: '2026-10-30', time: '08:30' })

    const task = run('x', [...base, { type: 'SCHEDULE', calendarKind: 'tagesaufgabe', date: '2026-10-30', time: '08:30' }])
    expect(task.next).toEqual({ kind: 'calendar', calendarKind: 'tagesaufgabe', date: '2026-10-30', time: undefined })
  })

  it('merkt sich, ob der Termin in Google eingetragen werden soll', () => {
    const state = run('x', [
      ...start,
      { type: 'DEFINE_ACTION', title: 'Reifenwechsel in der Werkstatt' },
      { type: 'TWO_MINUTES', answer: false },
      { type: 'WHO', answer: 'calendar' },
      { type: 'SCHEDULE', calendarKind: 'termin', date: '2026-10-30', time: '08:30', target: 'google' },
      { type: 'CHOOSE_AREA', area: 'privat' },
    ])
    const decision = decisionOf(state)
    expect(decision?.kind === 'actionable' && decision.next).toMatchObject({ kind: 'calendar', target: 'google' })
  })

  it('wechselt bei abgelaufenem Timer zur Planung', () => {
    const state = run('x', [
      ...start,
      { type: 'DEFINE_ACTION', title: 'Rechnung heraussuchen' },
      { type: 'TWO_MINUTES', answer: true },
      { type: 'DEFER' },
    ])
    expect(state.step).toBe('who')
  })
})

describe('Klären: Projekte', () => {
  const projectStart: ClarifyEvent[] = [
    { type: 'CONFIRM_TEXT', text: 'Sommerfest' },
    { type: 'ACTIONABLE', answer: true },
    { type: 'MULTI_STEP', answer: true },
  ]

  it('verlangt einen Ergebnis-Satz', () => {
    const state = run('Sommerfest', [...projectStart, { type: 'DEFINE_PROJECT', title: 'Sommerfest', outcome: '  ' }])
    expect(state.step).toBe('project')
    expect(state.error).toMatch(/erledigt/)
  })

  it('legt Projekt und ersten Schritt an; Projektname ist kein Schrittvorschlag', () => {
    let state = run('Sommerfest', [
      ...projectStart,
      { type: 'DEFINE_PROJECT', title: 'Sommerfest organisieren', outcome: 'das Fest hat stattgefunden' },
    ])
    expect(state.step).toBe('nextAction')
    expect(state.actionTitle).toBe('')

    state = [
      { type: 'DEFINE_ACTION', title: 'Termine mit Team abstimmen' },
      { type: 'TWO_MINUTES', answer: false },
      { type: 'WHO', answer: 'me' },
      { type: 'ASSIGN_CONTEXT', contextId: 'computer' },
      { type: 'CHOOSE_AREA', area: 'arbeit' },
    ].reduce((s, e) => clarifyReducer(s, e as ClarifyEvent), state)

    expect(decisionOf(state)).toEqual({
      kind: 'actionable',
      area: 'arbeit',
      project: { title: 'Sommerfest organisieren', outcome: 'das Fest hat stattgefunden' },
      doneActions: [],
      next: { kind: 'action', title: 'Termine mit Team abstimmen', contextId: 'computer', agendaPersonId: undefined, minutes: undefined, energy: undefined },
    })
  })

  it('fragt nach einem sofort erledigten Projektschritt nach dem nächsten', () => {
    let state = run('Sommerfest', [
      ...projectStart,
      { type: 'DEFINE_PROJECT', title: 'Sommerfest', outcome: 'Fest war schön' },
      { type: 'DEFINE_ACTION', title: 'Raum per Mail anfragen' },
      { type: 'TWO_MINUTES', answer: true },
      { type: 'DONE_NOW' },
    ])
    expect(state.step).toBe('projectNext')
    expect(state.history).toEqual([])

    state = clarifyReducer(state, { type: 'PROJECT_NEXT', choice: 'another' })
    expect(state.step).toBe('nextAction')
    expect(state.actionTitle).toBe('')
  })

  it('„Später entscheiden“ legt das Projekt ohne nächsten Schritt an', () => {
    const state = run('Sommerfest', [
      ...projectStart,
      { type: 'DEFINE_PROJECT', title: 'Sommerfest', outcome: 'Fest war schön' },
      { type: 'DEFINE_ACTION', title: 'Raum per Mail anfragen' },
      { type: 'TWO_MINUTES', answer: true },
      { type: 'DONE_NOW' },
      { type: 'PROJECT_NEXT', choice: 'later' },
      { type: 'CHOOSE_AREA', area: 'privat' },
    ])
    expect(decisionOf(state)).toEqual({
      kind: 'actionable',
      area: 'privat',
      project: { title: 'Sommerfest', outcome: 'Fest war schön' },
      doneActions: ['Raum per Mail anfragen'],
      next: undefined,
    })
  })
})

describe('Klären: Bedienung', () => {
  it('übernimmt umformulierten Text als Vorschlag für den Schritt', () => {
    const state = run('anruf anna', [{ type: 'CONFIRM_TEXT', text: 'Anna anrufen wegen Angebot' }])
    expect(state.text).toBe('Anna anrufen wegen Angebot')
    expect(state.actionTitle).toBe('Anna anrufen wegen Angebot')
  })

  it('geht Schritt für Schritt zurück und vergisst eine verworfene Entscheidung', () => {
    let state = run('x', [
      { type: 'CONFIRM_TEXT', text: 'x' },
      { type: 'ACTIONABLE', answer: false },
      { type: 'DISPOSE', disposition: 'reference' },
    ])
    expect(state.step).toBe('area')
    state = clarifyReducer(state, { type: 'BACK' })
    state = clarifyReducer(state, { type: 'BACK' })
    expect(state.step).toBe('actionable')
    state = clarifyReducer(state, { type: 'ACTIONABLE', answer: true })
    expect(state.disposition).toBeUndefined()
  })

  it('verwendet den zuletzt gewählten Bereich als Vorauswahl', () => {
    expect(initClarify('x', 'privat').area).toBe('privat')
  })

  it('ignoriert Ereignisse, die nicht zum Schritt passen', () => {
    const state = initClarify('x', 'arbeit')
    expect(clarifyReducer(state, { type: 'DONE_NOW' })).toBe(state)
  })
})
