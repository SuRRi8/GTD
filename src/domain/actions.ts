import type { AreaFilter, Context, NextAction, Person, Project } from '../data/types'
import { sortContexts, sortPeople } from './sorting'

export function filterByArea<T extends { area: string }>(items: T[], filter: AreaFilter): T[] {
  return filter === 'alle' ? items : items.filter((item) => item.area === filter)
}

/**
 * Offene Schritte, die gerade dran sein können: ohne Projekt oder in einem aktiven Projekt.
 * Schritte von Projekten auf Irgendwann/Vielleicht bleiben gespeichert, aber unsichtbar.
 */
export function activeActions(actions: NextAction[], projects: Project[]): NextAction[] {
  const statusById = new Map(projects.map((p) => [p.id, p.status]))
  return actions.filter((action) => {
    if (action.doneAt) return false
    if (!action.projectId) return true
    const status = statusById.get(action.projectId)
    return status === undefined || status === 'aktiv'
  })
}

export interface ActionGroup {
  key: string
  title: string
  kind: 'context' | 'agenda' | 'none'
  actions: NextAction[]
}

const byCreatedAt = (a: NextAction, b: NextAction) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0)

/** Gruppiert nach Kontext (in Kontext-Reihenfolge), dann Agenden pro Person, dann „Ohne Kontext“ */
export function groupByContext(actions: NextAction[], contexts: Context[], people: Person[]): ActionGroup[] {
  const groups: ActionGroup[] = []
  const placed = new Set<string>()

  for (const context of sortContexts(contexts)) {
    const list = actions.filter((a) => a.contextId === context.id)
    list.forEach((a) => placed.add(a.id))
    if (list.length) groups.push({ key: context.id, title: context.name, kind: 'context', actions: list.sort(byCreatedAt) })
  }
  for (const person of sortPeople(people)) {
    const list = actions.filter((a) => a.agendaPersonId === person.id)
    list.forEach((a) => placed.add(a.id))
    if (list.length) groups.push({ key: `agenda-${person.id}`, title: `Agenda: ${person.name}`, kind: 'agenda', actions: list.sort(byCreatedAt) })
  }
  const rest = actions.filter((a) => !placed.has(a.id))
  if (rest.length) groups.push({ key: 'none', title: 'Ohne Kontext', kind: 'none', actions: rest.sort(byCreatedAt) })
  return groups
}
