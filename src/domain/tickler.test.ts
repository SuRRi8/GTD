import { describe, expect, it } from 'vitest'
import type { InboxItem } from '../data/types'
import { isInInbox, oldestInboxItem, pendingTickler, visibleInbox } from './tickler'

const item = (id: string, createdAt: string, tickleDate?: string): InboxItem => ({
  id,
  text: id,
  createdAt,
  updatedAt: createdAt,
  tickleDate,
})

describe('Wiedervorlage', () => {
  const items = [
    item('neu', '2026-10-21T10:00:00Z'),
    item('alt', '2026-10-01T10:00:00Z'),
    item('morgen', '2026-09-01T10:00:00Z', '2026-10-23'),
    item('heute', '2026-09-15T10:00:00Z', '2026-10-22'),
    item('übermorgen', '2026-09-02T10:00:00Z', '2026-10-24'),
  ]

  it('blendet Einträge bis zum Wiedervorlagedatum aus', () => {
    expect(isInInbox(items[2], '2026-10-22')).toBe(false)
    expect(isInInbox(items[2], '2026-10-23')).toBe(true)
    expect(isInInbox(items[3], '2026-10-22')).toBe(true)
  })

  it('zeigt sichtbare Einträge, ältester zuerst', () => {
    expect(visibleInbox(items, '2026-10-22').map((i) => i.id)).toEqual(['heute', 'alt', 'neu'])
  })

  it('taucht am Datum wieder im Eingang auf', () => {
    expect(visibleInbox(items, '2026-10-23').map((i) => i.id)).toEqual(['morgen', 'heute', 'alt', 'neu'])
  })

  it('listet anstehende Wiedervorlagen nach Datum', () => {
    expect(pendingTickler(items, '2026-10-22').map((i) => i.id)).toEqual(['morgen', 'übermorgen'])
  })

  it('liefert den ältesten sichtbaren Eintrag für den Klären-Modus', () => {
    expect(oldestInboxItem(items, '2026-10-22')?.id).toBe('heute')
    expect(oldestInboxItem([], '2026-10-22')).toBeUndefined()
  })
})
