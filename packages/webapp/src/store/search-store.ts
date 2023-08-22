import create from 'zustand'
import { persist } from 'zustand/middleware'

import { Entry } from './entry'
import { useEntryStore } from './entry-store'

import { execQuery } from './query/query'
import { execSimilar, execVibrantDistance } from './query/similar'
import { execFaces } from './query/faces'
import { byDateDesc, byKeyWith } from './query/utils'

export interface Search {
  type: 'none' | 'year' | 'query' | 'similar' | 'faces' | 'sortKey' | 'vibrance'
  value?: any
  query?: string
sort?: {key:string,dir:string}
  extra?:any
  seedEntry?:Entry
}

export interface SearchStore {
  query: Search
  search: (query: Search) => void
  refresh: () => Promise<void>
}

const doSearch = async (entries: Entry[], query) => {
  if (!entries.length) {
    return entries;
  }
  if (query.sort && query.sort.key){
    entries.sort(byKeyWith(query.sort.key))
  } else {
  entries.sort(byDateDesc)

  }
let seedEntry
  if (query.type == 'query') {
    entries = await execQuery(entries, query.value,seedEntry)
  } else if (query.type == 'year') {
    entries = await execQuery(entries, `year:${query.value} order by date asc`,seedEntry)
  } else if (query.type == 'similar') {
    const id = query.value
    seedEntry = entries.find(entry => entry.id.startsWith(id))
    entries = execSimilar(entries, seedEntry?.similarityHash, query.query)
  } else if (query.type == 'vibrance') {
    const id = query.value
    seedEntry = entries.find(entry => entry.id.startsWith(id))
    entries = execVibrantDistance(entries, seedEntry?.vibrance, query.query)

  } else if (query.type == 'faces') {
    const { id, faceIndex } = query.value
    seedEntry = entries.find(entry => entry.id.startsWith(id))
    const descriptor = seedEntry?.faces[faceIndex]?.descriptor
    entries = execFaces(entries, descriptor)
  }
  if (query.query /* && query.type !== 'similar' */) {
    entries = await execQuery(entries, query.query,seedEntry)
  }

  return entries
}

const updateQuery = async (query: Search) => {
  const allEntries = useEntryStore.getState().allEntries
  const entries = await doSearch([...allEntries], query)
  console.log(`update query to ${entries.length} entries from ${allEntries.length} entries`)
  useEntryStore.getState().setEntries(entries)
}

export const useSearchStore = create<
  SearchStore,
  [
    ["zustand/persist", SearchStore]
  ]
  >(
  persist((set, get) => ({
    query: {sort: {key:'date',dir:'desc'}, type: 'none' },
    

    search: (query: Search) => {
      set((state) => ({...state, query}))
      updateQuery(query)
    },
    refresh: async () => {
      updateQuery(get().query)
    }
  }), { name: 'gallery-search' })
)

const refresh = () => useSearchStore.getState().refresh()
useEntryStore.subscribe(state => state.id2Entries, refresh)
