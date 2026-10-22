import { describe, expect, it } from 'vitest'
import type { NextAction } from '../data/types'
import { AGENDA_FILTER, engageActions, matchesEngage } from './engage'

const action = (id: string, extra: Partial<NextAction>): NextAction => ({
  id,
  title: id,
  area: 'arbeit',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  ...extra,
})

const actions = [
  action('anruf-kurz', { contextId: 'anrufe', minutes: 5, energy: 'niedrig' }),
  action('anruf-lang', { contextId: 'anrufe', minutes: 30, energy: 'hoch' }),
  action('computer', { contextId: 'computer', minutes: 60, energy: 'mittel' }),
  action('ohne-angaben', { contextId: 'computer' }),
  action('agenda', { agendaPersonId: 'anna', minutes: 15 }),
]
const ids = (list: NextAction[]) => list.map((a) => a.id)

describe('Jetzt-Ansicht', () => {
  it('zeigt ohne Auswahl alles', () => {
    expect(engageActions(actions, { contextIds: [] })).toHaveLength(actions.length)
  })

  it('filtert nach mehreren Kontexten', () => {
    expect(ids(engageActions(actions, { contextIds: ['anrufe', AGENDA_FILTER] }))).toEqual(['anruf-kurz', 'anruf-lang', 'agenda'])
  })

  it('zeigt nur Schritte, die in die verfügbare Zeit passen', () => {
    expect(ids(engageActions(actions, { contextIds: [], availableMinutes: 15 }))).toEqual(['anruf-kurz', 'ohne-angaben', 'agenda'])
  })

  it('„60+“ Minuten schließt nichts aus', () => {
    expect(engageActions(actions, { contextIds: [], availableMinutes: 60 })).toHaveLength(actions.length)
  })

  it('zeigt bei wenig Energie nur passende Schritte', () => {
    expect(ids(engageActions(actions, { contextIds: [], energy: 'niedrig' }))).toEqual(['anruf-kurz', 'ohne-angaben', 'agenda'])
    expect(ids(engageActions(actions, { contextIds: [], energy: 'mittel' }))).not.toContain('anruf-lang')
  })

  it('kombiniert alle Kriterien', () => {
    expect(matchesEngage(actions[0], { contextIds: ['anrufe'], availableMinutes: 5, energy: 'niedrig' })).toBe(true)
    expect(matchesEngage(actions[1], { contextIds: ['anrufe'], availableMinutes: 5, energy: 'niedrig' })).toBe(false)
  })

  it('behält die Reihenfolge bei – keine Sortierung nach Wichtigkeit', () => {
    const reversed = [...actions].reverse()
    expect(ids(engageActions(reversed, { contextIds: [] }))).toEqual(ids(reversed))
  })
})
