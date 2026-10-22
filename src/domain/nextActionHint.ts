/**
 * Ein nächster Schritt ist eine konkrete, sichtbare Handlung („Anna anrufen wegen Angebot“),
 * kein Thema („Angebot“). Ein einzelnes Wort ist fast immer ein Thema.
 */
export function isSingleWord(text: string): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length === 1
}

export const ACTION_VERBS = ['anrufen', 'mailen', 'entwerfen', 'besorgen', 'recherchieren', 'besprechen', 'schreiben', 'prüfen', 'vereinbaren', 'aufräumen']

export const ACTION_EXAMPLES = ['Anna anrufen wegen Angebot', 'Entwurf für Flyer skizzieren', 'Druckerpatronen besorgen']
