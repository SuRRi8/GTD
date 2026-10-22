import { describe, expect, it } from 'vitest'
import type { ReferenceNote } from '../data/types'
import { searchReferences } from './reference'

const note = (title: string, body = '', url?: string): ReferenceNote => ({
  id: title,
  title,
  body,
  url,
  area: 'privat',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
})

describe('Referenz-Suche', () => {
  const notes = [note('WLAN Büro', 'Passwort am Kühlschrank'), note('Stadtwerke', 'Kundennummer 4711', 'https://stadtwerke.example'), note('Äpfel-Rezept')]

  it('findet in Titel, Text und Link, ohne Groß/Klein zu beachten', () => {
    expect(searchReferences(notes, 'wlan').map((n) => n.title)).toEqual(['WLAN Büro'])
    expect(searchReferences(notes, 'PASSWORT').map((n) => n.title)).toEqual(['WLAN Büro'])
    expect(searchReferences(notes, 'example').map((n) => n.title)).toEqual(['Stadtwerke'])
  })

  it('verlangt alle Suchwörter', () => {
    expect(searchReferences(notes, 'stadtwerke 4711')).toHaveLength(1)
    expect(searchReferences(notes, 'stadtwerke passwort')).toHaveLength(0)
  })

  it('zeigt ohne Suchbegriff alles alphabetisch', () => {
    expect(searchReferences(notes, '  ').map((n) => n.title)).toEqual(['Äpfel-Rezept', 'Stadtwerke', 'WLAN Büro'])
  })
})
