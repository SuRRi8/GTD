import { describe, expect, it } from 'vitest'
import type { WaitingFor } from '../data/types'
import { dueWaiting, isFollowUpDue, sortWaiting, waitingDays } from './waiting'

const today = '2026-10-22'
const entry = (id: string, since: string, followUpOn?: string, doneAt?: string): WaitingFor => ({
  id,
  title: id,
  area: 'arbeit',
  personId: 'p',
  since,
  followUpOn,
  doneAt,
  createdAt: `${since}T08:00:00Z`,
  updatedAt: `${since}T08:00:00Z`,
})

describe('Warten auf', () => {
  it('rechnet „seit X Tagen“', () => {
    expect(waitingDays(entry('a', '2026-10-19'), today)).toBe(3)
    expect(waitingDays(entry('a', today), today)).toBe(0)
  })

  it('erkennt fälliges und überfälliges Nachfassen', () => {
    expect(isFollowUpDue(entry('a', '2026-10-01', '2026-10-21'), today)).toBe(true)
    expect(isFollowUpDue(entry('a', '2026-10-01', today), today)).toBe(true)
    expect(isFollowUpDue(entry('a', '2026-10-01', '2026-10-23'), today)).toBe(false)
    expect(isFollowUpDue(entry('a', '2026-10-01'), today)).toBe(false)
    expect(isFollowUpDue(entry('a', '2026-10-01', '2026-10-01', '2026-10-02T00:00:00Z'), today)).toBe(false)
  })

  it('stellt Überfällige nach oben, dann die am längsten Wartenden', () => {
    const list = [
      entry('neu', '2026-10-20'),
      entry('alt', '2026-10-01'),
      entry('fällig-später', '2026-10-15', '2026-10-22'),
      entry('überfällig', '2026-10-18', '2026-10-19'),
      entry('nachfassen-zukunft', '2026-09-01', '2026-11-01'),
      entry('erledigt', '2026-09-01', '2026-10-01', '2026-10-02T00:00:00Z'),
    ]
    expect(sortWaiting(list, today).map((e) => e.id)).toEqual(['überfällig', 'fällig-später', 'nachfassen-zukunft', 'alt', 'neu'])
    expect(dueWaiting(list, today).map((e) => e.id)).toEqual(['überfällig', 'fällig-später'])
  })
})
