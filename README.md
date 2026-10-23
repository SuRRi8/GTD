# GTD – Getting Things Done

[![CI](https://github.com/SuRRi8/GTD/actions/workflows/ci.yml/badge.svg)](https://github.com/SuRRi8/GTD/actions/workflows/ci.yml)

Eine Web-App, um die GTD-Methode von David Allen für Arbeit und Privatleben umzusetzen:
**Erfassen → Klären → Organisieren → Durchsehen → Erledigen.**

- Ein System für alles: Jeder Eintrag gehört zu **Arbeit** oder **Privat**, oben filterst du global (Alle / Arbeit / Privat).
  Es gibt aber nur **einen** Eingang und **einen** Wochenrückblick.
- Läuft komplett im Browser. Kein Konto, kein Server – die Daten liegen lokal (IndexedDB).
- Installierbar als App (PWA), funktioniert offline, auf Handy und Rechner gleich gut bedienbar.

## Funktionen

| Bereich | Was es kann |
| --- | --- |
| **Erfassen** | „+“ unten rechts (Handy) bzw. Taste **n** / Button (Rechner). Nur ein Textfeld, Enter speichert, das Feld bleibt offen. |
| **Eingang** | Alle ungeklärten Einträge, Zähler als Badge in der Navigation, „Klären starten“. Wiedervorlagen tauchen am Datum wieder auf. |
| **Klären** | Immer nur der älteste Eintrag, Schritt für Schritt: umsetzbar? → Projekt? → nächster physischer Schritt → unter 2 Minuten (mit Timer)? → wer macht es? → Bereich. Kein Überspringen, nur „Klären pausieren“. |
| **Nächste Schritte** | Nach Kontext gruppiert. Abhaken mit einem Tipp; bei Projekt-Schritten fragt die App sofort nach dem nächsten Schritt. |
| **Jetzt** | Kontext (Mehrfachauswahl), verfügbare Zeit und Energie wählen – die App filtert, du entscheidest. |
| **Projekte** | Projekte ohne nächsten Schritt, ohne „Warten auf“ und ohne anstehenden Kalendereintrag stehen als **Stillstand** rot oben. Projektseite mit Ergebnis-Satz, Status und Notizen nach dem natürlichen Planungsmodell. |
| **Warten auf** | Was, von wem, seit wann; optional Nachfass-Datum. Überfällige oben und hervorgehoben. |
| **Agenden** | Pro Person: Gesprächspunkte und „Warten auf“. |
| **Kalender** | Nur die „harte Landschaft“: Termine, Tagesaufgaben, Tagesinfos – heute und die nächsten 14 Tage. Optional mit den Terminen aus **Google Kalender**. |
| **Irgendwann/Vielleicht** | Ideen mit „Aktivieren“ (verlangt Ergebnis-Satz und nächsten Schritt). |
| **Referenz** | Notizen mit Titel, Text und Link, durchsuchbar. |
| **Wochenrückblick** | Geführt in 9 Schritten (Klar werden, Auf Stand kommen, Kreativ werden) mit Trigger-Liste. Ist der letzte Rückblick mehr als 7 Tage her, erinnert die Startseite daran. |
| **Einstellungen** | Kontexte und Personen verwalten, Hell-/Dunkelmodus, JSON-Export/-Import, Demo-Daten, alles löschen. |

## Starten

Voraussetzung: [Node.js](https://nodejs.org/) ab Version 20.19 (empfohlen: 22 LTS, siehe `.nvmrc`).

```bash
npm install        # einmalig: Abhängigkeiten installieren
npm run dev        # Entwicklungsserver starten → http://localhost:5173
```

Zum Ausprobieren: **Einstellungen → Demo-Daten laden**.

Weitere Befehle:

```bash
npm test           # Unit-Tests (Vitest)
npm run build      # Produktionsversion nach dist/ bauen (inkl. Typprüfung)
npm run preview    # gebaute Version lokal ansehen → http://localhost:4173
npm run lint       # Code prüfen (oxlint)
```

## Auf dem Handy im selben WLAN öffnen

1. Am Rechner starten – mit `--host`, damit der Server im Netzwerk erreichbar ist:

   ```bash
   npm run dev:host
   ```

2. Vite zeigt zwei Adressen an, z. B.:

   ```
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.178.23:5173/
   ```

3. Die **Network**-Adresse im Handy-Browser öffnen. Handy und Rechner müssen im selben WLAN sein.

Klappt es nicht? Meist blockiert die Firewall des Rechners eingehende Verbindungen. Erlaube Node.js
den Zugriff im privaten Netzwerk (Windows fragt beim ersten Start nach; macOS: Systemeinstellungen →
Netzwerk → Firewall).

> **Wichtig:** Über `http://192.168…` funktioniert die App, aber **nicht offline und nicht als installierte App**.
> Browser erlauben Service Worker nur über HTTPS (oder `localhost`). Zum Installieren die App
> kostenlos online stellen (nächster Abschnitt).
>
> Die Daten gehören immer zu genau einer Adresse in genau einem Browser. Was du unter der
> WLAN-Adresse einträgst, siehst du unter der Online-Adresse nicht – zum Umziehen
> **Einstellungen → Exportieren** und auf dem anderen Gerät **Importieren**.

## Kostenlos online stellen

Die App ist eine reine statische Website (Ordner `dist/`). Alle Varianten sind kostenlos und liefern
automatisch HTTPS – Voraussetzung für Offline-Betrieb und Installation. Die nötigen Einstellungen liegen
schon im Projekt (`.github/workflows/pages.yml`, `netlify.toml`, `vercel.json`).

### Variante A: GitHub Pages (direkt aus diesem Repository)

Ein GitHub-Workflow baut die App und veröffentlicht sie unter **<https://surri8.github.io/GTD/>**.

1. Auf GitHub im Repository: **Settings → Pages → Build and deployment → Source: „GitHub Actions“** wählen.
2. **Actions → „GitHub Pages“ → Run workflow** → Branch auswählen → **Run workflow**.
3. Nach etwa einer Minute ist die App unter der Adresse oben erreichbar (der Link steht auch im Workflow-Lauf).

Danach veröffentlicht jeder Push auf `main` automatisch eine neue Version.

Meldet der Lauf *„Branch … is not allowed to deploy to github-pages“*, unter
**Settings → Environments → github-pages → Deployment branches** den Branch erlauben
(standardmäßig darf nur der Standard-Branch veröffentlichen).

Die App kommt dabei mit dem Unterpfad `/GTD/` zurecht: Der Workflow baut mit `BASE_PATH=/GTD/` und legt eine
`404.html` an, damit auch Direktlinks wie `/GTD/projekte` funktionieren. Lokal ausprobieren:
`BASE_PATH=/GTD/ npm run build`.

### Variante B: Netlify per Drag & Drop (ohne Git)

1. Lokal bauen: `npm run build`
2. <https://app.netlify.com/drop> öffnen (kostenloses Konto anlegen).
3. Den Ordner **`dist`** in das Browserfenster ziehen.
4. Fertig – Netlify zeigt eine Adresse wie `https://dein-name.netlify.app`. Unter
   *Site configuration → Change site name* kannst du den Namen ändern.

Für ein Update erneut bauen und `dist` auf der Seite der Website unter *Deploys* hineinziehen.

### Variante C: Netlify mit GitHub (automatische Updates)

1. Bei <https://app.netlify.com> anmelden → **Add new site → Import an existing project → GitHub**.
2. Dieses Repository wählen und den Branch, den du veröffentlichen willst (z. B. `main` oder den Entwicklungs-Branch).
3. Build-Einstellungen werden aus `netlify.toml` übernommen (`npm run build`, Ordner `dist`). **Deploy** klicken.

Jeder Push auf den Branch veröffentlicht automatisch eine neue Version.

### Variante D: Vercel

1. Bei <https://vercel.com/new> mit GitHub anmelden und das Repository importieren.
2. Vercel erkennt Vite automatisch; `vercel.json` sorgt dafür, dass alle Seiten (z. B. `/projekte/…`) funktionieren.
3. **Deploy** klicken → Adresse wie `https://gtd-dein-name.vercel.app`.

Alternativ ohne GitHub über die Kommandozeile: `npx vercel` im Projektordner (beim ersten Mal Konto verknüpfen),
für die Produktivadresse `npx vercel --prod`.

## Auf dem Handy installieren

Online-Adresse (HTTPS) auf dem Handy öffnen, dann:

- **iPhone/iPad (Safari):** Teilen-Symbol → **Zum Home-Bildschirm**.
- **Android (Chrome):** Menü ⋮ → **App installieren** (oder „Zum Startbildschirm hinzufügen“).

Danach startet die App wie eine normale App im Vollbild und funktioniert auch ohne Netz.
Neue Versionen werden beim nächsten Öffnen automatisch übernommen.

## Google Kalender verbinden (optional)

Die App kann deine Google-Termine im Kalender, auf der Startseite und im Wochenrückblick anzeigen und neue
Termine direkt in Google eintragen. Die Verbindung läuft **direkt vom Browser zu Google** – ohne Server
dazwischen. Dafür brauchst du einmalig eine kostenlose „OAuth-Client-ID“ aus der Google Cloud (ca. 15 Minuten).

### 1. Google-Cloud-Projekt anlegen

1. <https://console.cloud.google.com> öffnen, mit deinem Google-Konto anmelden.
2. Oben auf die Projektauswahl → **Neues Projekt** → Name z. B. „GTD“ → **Erstellen**, dann das Projekt auswählen.
3. **APIs und Dienste → Bibliothek** → nach **„Google Calendar API“** suchen → **Aktivieren**.

### 2. Anmeldung einrichten (Zustimmungsbildschirm)

Der Menüpunkt heißt **„Google Auth Platform“** (früher „OAuth-Zustimmungsbildschirm“).

1. **Branding** bzw. *Erste Schritte*: App-Name „GTD“, deine E-Mail als Support-Adresse.
2. **Zielgruppe:** **Extern** wählen. Die App bleibt im Status *Testen* – das reicht für dich allein.
3. Unter **Testnutzer** deine eigene Google-Adresse hinzufügen (nur Testnutzer können sich anmelden).

### 3. Client-ID erstellen

1. **Clients** (bzw. *Anmeldedaten*) → **Client erstellen** → Anwendungstyp **Webanwendung**.
2. Unter **Autorisierte JavaScript-Quellen** eintragen – ohne Pfad und ohne Schrägstrich am Ende:
   - `https://surri8.github.io` (GitHub Pages)
   - `http://localhost:5173` (zum Entwickeln, optional)
   - ggf. deine Netlify-/Vercel-Adresse, z. B. `https://dein-name.netlify.app`
3. **Erstellen** und die **Client-ID** kopieren (endet auf `.apps.googleusercontent.com`).
   Ein Client-Secret wird nicht gebraucht.

Die genaue Quelle für das aktuelle Gerät zeigt die App auch unter *Einstellungen → Google Kalender* an.

### 4. Client-ID in der App hinterlegen

Entweder **einmal für alle Geräte** (empfohlen):

- Auf GitHub: **Settings → Secrets and variables → Actions → Variables → New repository variable**,
  Name `GOOGLE_CLIENT_ID`, Wert = die Client-ID. Danach den Workflow „GitHub Pages“ neu starten.
- Lokal: Datei `.env.local` mit `VITE_GOOGLE_CLIENT_ID=…` anlegen (wird nicht eingecheckt).

Oder **pro Gerät:** in der App unter *Einstellungen → Google Kalender* die Client-ID einfügen.

### 5. Verbinden

1. *Einstellungen → Google Kalender → **Mit Google verbinden***.
2. Google-Konto wählen. Der Hinweis *„Google hat diese App nicht überprüft“* ist normal (deine eigene App im
   Testmodus) → **Weiter** → Kalenderzugriff erlauben.
3. Kalender auswählen und jeweils **Arbeit**, **Privat** oder **Beide** zuordnen – danach richtet sich der Bereichsfilter.
4. Optional: **„Neue Termine aus der App eintragen in“** einen Kalender wählen. Dann landen Termine aus dem Klären
   und dem Kalender direkt in Google (Dauer 1 Stunde). Bestehende Einträge lassen sich über „Nach Google
   Kalender übertragen“ verschieben.

### Gut zu wissen

- **Verbindungsdauer:** Ohne Server gibt Google nur Zugriff für etwa eine Stunde. Danach zeigt die App den zuletzt
  geladenen Stand (auch offline); **Aktualisieren** im Kalender öffnet kurz das Google-Fenster.
- **Bearbeiten in Google:** Google-Termine sind in der App nur zu sehen. Ändern oder löschen in Google Kalender
  („In Google Kalender öffnen“).
- **Projekte:** Termine, die die App mit Projektbezug in Google anlegt, zählen als nächster Schritt – das Projekt
  steht dann nicht im Stillstand.
- **Nur über HTTPS oder localhost:** Über die WLAN-Adresse `http://192.168…` lässt Google keine Anmeldung zu.
- **Datenschutz:** Die App fragt nur Kalenderrechte an. Das Zugriffstoken liegt nur im Sitzungsspeicher des Browsers,
  die geladenen Termine auf dem Gerät. *Trennen* entzieht den Zugriff und löscht die Termine aus der App.

## Daten und Sicherung

- Alle Daten liegen nur im Browser des jeweiligen Geräts (IndexedDB). Es gibt keine Synchronisierung.
- **Einstellungen → Exportieren** speichert alles als JSON-Datei; **Importieren** spielt sie wieder ein
  (ersetzt die aktuellen Daten). Exportiere regelmäßig – etwa beim Wochenrückblick.
- Browser-Daten löschen oder „Website-Daten entfernen“ löscht auch die App-Daten.
- iOS kann Daten von Websites, die lange nicht geöffnet wurden, entfernen. Als installierte App
  ist das deutlich seltener – trotzdem regelmäßig exportieren.

## Aufbau des Codes

```
src/
  data/        Datenmodell (types.ts), Repository-Schnittstelle, Dexie-Umsetzung,
               DataProvider (aktueller Schnappschuss aller Daten), Sicherung, Demo-Daten
  domain/      reine, getestete GTD-Logik: Klären-Ablauf (Reducer), Stillstand,
               Wiedervorlage, Jetzt-Filter, Kalender, Warten auf, Wochenrückblick
  services/    Schreibvorgänge über das Repository (Klär-Entscheidung, Abhaken, Projekte)
  components/  wiederverwendbare Bausteine (Dialoge, Listenzeilen, Auswahlfelder)
  layout/      App-Rahmen, Navigation, Erfassen, Rückmeldungen, Abhaken mit Projekt-Nachfrage
  pages/       eine Datei (oder ein Ordner) pro Ansicht
  integrations/google/
               Google Kalender: Anmeldung (Google Identity Services), Calendar-API,
               Umrechnung der Termine, Provider mit Zwischenspeicher, Einstellungen
  state/       Geräte-Einstellungen (Bereichsfilter, Theme) in localStorage
```

**Datenschicht:** Die Oberfläche greift nur über die Schnittstelle `GtdRepository`
(`src/data/repository.ts`) auf Daten zu. Heute steckt `DexieRepository` (IndexedDB) dahinter.
Jeder Datensatz hat `id`, `createdAt`, `updatedAt` und `deletedAt` (gelöschte Einträge bleiben als
„Grabstein“ erhalten). Damit lässt sich später eine Synchronisierung (z. B. Supabase) als weitere
Umsetzung der Schnittstelle ergänzen, ohne die Oberfläche umzubauen. Die konkrete Umsetzung wird
an genau einer Stelle gewählt: `src/main.tsx`.

**Google Kalender:** Google-Termine werden nicht in der Datenschicht gespeichert, sondern nur auf dem Gerät
zwischengespeichert und beim Lesen dazugemischt (`usePlanningData`). Sicherung und Repository bleiben dadurch
unabhängig von Google.

**Tests:** Die Kernlogik ist mit Unit-Tests abgedeckt (`npm test`), u. a. alle Pfade des
Klären-Ablaufs, die Stillstand-Erkennung, die Wiedervorlage, der Jetzt-Filter, Projekt-Aktivierung,
Sicherung, das Repository (mit `fake-indexeddb`) sowie Umrechnung und API-Zugriff für Google Kalender.

**GitHub Actions:** `.github/workflows/ci.yml` prüft jeden Push und Pull Request (Lint, Tests, Typprüfung,
Build). `.github/workflows/pages.yml` veröffentlicht auf GitHub Pages (siehe oben).

## Bewusst (noch) nicht enthalten

Synchronisierung zwischen Geräten, Login, Abgleich mit Google Kalender im Hintergrund (heute: Anzeige und Eintragen,
solange die App offen ist), Outlook-Kalender, E-Mail-Weiterleitung
in den Eingang, KI-Vorschläge beim Klären, Horizonte 2–5 (Verantwortungsbereiche, Ziele, Vision, Zweck),
wiederverwendbare Checklisten, Benachrichtigungen. Das Datenmodell ist so angelegt, dass diese Punkte
später als neue Tabellen bzw. Felder ergänzt werden können (Dexie-Schemaversionen).

## Technik

Vite · React · TypeScript · Tailwind CSS · Dexie (IndexedDB) · React Router · vite-plugin-pwa (Workbox) · Vitest
