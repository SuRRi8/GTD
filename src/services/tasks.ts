import { emptyProjectNotes } from '../data/defaults'
import type { GtdRepository } from '../data/repository'
import type { Area, NextAction, Project, ProjectStatus } from '../data/types'

/** Hakt einen nächsten Schritt ab */
export async function completeAction(repo: GtdRepository, actionId: string, now = new Date()): Promise<void> {
  await repo.actions.update(actionId, { doneAt: now.toISOString() })
}

export async function reopenAction(repo: GtdRepository, actionId: string): Promise<void> {
  await repo.actions.update(actionId, { doneAt: undefined })
}

export async function completeWaiting(repo: GtdRepository, waitingId: string, now = new Date()): Promise<void> {
  await repo.waiting.update(waitingId, { doneAt: now.toISOString() })
}

export async function reopenWaiting(repo: GtdRepository, waitingId: string): Promise<void> {
  await repo.waiting.update(waitingId, { doneAt: undefined })
}

/**
 * Setzt den Projektstatus. Bei „erledigt“ oder „verworfen“ werden noch offene
 * Schritte und „Warten auf“ des Projekts mit abgeschlossen.
 */
export async function setProjectStatus(
  repo: GtdRepository,
  projectId: string,
  status: ProjectStatus,
  now = new Date(),
): Promise<void> {
  await repo.transaction(async () => {
    const closing = status === 'erledigt' || status === 'verworfen'
    await repo.projects.update(projectId, { status, completedAt: closing ? now.toISOString() : undefined })
    if (!closing) return
    const doneAt = now.toISOString()
    for (const action of await repo.actions.list()) {
      if (action.projectId === projectId && !action.doneAt) await repo.actions.update(action.id, { doneAt })
    }
    for (const entry of await repo.waiting.list()) {
      if (entry.projectId === projectId && !entry.doneAt) await repo.waiting.update(entry.id, { doneAt })
    }
  })
}

/** Löscht ein Projekt samt seinen offenen Schritten und „Warten auf“ (weich) */
export async function deleteProject(repo: GtdRepository, projectId: string): Promise<void> {
  await repo.transaction(async () => {
    for (const action of await repo.actions.list()) {
      if (action.projectId === projectId) await repo.actions.remove(action.id)
    }
    for (const entry of await repo.waiting.list()) {
      if (entry.projectId === projectId) await repo.waiting.remove(entry.id)
    }
    for (const entry of await repo.calendar.list()) {
      if (entry.projectId === projectId) await repo.calendar.update(entry.id, { projectId: undefined })
    }
    await repo.projects.remove(projectId)
  })
}

export interface FirstAction {
  title: string
  contextId?: string
  agendaPersonId?: string
  minutes?: NextAction['minutes']
  energy?: NextAction['energy']
}

/** Legt ein aktives Projekt an, optional gleich mit dem ersten nächsten Schritt */
export async function createProject(
  repo: GtdRepository,
  data: { title: string; outcome: string; area: Area },
  firstAction?: FirstAction,
): Promise<Project> {
  return repo.transaction(async () => {
    const project = await repo.projects.add({ ...data, status: 'aktiv', notes: emptyProjectNotes() })
    if (firstAction) await repo.actions.add({ ...firstAction, projectId: project.id, area: data.area })
    return project
  })
}

/** Irgendwann/Vielleicht → aktives Projekt; verlangt Ergebnis-Satz und einen nächsten Schritt */
export async function activateProject(
  repo: GtdRepository,
  projectId: string,
  outcome: string,
  firstAction: FirstAction,
): Promise<void> {
  if (!outcome.trim()) throw new Error('Ein aktives Projekt braucht einen Ergebnis-Satz.')
  if (!firstAction.title.trim() || !(firstAction.contextId || firstAction.agendaPersonId)) {
    throw new Error('Ein aktives Projekt braucht einen nächsten Schritt mit Kontext.')
  }
  await repo.transaction(async () => {
    const project = await repo.projects.get(projectId)
    if (!project) throw new Error('Projekt nicht gefunden.')
    await repo.projects.update(projectId, { status: 'aktiv', outcome: outcome.trim(), completedAt: undefined })
    await repo.actions.add({ ...firstAction, title: firstAction.title.trim(), projectId, area: project.area })
  })
}
