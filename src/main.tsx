import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { DataProvider } from './data/DataProvider'
import { DexieRepository } from './data/dexie/DexieRepository'
import { PrefsProvider } from './state/PrefsProvider'
import './index.css'

// Die einzige Stelle, an der die konkrete Datenschicht gewählt wird
const repository = new DexieRepository()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrefsProvider>
      <DataProvider repository={repository}>
        <App />
      </DataProvider>
    </PrefsProvider>
  </StrictMode>,
)
