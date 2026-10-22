import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from './layout/AppShell'
import { ClarifyPage } from './pages/clarify/ClarifyPage'
import { InboxPage } from './pages/InboxPage'
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
          <Route path="naechste-schritte" element={<Placeholder title="Nächste Schritte" />} />
          <Route path="jetzt" element={<Placeholder title="Jetzt" />} />
          <Route path="projekte" element={<Placeholder title="Projekte" />} />
          <Route path="warten" element={<Placeholder title="Warten auf" />} />
          <Route path="agenden" element={<Placeholder title="Agenden" />} />
          <Route path="kalender" element={<Placeholder title="Kalender" />} />
          <Route path="irgendwann" element={<Placeholder title="Irgendwann/Vielleicht" />} />
          <Route path="referenz" element={<Placeholder title="Referenz" />} />
          <Route path="rueckblick" element={<Placeholder title="Wochenrückblick" />} />
          <Route path="einstellungen" element={<Placeholder title="Einstellungen" />} />
          <Route path="mehr" element={<MorePage />} />
          <Route path="*" element={<Placeholder title="Seite nicht gefunden" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
