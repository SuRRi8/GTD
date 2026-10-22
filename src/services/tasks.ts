import type { GtdRepository } from '../data/repository'
import type { ProjectStatus } from '../data/types'

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
