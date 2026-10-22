import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from './layout/AppShell'
import { ClarifyPage } from './pages/clarify/ClarifyPage'
import { CalendarPage } from './pages/CalendarPage'
import { EngagePage } from './pages/EngagePage'
import { InboxPage } from './pages/InboxPage'
import { NextActionsPage } from './pages/NextActionsPage'
import { PeoplePage } from './pages/PeoplePage'
import { PersonPage } from './pages/PersonPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ReferencePage } from './pages/ReferencePage'
import { SomedayPage } from './pages/SomedayPage'
import { WaitingPage } from './pages/WaitingPage'
import { MorePage } from './pages/MorePage'
import { Placeholder } from './pages/Placeholder'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Placeholder title="Start" />} />
          <Route path="eingang" element={<InboxPage />} />
          <Route path="klaeren" element={<ClarifyPage />} />
          <Route path="naechste-schritte" element={<NextActionsPage />} />
          <Route path="jetzt" element={<EngagePage />} />
          <Route path="projekte" element={<ProjectsPage />} />
          <Route path="projekte/:id" element={<ProjectDetailPage />} />
          <Route path="warten" element={<WaitingPage />} />
          <Route path="agenden" element={<PeoplePage />} />
          <Route path="agenden/:id" element={<PersonPage />} />
          <Route path="kalender" element={<CalendarPage />} />
          <Route path="irgendwann" element={<SomedayPage />} />
          <Route path="referenz" element={<ReferencePage />} />
          <Route path="rueckblick" element={<Placeholder title="Wochenrückblick" />} />
          <Route path="einstellungen" element={<Placeholder title="Einstellungen" />} />
          <Route path="mehr" element={<MorePage />} />
          <Route path="*" element={<Placeholder title="Seite nicht gefunden" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
