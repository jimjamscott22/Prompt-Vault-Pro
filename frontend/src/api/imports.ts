import { postForm } from './client'
import type { Entry } from './entries'

export interface ImportResult {
  imported: number
  entries: Entry[]
}

/**
 * Import Claude skills markdown via pasted text content.
 */
export async function importClaudeSkillsContent(content: string): Promise<ImportResult> {
  const form = new FormData()
  form.append('content', content)
  const response = await postForm<ImportResult>('/import/claude-skills', form)
  return response.data
}

/**
 * Import Claude skills markdown via file upload.
 */
export async function importClaudeSkillsFile(file: File): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  const response = await postForm<ImportResult>('/import/claude-skills', form)
  return response.data
}
