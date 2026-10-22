import type { InboxItem, LocalDate } from '../data/types'

/** Steht der Eintrag heute im Eingang? (Wiedervorlagen erst ab ihrem Datum) */
export function isInInbox(item: InboxItem, today: LocalDate): boolean {
  return !item.tickleDate || item.tickleDate <= today
}

/** Sichtbare Eingangs-Einträge, ältester zuerst */
export function visibleInbox(items: InboxItem[], today: LocalDate): InboxItem[] {
  return items.filter((item) => isInInbox(item, today)).sort(byCreatedAt)
}

/** Wiedervorlagen, die noch in der Zukunft liegen, nächste zuerst */
export function pendingTickler(items: InboxItem[], today: LocalDate): InboxItem[] {
  return items
    .filter((item) => !isInInbox(item, today))
    .sort((a, b) => (a.tickleDate! < b.tickleDate! ? -1 : a.tickleDate! > b.tickleDate! ? 1 : byCreatedAt(a, b)))
}

/** Der Eintrag, den der Klären-Modus als Nächstes zeigt */
export function oldestInboxItem(items: InboxItem[], today: LocalDate): InboxItem | undefined {
  return visibleInbox(items, today)[0]
}

function byCreatedAt(a: InboxItem, b: InboxItem): number {
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
}
