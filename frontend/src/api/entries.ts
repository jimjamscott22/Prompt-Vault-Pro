import { get, post, put, del } from './client'

export interface Tag {
  id: string
  name: string
}

export interface Entry {
  id: string
  title: string
  body: string
  type: 'prompt' | 'snippet' | 'context'
  language: string | null
  project_id: string | null
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface EntryCreate {
  title: string
  body: string
  type: string
  language?: string
  project_id?: string
  tags?: string[]
}

export function listEntries(params?: Record<string, string>) {
  return get<Entry[]>('/entries', params)
}

export function getEntry(id: string) {
  return get<Entry>(`/entries/${id}`)
}

export function createEntry(data: EntryCreate) {
  return post<Entry>('/entries', data)
}

export function updateEntry(id: string, data: Partial<EntryCreate>) {
  return put<Entry>(`/entries/${id}`, data)
}

export function deleteEntry(id: string) {
  return del(`/entries/${id}`)
}

export function searchEntries(params: Record<string, string>) {
  return get<Entry[]>('/search', params)
}
