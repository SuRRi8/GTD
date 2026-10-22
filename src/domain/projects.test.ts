import { describe, expect, it } from 'vitest'
import { emptyProjectNotes } from '../data/defaults'
import type { CalendarEntry, NextAction, Project, WaitingFor } from '../data/types'
import { isStalled, openItemsOf, sortActiveProjects, stalledProjects } from './projects'

const base = { createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' }
const today = '2026-10-22'

const project = (id: string, status: Project['status'] = 'aktiv', title = id): Project => ({
  id,
  title,
  outcome: 'fertig',
  area: 'arbeit',
  status,
  notes: emptyProjectNotes(),
  ...base,
})
const action = (projectId: string, extra: Partial<NextAction> = {}): NextAction => ({
  id: `a-${projectId}-${Math.random()}`,
  title: 'Schritt',
  area: 'arbeit',
  projectId,
  contextId: 'c',
  ...base,
  ...extra,
})
const waiting = (projectId: string, extra: Partial<WaitingFor> = {}): WaitingFor => ({
  id: `w-${projectId}`,
  title: 'Antwort',
  area: 'arbeit',
  personId: 'p',
  projectId,
  since: '2026-10-20',
  ...base,
  ...extra,
})
const entry = (projectId: string, extra: Partial<CalendarEntry> = {}): CalendarEntry => ({
  id: `c-${projectId}`,
  title: 'Termin',
  area: 'arbeit',
  kind: 'termin',
  date: '2026-10-25',
  time: '10:00',
  projectId,
  ...base,
  ...extra,
})

const empty = { actions: [], waiting: [], calendar: [] }

describe('Stillstand-Erkennung', () => {
  it('erkennt ein aktives Projekt ohne alles als Stillstand', () => {
    expect(isStalled(project('p'), empty, today)).toBe(true)
  })

  it('ein offener nächster Schritt hält das Projekt in Bewegung', () => {
    expect(isStalled(project('p'), { ...empty, actions: [action('p')] }, today)).toBe(false)
  })

  it('erledigte Schritte zählen nicht', () => {
    expect(isStalled(project('p'), { ...empty, actions: [action('p', { doneAt: '2026-10-21T10:00:00Z' })] }, today)).toBe(true)
  })

  it('Schritte anderer Projekte zählen nicht', () => {
    expect(isStalled(project('p'), { ...empty, actions: [action('anderes')] }, today)).toBe(true)
  })

  it('ein offenes „Warten auf“ genügt', () => {
    expect(isStalled(project('p'), { ...empty, waiting: [waiting('p')] }, today)).toBe(false)
    expect(isStalled(project('p'), { ...empty, waiting: [waiting('p', { doneAt: '2026-10-21T10:00:00Z' })] }, today)).toBe(true)
  })

  it('ein anstehender Termin oder eine Tagesaufgabe genügt, vergangene oder Tagesinfos nicht', () => {
    expect(isStalled(project('p'), { ...empty, calendar: [entry('p')] }, today)).toBe(false)
    expect(isStalled(project('p'), { ...empty, calendar: [entry('p', { date: today, kind: 'tagesaufgabe' })] }, today)).toBe(false)
    expect(isStalled(project('p'), { ...empty, calendar: [entry('p', { date: '2026-10-21' })] }, today)).toBe(true)
    expect(isStalled(project('p'), { ...empty, calendar: [entry('p', { kind: 'tagesinfo' })] }, today)).toBe(true)
    expect(isStalled(project('p'), { ...empty, calendar: [entry('p', { doneAt: '2026-10-22T08:00:00Z' })] }, today)).toBe(true)
  })

  it('nur aktive Projekte können stillstehen', () => {
    for (const status of ['irgendwann', 'erledigt', 'verworfen'] as const) {
      expect(isStalled(project('p', status), empty, today)).toBe(false)
    }
  })

  it('listet alle Projekte im Stillstand', () => {
    const projects = [project('a'), project('b'), project('c', 'erledigt')]
    expect(stalledProjects(projects, { ...empty, actions: [action('a')] }, today).map((p) => p.id)).toEqual(['b'])
  })

  it('sortiert Stillstand nach oben, sonst alphabetisch', () => {
    const projects = [project('1', 'aktiv', 'Website'), project('2', 'aktiv', 'Angebot'), project('3', 'aktiv', 'Umzug'), project('4', 'irgendwann')]
    const data = { ...empty, actions: [action('2'), action('3')] }
    expect(sortActiveProjects(projects, data, today).map((p) => p.title)).toEqual(['Website', 'Angebot', 'Umzug'])
  })

  it('sammelt die offenen Einträge eines Projekts', () => {
    const items = openItemsOf('p', { actions: [action('p'), action('q')], waiting: [waiting('p')], calendar: [entry('p')] }, today)
    expect([items.actions.length, items.waiting.length, items.calendar.length]).toEqual([1, 1, 1])
  })
})
