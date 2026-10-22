/**
 * Datenmodell der App.
 *
 * Jeder Datensatz trägt `id`, `createdAt`, `updatedAt` und optional `deletedAt`.
 * Gelöschte Datensätze bleiben als „Grabstein“ erhalten, damit eine spätere
 * Synchronisierung Löschungen zwischen Geräten abgleichen kann.
 */

/** ISO-Zeitstempel, z. B. "2026-10-22T08:15:00.000Z" */
export type ISODateTime = string
/** Lokales Datum im Format "YYYY-MM-DD" */
export type LocalDate = string
/** Lokale Uhrzeit im Format "HH:mm" */
export type LocalTime = string

export type Area = 'arbeit' | 'privat'
export type AreaFilter = Area | 'alle'

export interface BaseRecord {
  id: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
  deletedAt?: ISODateTime
}

/** Ungeklärter Eintrag im Eingang. Mit `tickleDate` ist er bis zu diesem Tag ausgeblendet (Wiedervorlage). */
export interface InboxItem extends BaseRecord {
  text: string
  tickleDate?: LocalDate
}

export type ProjectStatus = 'aktiv' | 'irgendwann' | 'erledigt' | 'verworfen'

/** Abschnitte nach dem natürlichen Planungsmodell */
export interface ProjectNotes {
  zweck: string
  vision: string
  brainstorming: string
  ordnen: string
}

export interface Project extends BaseRecord {
  title: string
  /** Ergebnis-Satz: „Erledigt ist es, wenn …“ (bei Irgendwann/Vielleicht noch optional) */
  outcome: string
  area: Area
  status: ProjectStatus
  notes: ProjectNotes
  completedAt?: ISODateTime
}

/** Zeitbedarf in Minuten; 60 steht für „60+“ */
export type Minutes = 5 | 15 | 30 | 60
export type Energy = 'niedrig' | 'mittel' | 'hoch'

/**
 * Nächster Schritt. Ein offener Schritt hat entweder einen Kontext (`contextId`)
 * oder gehört auf die Agenda einer Person (`agendaPersonId`).
 */
export interface NextAction extends BaseRecord {
  title: string
  area: Area
  projectId?: string
  contextId?: string
  agendaPersonId?: string
  minutes?: Minutes
  energy?: Energy
  doneAt?: ISODateTime
}

export interface WaitingFor extends BaseRecord {
  title: string
  area: Area
  personId: string
  projectId?: string
  since: LocalDate
  followUpOn?: LocalDate
  doneAt?: ISODateTime
}

export type CalendarKind = 'termin' | 'tagesaufgabe' | 'tagesinfo'

export interface CalendarEntry extends BaseRecord {
  title: string
  area: Area
  kind: CalendarKind
  date: LocalDate
  /** Nur bei Terminen */
  time?: LocalTime
  projectId?: string
  doneAt?: ISODateTime
}

export interface ReferenceNote extends BaseRecord {
  title: string
  body: string
  url?: string
  area: Area
}

export interface Context extends BaseRecord {
  name: string
  order: number
}

export interface Person extends BaseRecord {
  name: string
}

export interface WeeklyReview extends BaseRecord {
  completedAt: ISODateTime
}

/** Felder, die das Repository selbst setzt */
export type NewRecord<T extends BaseRecord> = Omit<T, keyof BaseRecord>
export type RecordChanges<T extends BaseRecord> = Partial<NewRecord<T>>

export interface CollectionMap {
  inbox: InboxItem
  projects: Project
  actions: NextAction
  waiting: WaitingFor
  calendar: CalendarEntry
  references: ReferenceNote
  contexts: Context
  people: Person
  reviews: WeeklyReview
}

export type CollectionName = keyof CollectionMap

export const COLLECTION_NAMES: CollectionName[] = [
  'inbox',
  'projects',
  'actions',
  'waiting',
  'calendar',
  'references',
  'contexts',
  'people',
  'reviews',
]

/** Alle (nicht gelöschten) Daten auf einen Blick, so wie die Oberfläche sie liest */
export type GtdSnapshot = { [K in CollectionName]: CollectionMap[K][] }

/** Format der JSON-Sicherung */
export interface BackupData {
  app: 'gtd'
  version: 1
  exportedAt: ISODateTime
  data: { [K in CollectionName]: CollectionMap[K][] }
}
