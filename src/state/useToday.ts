import { useEffect, useState } from 'react'
import type { LocalDate } from '../data/types'
import { todayLocal } from '../domain/dates'

/** Heutiges Datum; springt um Mitternacht von selbst weiter */
export function useToday(): LocalDate {
  const [today, setToday] = useState(todayLocal)
  useEffect(() => {
    const timer = setInterval(() => setToday(todayLocal()), 60_000)
    return () => clearInterval(timer)
  }, [])
  return today
}
