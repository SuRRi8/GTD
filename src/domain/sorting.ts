import type { Context, Person, Project } from '../data/types'

const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true })

export const compareText = (a: string, b: string) => collator.compare(a, b)

export function sortContexts(contexts: Context[]): Context[] {
  return [...contexts].sort((a, b) => a.order - b.order || compareText(a.name, b.name))
}

export function sortPeople(people: Person[]): Person[] {
  return [...people].sort((a, b) => compareText(a.name, b.name))
}

export function sortByTitle<T extends Pick<Project, 'title'>>(items: T[]): T[] {
  return [...items].sort((a, b) => compareText(a.title, b.title))
}
