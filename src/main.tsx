import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { DataProvider } from './data/DataProvider'
import { DexieRepository } from './data/dexie/DexieRepository'
import { CaptureProvider } from './layout/CaptureProvider'
import { CompletionProvider } from './layout/CompletionProvider'
import { FeedbackProvider } from './layout/FeedbackProvider'
import { PrefsProvider } from './state/PrefsProvider'
import './index.css'

// Die einzige Stelle, an der die konkrete Datenschicht gewählt wird
const repository = new DexieRepository()

if (import.meta.env.DEV) {
  // Zum Ausprobieren in der Entwicklerkonsole: gtd.repository, gtd.loadDemo()
  void import('./data/demoData').then(({ buildDemoData }) => {
    Object.assign(window, { gtd: { repository, loadDemo: () => repository.importAll(buildDemoData()) } })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrefsProvider>
      <DataProvider repository={repository}>
        <FeedbackProvider>
          <CompletionProvider>
            <CaptureProvider>
              <App />
            </CaptureProvider>
          </CompletionProvider>
        </FeedbackProvider>
      </DataProvider>
    </PrefsProvider>
  </StrictMode>,
)
