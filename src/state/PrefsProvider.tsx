import { useEffect, useMemo, type ReactNode } from 'react'
import { isArea, isAreaFilter, isTheme, PrefsContext, type Prefs } from './prefs'
import { usePersistentState } from './storage'

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [areaFilter, setAreaFilter] = usePersistentState('gtd.areaFilter', 'alle', isAreaFilter)
  const [lastArea, setLastArea] = usePersistentState('gtd.lastArea', 'arbeit', isArea)
  const [theme, setTheme] = usePersistentState('gtd.theme', 'system', isTheme)

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dunkel' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  const value = useMemo<Prefs>(
    () => ({ areaFilter, setAreaFilter, lastArea, setLastArea, theme, setTheme }),
    [areaFilter, setAreaFilter, lastArea, setLastArea, theme, setTheme],
  )
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}
