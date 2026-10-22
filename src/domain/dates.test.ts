import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, formatDay, formatSince, isValidLocalDate } from './dates'

describe('dates', () => {
  it('rechnet über Monats- und Jahresgrenzen', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(daysBetween('2026-10-20', '2026-10-22')).toBe(2)
    expect(daysBetween('2026-10-22', '2026-10-20')).toBe(-2)
  })

  it('ist unempfindlich gegen Zeitumstellung', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  })

  it('beschriftet Tage relativ', () => {
    expect(formatDay('2026-10-22', '2026-10-22')).toBe('Heute')
    expect(formatDay('2026-10-23', '2026-10-22')).toBe('Morgen')
    expect(formatDay('2026-10-21', '2026-10-22')).toBe('Gestern')
    expect(formatSince('2026-10-19', '2026-10-22')).toBe('seit 3 Tagen')
    expect(formatSince('2026-10-21', '2026-10-22')).toBe('seit gestern')
  })

  it('prüft Datumsangaben', () => {
    expect(isValidLocalDate('2026-02-29')).toBe(false)
    expect(isValidLocalDate('2028-02-29')).toBe(true)
    expect(isValidLocalDate('22.10.2026')).toBe(false)
  })
})
