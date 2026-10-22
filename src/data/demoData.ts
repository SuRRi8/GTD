import { addDays, toLocalDate } from '../domain/dates'
import { DEFAULT_CONTEXT_NAMES, emptyProjectNotes } from './defaults'
import { newId } from './ids'
import type {
  Area,
  BackupData,
  CalendarEntry,
  Context,
  InboxItem,
  NextAction,
  Person,
  Project,
  ReferenceNote,
  WaitingFor,
  WeeklyReview,
} from './types'

/** Beispieldaten zum Ausprobieren – alle Daten relativ zu `now` */
export function buildDemoData(now: Date = new Date()): BackupData {
  const today = toLocalDate(now)
  const at = (daysAgo: number, hour = 9) => {
    const d = new Date(now)
    d.setDate(d.getDate() - daysAgo)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }
  const stamp = (daysAgo: number) => ({ id: newId(), createdAt: at(daysAgo), updatedAt: at(daysAgo) })

  const contexts: Context[] = DEFAULT_CONTEXT_NAMES.map((name, order) => ({ ...stamp(30), name, order }))
  const ctx = (name: string) => contexts.find((c) => c.name === name)!.id

  const person = (name: string): Person => ({ ...stamp(30), name })
  const anna = person('Anna Berger')
  const tom = person('Tom Keller')
  const lisa = person('Lisa')
  const mama = person('Mama')
  const werkstatt = person('Fahrradladen Huber')
  const people = [anna, tom, lisa, mama, werkstatt]

  const project = (title: string, outcome: string, area: Area, status: Project['status'], daysAgo: number, notes = {}): Project => ({
    ...stamp(daysAgo),
    title,
    outcome,
    area,
    status,
    notes: { ...emptyProjectNotes(), ...notes },
  })
  const workshop = project('Kundenworkshop vorbereiten', 'der Workshop am Monatsende ist gelaufen und das Protokoll verschickt', 'arbeit', 'aktiv', 12, {
    zweck: 'Gemeinsames Verständnis mit dem Kunden über die Anforderungen für Phase 2.',
    vision: 'Alle gehen mit einer klaren, priorisierten Liste raus. Kein Folgetermin nötig.',
    brainstorming: '- Agenda\n- Raum mit Whiteboard\n- Vorab-Fragebogen?\n- Catering\n- Moderationskarten',
    ordnen: '1. Agenda mit Anna abstimmen\n2. Raum buchen\n3. Einladung verschicken',
  })
  const website = project('Neue Website live bringen', 'die neue Website ist online und die alte abgeschaltet', 'arbeit', 'aktiv', 20)
  const urlaub = project('Sommerurlaub planen', 'Unterkunft und Anreise für den Sommerurlaub sind gebucht', 'privat', 'aktiv', 8)
  const fahrrad = project('Fahrrad reparieren lassen', 'das Fahrrad fährt wieder sicher', 'privat', 'aktiv', 6)
  const steuer = project('Steuererklärung 2025', 'die Steuererklärung ist beim Finanzamt eingereicht', 'privat', 'aktiv', 25)
  const someday = [
    project('Spanisch lernen', '', 'privat', 'irgendwann', 40),
    project('Tauchschein machen', '', 'privat', 'irgendwann', 60),
    project('Interne Wissensdatenbank aufbauen', '', 'arbeit', 'irgendwann', 15),
  ]
  const done = project('Büroumzug', 'alle sitzen im neuen Büro', 'arbeit', 'erledigt', 50)
  done.completedAt = at(10)
  const projects = [workshop, website, urlaub, fahrrad, steuer, ...someday, done]

  const action = (title: string, area: Area, daysAgo: number, extra: Partial<NextAction> = {}): NextAction => ({
    ...stamp(daysAgo),
    title,
    area,
    ...extra,
  })
  const actions: NextAction[] = [
    action('Agenda-Entwurf für Workshop schreiben', 'arbeit', 3, { projectId: workshop.id, contextId: ctx('Computer'), minutes: 30, energy: 'hoch' }),
    action('Besprechungsraum für den Workshop buchen', 'arbeit', 2, { projectId: workshop.id, contextId: ctx('Online'), minutes: 5, energy: 'niedrig' }),
    action('Ablauf des Workshops besprechen', 'arbeit', 2, { projectId: workshop.id, agendaPersonId: anna.id }),
    action('Rückmeldung zur Gehaltsrunde ansprechen', 'arbeit', 4, { agendaPersonId: tom.id }),
    action('Reisekostenabrechnung September einreichen', 'arbeit', 5, { contextId: ctx('Computer'), minutes: 15, energy: 'niedrig' }),
    action('Herrn Schulz zurückrufen wegen Rechnung', 'arbeit', 1, { contextId: ctx('Anrufe'), minutes: 5, energy: 'mittel' }),
    action('Fachartikel über Barrierefreiheit lesen', 'arbeit', 7, { contextId: ctx('Lesen/Prüfen'), minutes: 30, energy: 'niedrig' }),
    action('Ferienwohnungen an der Ostsee vergleichen', 'privat', 2, { projectId: urlaub.id, contextId: ctx('Online'), minutes: 30, energy: 'mittel' }),
    action('Urlaubszeitraum mit Lisa festlegen', 'privat', 2, { projectId: urlaub.id, agendaPersonId: lisa.id }),
    action('Mama anrufen wegen Geburtstagsfeier', 'privat', 1, { contextId: ctx('Anrufe'), minutes: 15, energy: 'mittel' }),
    action('Glühbirnen für den Flur besorgen', 'privat', 3, { contextId: ctx('Besorgungen'), minutes: 15, energy: 'niedrig' }),
    action('Keller ausmisten: Regal links', 'privat', 9, { contextId: ctx('Zuhause'), minutes: 60, energy: 'hoch' }),
    action('Arzttermin-Bestätigung abheften', 'privat', 1, { contextId: ctx('Zuhause'), minutes: 5, energy: 'niedrig' }),
    action('Altes Hosting kündigen', 'arbeit', 15, { projectId: website.id, contextId: ctx('Computer'), doneAt: at(3) }),
    action('Belege 2025 in einen Ordner sortieren', 'privat', 20, { projectId: steuer.id, contextId: ctx('Zuhause'), doneAt: at(5) }),
  ]

  const waitingEntry = (title: string, area: Area, personId: string, sinceDays: number, extra: Partial<WaitingFor> = {}): WaitingFor => ({
    ...stamp(sinceDays),
    title,
    area,
    personId,
    since: addDays(today, -sinceDays),
    ...extra,
  })
  const waiting: WaitingFor[] = [
    waitingEntry('Kostenvoranschlag für Reparatur', 'privat', werkstatt.id, 6, { projectId: fahrrad.id, followUpOn: addDays(today, -1) }),
    waitingEntry('Freigabe des Budgets für den Workshop', 'arbeit', tom.id, 4, { projectId: workshop.id, followUpOn: addDays(today, 3) }),
    waitingEntry('Präsentationsfolien vom letzten Kundentermin', 'arbeit', anna.id, 9),
  ]

  const entry = (title: string, area: Area, kind: CalendarEntry['kind'], dayOffset: number, extra: Partial<CalendarEntry> = {}): CalendarEntry => ({
    ...stamp(5),
    title,
    area,
    kind,
    date: addDays(today, dayOffset),
    ...extra,
  })
  const calendar: CalendarEntry[] = [
    entry('Team-Meeting', 'arbeit', 'termin', 0, { time: '10:00' }),
    entry('Zahnarzt Dr. Weber', 'privat', 'termin', 0, { time: '17:30' }),
    entry('Angebot an Firma Lange schicken (Frist)', 'arbeit', 'tagesaufgabe', 1),
    entry('Geburtstag Mama', 'privat', 'tagesinfo', 3),
    entry('Kundenworkshop', 'arbeit', 'termin', 9, { time: '09:30', projectId: workshop.id }),
    entry('Müllabfuhr: Gelber Sack', 'privat', 'tagesinfo', 5),
    entry('Quartalsgespräch mit Tom', 'arbeit', 'termin', -4, { time: '14:00' }),
    entry('Reifen wechseln lassen', 'privat', 'termin', 20, { time: '08:00' }),
  ]

  const reference = (title: string, body: string, area: Area, url?: string): ReferenceNote => ({ ...stamp(14), title, body, area, url })
  const references: ReferenceNote[] = [
    reference('WLAN im Büro', 'Netz: Buero-Gast\nPasswort steht auf dem Zettel an der Kaffeemaschine.', 'arbeit'),
    reference('Kundennummer Stadtwerke', 'Kundennummer 4711-0815, Zählernummer im Keller links.', 'privat', 'https://www.example.org/stadtwerke'),
    reference('Styleguide Kunde Lange', 'Primärfarbe Dunkelblau, Schrift Inter. Logo nur auf weißem Grund.', 'arbeit'),
  ]

  const inbox: InboxItem[] = [
    { ...stamp(2), text: 'Idee: Newsletter-Vorlage überarbeiten' },
    { ...stamp(1), text: 'Kita-Elternabend' },
    { ...stamp(0), text: 'Drucker im Büro druckt streifig' },
    { ...stamp(12), text: 'Konzertkarten für Dezember kaufen?', tickleDate: addDays(today, 5) },
  ]

  const reviews: WeeklyReview[] = [{ ...stamp(9), completedAt: at(9, 16) }]

  return {
    app: 'gtd',
    version: 1,
    exportedAt: now.toISOString(),
    data: { inbox, projects, actions, waiting, calendar, references, contexts, people, reviews },
  }
}
