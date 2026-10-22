import type { ProjectNotes } from './types'

export const DEFAULT_CONTEXT_NAMES = [
  'Anrufe',
  'Computer',
  'Online',
  'Besorgungen',
  'Büro',
  'Zuhause',
  'Überall',
  'Lesen/Prüfen',
]

export function emptyProjectNotes(): ProjectNotes {
  return { zweck: '', vision: '', brainstorming: '', ordnen: '' }
}
