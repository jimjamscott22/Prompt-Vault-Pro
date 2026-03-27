import { get, post, put, del } from './client'

export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  path: string | null
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  slug: string
  description?: string
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function listProjects() {
  return get<Project[]>('/projects')
}

export async function createProject(data: ProjectCreate) {
  return post<Project>('/projects', data)
}

export async function updateProject(id: string, data: Partial<ProjectCreate>) {
  return put<Project>(`/projects/${id}`, data)
}

export async function deleteProject(id: string) {
  return del(`/projects/${id}`)
}
