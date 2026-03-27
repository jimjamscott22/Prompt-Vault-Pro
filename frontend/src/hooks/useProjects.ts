import { useState, useEffect, useCallback } from 'react'
import { listProjects, createProject, deleteProject, toSlug, type Project } from '../api/projects'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listProjects()
      setProjects(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const createFolder = useCallback(async (name: string): Promise<Project> => {
    const slug = toSlug(name)
    const res = await createProject({ name, slug })
    await refetch()
    return res.data
  }, [refetch])

  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    await deleteProject(id)
    await refetch()
  }, [refetch])

  return { projects, loading, refetch, createFolder, deleteFolder }
}
