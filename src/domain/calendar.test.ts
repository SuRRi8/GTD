import { describe, expect, it } from 'vitest'
import type { CalendarEntry } from '../data/types'
import { daysInRange, entriesOnDay, overdueDayTasks, upcomingDays } from './calendar'

const today = '2026-10-22'
const entry = (id: string, date: string, kind: CalendarEntry['kind'], time?: string, doneAt?: string): CalendarEntry => ({
  id,
  title: id,
  area: 'arbeit',
  kind,
  date,
  time,
  doneAt,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
})

describe('Kalender', () => {
  const entries = [
    entry('info', today, 'tagesinfo'),
    entry('spät', today, 'termin', '17:00'),
    entry('früh', today, 'termin', '08:30'),
    entry('aufgabe', today, 'tagesaufgabe'),
    entry('gestern', '2026-10-21', 'termin', '10:00'),
    entry('in14', '2026-11-05', 'tagesinfo'),
    entry('in15', '2026-11-06', 'termin', '09:00'),
  ]

  it('sortiert einen Tag: Termine nach Uhrzeit, dann Tagesaufgaben, dann Tagesinfos', () => {
    expect(entriesOnDay(entries, today).map((e) => e.id)).toEqual(['früh', 'spät', 'aufgabe', 'info'])
  })

  it('zeigt heute und die nächsten 14 Tage', () => {
    const days = upcomingDays(entries, today)
    expect(days.map((d) => d.date)).toEqual([today, '2026-11-05'])
  })

  it('liefert beliebige Zeiträume, z. B. für den Wochenrückblick', () => {
    expect(daysInRange(entries, '2026-10-08', '2026-10-21').map((d) => d.date)).toEqual(['2026-10-21'])
  })

  it('findet nicht erledigte Tagesaufgaben aus der Vergangenheit', () => {
    const list = [
      entry('offen', '2026-10-20', 'tagesaufgabe'),
      entry('erledigt', '2026-10-20', 'tagesaufgabe', undefined, '2026-10-20T12:00:00Z'),
      entry('termin', '2026-10-20', 'termin', '10:00'),
      entry('heute', today, 'tagesaufgabe'),
    ]
    expect(overdueDayTasks(list, today).map((e) => e.id)).toEqual(['offen'])
  })
})
