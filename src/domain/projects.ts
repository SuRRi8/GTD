import type { CalendarEntry, LocalDate, NextAction, Project, WaitingFor } from '../data/types'
import { compareText } from './sorting'

export interface ProjectRelated {
  actions: NextAction[]
  waiting: WaitingFor[]
  calendar: CalendarEntry[]
}

export interface ProjectOpenItems {
  actions: NextAction[]
  waiting: WaitingFor[]
  /** Anstehende Termine und Tagesaufgaben (ab heute, nicht erledigt) */
  calendar: CalendarEntry[]
}

/** Alles, was ein Projekt gerade in Bewegung hält */
export function openItemsOf(projectId: string, data: ProjectRelated, today: LocalDate): ProjectOpenItems {
  return {
    actions: data.actions.filter((a) => a.projectId === projectId && !a.doneAt),
    waiting: data.waiting.filter((w) => w.projectId === projectId && !w.doneAt),
    calendar: data.calendar.filter(
      (c) => c.projectId === projectId && !c.doneAt && c.kind !== 'tagesinfo' && c.date >= today,
    ),
  }
}

export function countOpenItems(items: ProjectOpenItems): number {
  return items.actions.length + items.waiting.length + items.calendar.length
}

/**
 * Stillstand: Ein aktives Projekt ohne offenen nächsten Schritt, ohne offenes
 * „Warten auf“ und ohne anstehenden Kalendereintrag.
 */
export function isStalled(project: Project, data: ProjectRelated, today: LocalDate): boolean {
  return project.status === 'aktiv' && countOpenItems(openItemsOf(project.id, data, today)) === 0
}

export function stalledProjects(projects: Project[], data: ProjectRelated, today: LocalDate): Project[] {
  return projects.filter((p) => isStalled(p, data, today))
}

/** Aktive Projekte: Stillstand zuerst, dann alphabetisch */
export function sortActiveProjects(projects: Project[], data: ProjectRelated, today: LocalDate): Project[] {
  const stalled = new Set(stalledProjects(projects, data, today).map((p) => p.id))
  return projects
    .filter((p) => p.status === 'aktiv')
    .sort((a, b) => Number(stalled.has(b.id)) - Number(stalled.has(a.id)) || compareText(a.title, b.title))
}
