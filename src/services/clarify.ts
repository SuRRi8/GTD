import { emptyProjectNotes } from '../data/defaults'
import type { GtdRepository } from '../data/repository'
import { toLocalDate } from '../domain/dates'
import type { ClarifyDecision } from '../domain/clarify'

/**
 * Setzt eine Klär-Entscheidung in Datensätze um – atomar:
 * Entweder entsteht alles und der Eintrag verlässt den Eingang, oder nichts passiert.
 */
export async function applyClarifyDecision(
  repo: GtdRepository,
  inboxItemId: string,
  decision: ClarifyDecision,
  now: Date = new Date(),
): Promise<void> {
  await repo.transaction(async () => {
    switch (decision.kind) {
      case 'delete':
        break

      case 'tickler':
        // Bleibt im Eingang, aber bis zum Datum ausgeblendet
        await repo.inbox.update(inboxItemId, { text: decision.text, tickleDate: decision.tickleDate })
        return

      case 'reference':
        await repo.references.add({ title: decision.text, body: '', area: decision.area })
        break

      case 'someday':
        await repo.projects.add({
          title: decision.text,
          outcome: '',
          area: decision.area,
          status: 'irgendwann',
          notes: emptyProjectNotes(),
        })
        break

      case 'actionable': {
        const { area, next } = decision
        let projectId: string | undefined
        if (decision.project) {
          const project = await repo.projects.add({
            title: decision.project.title,
            outcome: decision.project.outcome,
            area,
            status: 'aktiv',
            notes: emptyProjectNotes(),
          })
          projectId = project.id
        }

        for (const title of decision.doneActions) {
          await repo.actions.add({ title, area, projectId, doneAt: now.toISOString() })
        }

        if (next?.kind === 'action') {
          await repo.actions.add({
            title: next.title,
            area,
            projectId,
            contextId: next.contextId,
            agendaPersonId: next.agendaPersonId,
            minutes: next.minutes,
            energy: next.energy,
          })
        } else if (next?.kind === 'waiting') {
          await repo.waiting.add({
            title: next.title,
            area,
            projectId,
            personId: next.personId,
            since: toLocalDate(now),
            followUpOn: next.followUpOn,
          })
        } else if (next?.kind === 'calendar') {
          await repo.calendar.add({
            title: next.title,
            area,
            projectId,
            kind: next.calendarKind,
            date: next.date,
            time: next.time,
          })
        }
        break
      }
    }
    await repo.inbox.remove(inboxItemId)
  })
}

/** Kurze Rückmeldung, was mit dem Eintrag passiert ist */
export function describeDecision(decision: ClarifyDecision): string {
  switch (decision.kind) {
    case 'delete':
      return 'Gelöscht'
    case 'tickler':
      return 'In Wiedervorlage gelegt'
    case 'reference':
      return 'Als Referenz gespeichert'
    case 'someday':
      return 'Auf Irgendwann/Vielleicht gesetzt'
    case 'actionable': {
      const prefix = decision.project ? 'Projekt angelegt · ' : ''
      if (!decision.next) return decision.project ? 'Projekt angelegt' : 'Erledigt'
      if (decision.next.kind === 'waiting') return `${prefix}Auf „Warten auf“ gesetzt`
      if (decision.next.kind === 'calendar') return `${prefix}Im Kalender eingetragen`
      return `${prefix}Nächster Schritt angelegt`
    }
  }
}
