import type { LocalDate, WaitingFor } from '../data/types'
import { daysBetween } from './dates'

/** Nachfassen ist fällig (heute) oder überfällig */
export function isFollowUpDue(entry: WaitingFor, today: LocalDate): boolean {
  return !entry.doneAt && entry.followUpOn !== undefined && entry.followUpOn <= today
}

/** Seit wie vielen Tagen wartest du? */
export function waitingDays(entry: WaitingFor, today: LocalDate): number {
  return Math.max(0, daysBetween(entry.since, today))
}

/** Offene Einträge: fällige zuerst (ältestes Nachfass-Datum oben), dann am längsten wartende */
export function sortWaiting(entries: WaitingFor[], today: LocalDate): WaitingFor[] {
  return entries
    .filter((e) => !e.doneAt)
    .sort((a, b) => {
      const dueA = isFollowUpDue(a, today)
      const dueB = isFollowUpDue(b, today)
      if (dueA !== dueB) return dueA ? -1 : 1
      if (dueA && dueB && a.followUpOn !== b.followUpOn) return a.followUpOn! < b.followUpOn! ? -1 : 1
      return a.since < b.since ? -1 : a.since > b.since ? 1 : a.createdAt.localeCompare(b.createdAt)
    })
}

export function dueWaiting(entries: WaitingFor[], today: LocalDate): WaitingFor[] {
  return sortWaiting(entries, today).filter((e) => isFollowUpDue(e, today))
}
