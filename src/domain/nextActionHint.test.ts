import { describe, expect, it } from 'vitest'
import { isSingleWord } from './nextActionHint'

describe('isSingleWord', () => {
  it('erkennt ein einzelnes Wort als Thema', () => {
    expect(isSingleWord('Angebot')).toBe(true)
    expect(isSingleWord('  Steuer  ')).toBe(true)
  })

  it('lässt konkrete Handlungen durch', () => {
    expect(isSingleWord('Anna anrufen wegen Angebot')).toBe(false)
    expect(isSingleWord('Steuer\tmachen')).toBe(false)
  })

  it('wertet leere Eingaben nicht als Wort', () => {
    expect(isSingleWord('   ')).toBe(false)
  })
})
