import { describe, expect, it } from 'vitest'
import type { WeeklyReview } from '../data/types'
import { daysSinceLastReview, isReviewDue, lastReview, REVIEW_STEPS } from './weeklyReview'

const review = (completedAt: string): WeeklyReview => ({ id: completedAt, completedAt, createdAt: completedAt, updatedAt: completedAt })

describe('Wochenrückblick', () => {
  it('ist fällig, wenn es noch keinen gab', () => {
    expect(isReviewDue([], '2026-10-22')).toBe(true)
    expect(daysSinceLastReview([], '2026-10-22')).toBeUndefined()
  })

  it('ist fällig erst nach mehr als 7 Tagen', () => {
    expect(isReviewDue([review('2026-10-15T16:00:00')], '2026-10-22')).toBe(false)
    expect(isReviewDue([review('2026-10-14T16:00:00')], '2026-10-22')).toBe(true)
  })

  it('nimmt den neuesten Rückblick', () => {
    const reviews = [review('2026-10-01T10:00:00'), review('2026-10-20T10:00:00'), review('2026-09-01T10:00:00')]
    expect(lastReview(reviews)?.completedAt).toBe('2026-10-20T10:00:00')
    expect(daysSinceLastReview(reviews, '2026-10-22')).toBe(2)
  })

  it('führt durch Klar werden, Auf Stand kommen und Kreativ werden', () => {
    expect([...new Set(REVIEW_STEPS.map((s) => s.phase))]).toEqual(['klar', 'aktuell', 'kreativ', 'abschluss'])
  })
})
