import type { ReferenceNote } from '../data/types'
import { compareText } from './sorting'

/** Volltextsuche über Titel, Text und Link; alle Suchwörter müssen vorkommen */
export function searchReferences(notes: ReferenceNote[], query: string): ReferenceNote[] {
  const words = query.toLocaleLowerCase('de').split(/\s+/).filter(Boolean)
  return notes
    .filter((note) => {
      const haystack = `${note.title}\n${note.body}\n${note.url ?? ''}`.toLocaleLowerCase('de')
      return words.every((word) => haystack.includes(word))
    })
    .sort((a, b) => compareText(a.title, b.title))
}
