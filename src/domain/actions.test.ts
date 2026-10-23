import { describe, expect, it } from 'vitest'
import type { Context, NextAction, Person, Project } from '../data/types'
import { emptyProjectNotes } from '../data/defaults'
import { activeActions, filterByArea, groupByContext } from './actions'

const base = { createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' }
const action = (id: string, extra: Partial<NextAction> = {}): NextAction => ({ id, title: id, area: 'arbeit', ...base, ...extra })
const project = (id: string, status: Project['status']): Project => ({
  id,
  title: id,
  outcome: '',
  area: 'arbeit',
  status,
  notes: emptyProjectNotes(),
  ...base,
})

describe('activeActions', () => {
  it('blendet erledigte Schritte und Schritte inaktiver Projekte aus', () => {
    const projects = [project('aktiv', 'aktiv'), project('später', 'irgendwann')]
    const actions = [
      action('frei'),
      action('erledigt', { doneAt: '2026-10-02T00:00:00Z' }),
      action('im-aktiven', { projectId: 'aktiv' }),
      action('im-irgendwann', { projectId: 'später' }),
    ]
    expect(activeActions(actions, projects).map((a) => a.id)).toEqual(['frei', 'im-aktiven'])
  })
})

describe('groupByContext', () => {
  it('gruppiert nach Kontext-Reihenfolge, dann Agenden, dann ohne Kontext', () => {
    const contexts: Context[] = [
      { id: 'c2', name: 'Computer', order: 1, ...base },
      { id: 'c1', name: 'Anrufe', order: 0, ...base },
    ]
    const people: Person[] = [{ id: 'p1', name: 'Anna', ...base }]
    const actions = [
      action('a', { contextId: 'c2' }),
      action('b', { contextId: 'c1' }),
      action('c', { agendaPersonId: 'p1' }),
      action('d', { contextId: 'gelöscht' }),
    ]
    expect(groupByContext(actions, contexts, people).map((g) => [g.title, g.actions.map((a) => a.id)])).toEqual([
      ['Anrufe', ['b']],
      ['Computer', ['a']],
      ['Agenda: Anna', ['c']],
      ['Ohne Kontext', ['d']],
    ])
  })
})

describe('filterByArea', () => {
  it('filtert nach Bereich, „alle“ zeigt alles', () => {
    const items = [action('a'), action('b', { area: 'privat' })]
    expect(filterByArea(items, 'alle')).toHaveLength(2)
    expect(filterByArea(items, 'privat').map((a) => a.id)).toEqual(['b'])
  })

  it('zeigt Einträge für beide Bereiche unter jedem Filter', () => {
    const items = [{ id: 'gemeinsam', area: 'privat', anyArea: true }, { id: 'privat', area: 'privat' }]
    expect(filterByArea(items, 'arbeit').map((a) => a.id)).toEqual(['gemeinsam'])
  })
})
