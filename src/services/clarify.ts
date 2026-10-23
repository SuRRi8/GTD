import { emptyProjectNotes } from '../data/defaults'
import type { GtdRepository } from '../data/repository'
import { toLocalDate } from '../domain/dates'
import type { Area, CalendarKind, LocalDate, LocalTime } from '../data/types'
import type { ClarifyDecision } from '../domain/clarify'

/** Termin, der in einem externen Kalender (Google) angelegt werden soll */
export interface ExternalEventInput {
  title: string
  kind: CalendarKind
  date: LocalDate
  time?: LocalTime
  area: Area
  projectId?: string
}

export interface ClarifyOptions {
  /** Legt den Termin extern an; ohne diese Funktion landet er im eigenen Kalender */
  createExternalEvent?: (event: ExternalEventInput) => Promise<unknown>
}

export interface ClarifyResult {
  projectId?: string
  /** Externer Kalender nicht erreichbar – Termin wurde im eigenen Kalender gespeichert */
  calendarFallback?: boolean
}

/**
 * Setzt eine Klär-Entscheidung in Datensätze um – atomar:
 * Entweder entsteht alles und der Eintrag verlässt den Eingang, oder nichts passiert.
 * Ein Termin für Google wird erst danach angelegt; klappt das nicht, landet er im eigenen Kalender.
 */
export async function applyClarifyDecision(
  repo: GtdRepository,
  inboxItemId: string,
  decision: ClarifyDecision,
  now: Date = new Date(),
  options: ClarifyOptions = {},
): Promise<ClarifyResult> {
  const planned = decision.kind === 'actionable' ? decision.next : undefined
  const external =
    planned?.kind === 'calendar' && planned.target === 'google' && options.createExternalEvent && decision.kind === 'actionable'
      ? { title: planned.title, kind: planned.calendarKind, date: planned.date, time: planned.time, area: decision.area }
      : undefined

  const result = await repo.transaction(async (): Promise<ClarifyResult> => {
    switch (decision.kind) {
      case 'delete':
        break

      case 'tickler':
        // Bleibt im Eingang, aber bis zum Datum ausgeblendet
        await repo.inbox.update(inboxItemId, { text: decision.text, tickleDate: decision.tickleDate })
        return {}

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
        } else if (next?.kind === 'calendar' && !external) {
          await repo.calendar.add({
            title: next.title,
            area,
            projectId,
            kind: next.calendarKind,
            date: next.date,
            time: next.time,
          })
        }
        await repo.inbox.remove(inboxItemId)
        return { projectId }
      }
    }
    await repo.inbox.remove(inboxItemId)
    return {}
  })

  if (external) {
    const event = { ...external, projectId: result.projectId }
    try {
      await options.createExternalEvent!(event)
    } catch {
      await repo.calendar.add({ title: event.title, area: event.area, projectId: event.projectId, kind: event.kind, date: event.date, time: event.time })
      return { ...result, calendarFallback: true }
    }
  }
  return result
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
