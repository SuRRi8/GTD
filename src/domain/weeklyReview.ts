import type { LocalDate, WeeklyReview } from '../data/types'
import { daysBetween, localDateOf } from './dates'

export type ReviewPhase = 'klar' | 'aktuell' | 'kreativ' | 'abschluss'

export interface ReviewStep {
  id: 'notizen' | 'eingang' | 'kopf' | 'schritte' | 'kalender' | 'warten' | 'projekte' | 'irgendwann' | 'abschluss'
  phase: ReviewPhase
  title: string
  hint: string
}

export const PHASE_LABEL: Record<ReviewPhase, string> = {
  klar: 'Klar werden',
  aktuell: 'Auf Stand kommen',
  kreativ: 'Kreativ werden',
  abschluss: 'Abschluss',
}

export const REVIEW_STEPS: ReviewStep[] = [
  { id: 'notizen', phase: 'klar', title: 'Lose Notizen einsammeln', hint: 'Zettel, Belege, Visitenkarten, Notizen im Handy, Fotos, Sprachnachrichten – alles in den Eingang.' },
  { id: 'eingang', phase: 'klar', title: 'Eingang auf null bringen', hint: 'Jeden Eintrag klären, bis der Eingang leer ist.' },
  { id: 'kopf', phase: 'klar', title: 'Kopf leeren', hint: 'Geh die Stichworte durch. Alles, was dir einfällt, sofort erfassen.' },
  { id: 'schritte', phase: 'aktuell', title: 'Nächste Schritte durchsehen', hint: 'Erledigtes abhaken. Stimmt jede Formulierung noch?' },
  { id: 'kalender', phase: 'aktuell', title: 'Kalender durchsehen', hint: 'Letzte 2 Wochen: Ist noch etwas offen? Nächste 4 Wochen: Was muss vorbereitet werden?' },
  { id: 'warten', phase: 'aktuell', title: '„Warten auf“ durchsehen', hint: 'Ist etwas eingetroffen? Wo solltest du nachfassen?' },
  { id: 'projekte', phase: 'aktuell', title: 'Projekte einzeln durchgehen', hint: 'Hat jedes aktive Projekt einen nächsten Schritt?' },
  { id: 'irgendwann', phase: 'kreativ', title: 'Irgendwann/Vielleicht durchsehen', hint: 'Ist etwas davon jetzt dran? Oder kann etwas weg?' },
  { id: 'abschluss', phase: 'abschluss', title: 'Geschafft', hint: 'Dein System ist auf dem neuesten Stand.' },
]

export function lastReview(reviews: WeeklyReview[]): WeeklyReview | undefined {
  return [...reviews].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]
}

/** Tage seit dem letzten Rückblick (undefined = noch nie) */
export function daysSinceLastReview(reviews: WeeklyReview[], today: LocalDate): number | undefined {
  const last = lastReview(reviews)
  return last ? daysBetween(localDateOf(last.completedAt), today) : undefined
}

/** Hinweis auf der Startseite: noch nie oder mehr als 7 Tage her */
export function isReviewDue(reviews: WeeklyReview[], today: LocalDate): boolean {
  const days = daysSinceLastReview(reviews, today)
  return days === undefined || days > 7
}
