import { describe, expect, it } from 'vitest'
import { parseBackup } from './backup'
import { buildDemoData } from './demoData'

describe('Demo-Daten', () => {
  it('sind eine gültige Sicherung mit Inhalten für beide Bereiche', () => {
    const demo = parseBackup(JSON.parse(JSON.stringify(buildDemoData(new Date('2026-10-22T09:00:00')))))
    expect(demo.data.projects.some((p) => p.area === 'arbeit')).toBe(true)
    expect(demo.data.projects.some((p) => p.area === 'privat')).toBe(true)
    expect(demo.data.inbox.length).toBeGreaterThan(0)
  })

  it('verweisen nur auf vorhandene Kontexte, Personen und Projekte', () => {
    const { data } = buildDemoData()
    const ids = (list: { id: string }[]) => new Set(list.map((x) => x.id))
    const contexts = ids(data.contexts)
    const people = ids(data.people)
    const projects = ids(data.projects)
    for (const a of data.actions) {
      if (a.contextId) expect(contexts.has(a.contextId)).toBe(true)
      if (a.agendaPersonId) expect(people.has(a.agendaPersonId)).toBe(true)
      if (a.projectId) expect(projects.has(a.projectId)).toBe(true)
    }
    for (const w of data.waiting) expect(people.has(w.personId)).toBe(true)
  })
})
