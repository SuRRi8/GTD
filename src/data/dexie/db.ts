import { Dexie, type Table } from 'dexie'
import type { CollectionMap, CollectionName } from '../types'

export type GtdTables = { [K in CollectionName]: Table<CollectionMap[K], string> }

/**
 * IndexedDB-Schema. Neue Tabellen oder Indizes kommen über eine weitere
 * `this.version(n).stores(...)`-Stufe dazu; Dexie migriert dann selbst.
 */
export class GtdDatabase extends Dexie {
  declare inbox: GtdTables['inbox']
  declare projects: GtdTables['projects']
  declare actions: GtdTables['actions']
  declare waiting: GtdTables['waiting']
  declare calendar: GtdTables['calendar']
  declare references: GtdTables['references']
  declare contexts: GtdTables['contexts']
  declare people: GtdTables['people']
  declare reviews: GtdTables['reviews']

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      inbox: 'id, createdAt, updatedAt',
      projects: 'id, status, updatedAt',
      actions: 'id, projectId, contextId, agendaPersonId, updatedAt',
      waiting: 'id, personId, projectId, updatedAt',
      calendar: 'id, date, projectId, updatedAt',
      references: 'id, updatedAt',
      contexts: 'id, order, updatedAt',
      people: 'id, updatedAt',
      reviews: 'id, completedAt, updatedAt',
    })
  }
}
