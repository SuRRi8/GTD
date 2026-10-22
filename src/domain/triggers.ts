import type { Area } from '../data/types'

export interface TriggerGroup {
  title: string
  prompts: string[]
}

/**
 * Gedächtnisstützen zum Kopf-Leeren im Wochenrückblick – frei und gekürzt nach der
 * Idee der „Trigger-Liste“ aus „Getting Things Done“.
 */
export const TRIGGER_LISTS: Record<Area, TriggerGroup[]> = {
  arbeit: [
    { title: 'Projekte', prompts: ['Angefangen, aber nicht abgeschlossen', 'Steht an, ist aber noch nicht gestartet', 'Wollte ich mir „mal ansehen“'] },
    { title: 'Zusagen an andere', prompts: ['Chefin/Chef', 'Kolleginnen und Kollegen', 'Team', 'Kundinnen und Kunden', 'Dienstleister und Partner'] },
    { title: 'Kommunikation', prompts: ['Anrufe', 'E-Mails', 'Nachrichten im Chat', 'Briefe', 'Wer muss von welcher Entscheidung erfahren?'] },
    { title: 'Schreiben und Unterlagen', prompts: ['Berichte', 'Angebote', 'Präsentationen', 'Protokolle', 'Dokumentation'] },
    { title: 'Meetings', prompts: ['Steht bald an – vorbereiten?', 'Muss noch vereinbart werden', 'Muss nachbereitet werden'] },
    { title: 'Finanzen', prompts: ['Budget', 'Rechnungen schreiben oder prüfen', 'Offene Zahlungen', 'Reisekosten und Spesen'] },
    { title: 'Planung', prompts: ['Ziele und Vorhaben', 'Veranstaltungen', 'Dienstreisen', 'Urlaub und Vertretung'] },
    { title: 'Personal und Team', prompts: ['Einstellungen', 'Feedback und Mitarbeitergespräche', 'Einarbeitung', 'Stimmung im Team'] },
    { title: 'Technik und Büro', prompts: ['Computer und Software', 'Handy', 'Ablage und Dateien', 'Büromaterial', 'Arbeitsplatz'] },
    { title: 'Weiterbildung', prompts: ['Etwas lernen oder üben', 'Etwas herausfinden', 'Fachbücher und Artikel', 'Kurse und Konferenzen'] },
    { title: 'Warten auf', prompts: ['Informationen', 'Delegierte Aufgaben', 'Antworten und Freigaben', 'Bestellungen'] },
  ],
  privat: [
    { title: 'Projekte', prompts: ['Angefangen, aber nicht abgeschlossen', 'Steht an', 'Verein, Ehrenamt, Nachbarschaft'] },
    { title: 'Zusagen an andere', prompts: ['Partnerin/Partner', 'Kinder', 'Eltern', 'Freundinnen und Freunde', 'Geliehenes zurückgeben'] },
    { title: 'Kommunikation', prompts: ['Anrufe', 'Nachrichten', 'Karten und Briefe', 'Danke sagen'] },
    { title: 'Anlässe', prompts: ['Geburtstage', 'Jahrestage', 'Feiern und Einladungen', 'Feiertage', 'Urlaub'] },
    { title: 'Familie', prompts: ['Gemeinsame Vorhaben', 'Schule und Kita', 'Verwandte'] },
    { title: 'Haushalt', prompts: ['Reparaturen', 'Renovieren', 'Garten und Balkon', 'Geräte', 'Ausmisten und Aufräumen', 'Vermieter, Nebenkosten'] },
    { title: 'Gesundheit', prompts: ['Ärztin/Arzt, Zahnarzt', 'Vorsorge-Termine', 'Sport und Bewegung', 'Ernährung'] },
    { title: 'Finanzen', prompts: ['Rechnungen', 'Bank', 'Versicherungen', 'Steuern', 'Verträge und Abos'] },
    { title: 'Freizeit', prompts: ['Bücher, Musik, Filme', 'Reisen und Ausflüge', 'Menschen, die ich treffen will', 'Hobbys'] },
    { title: 'Mobilität', prompts: ['Auto', 'Fahrrad', 'Wartung und Reparatur', 'Tickets'] },
    { title: 'Besorgungen', prompts: ['Lebensmittel', 'Geschenke', 'Apotheke', 'Baumarkt', 'Kleidung'] },
    { title: 'Verwaltung und Technik', prompts: ['Behörden und Dokumente', 'Handy und Computer', 'Datensicherung', 'Passwörter'] },
    { title: 'Warten auf', prompts: ['Bestellungen', 'Reparaturen', 'Rückmeldungen'] },
  ],
}
