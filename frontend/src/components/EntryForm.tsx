import { useState, useEffect } from 'react'
import { useSharedProjects } from '../App'
import type { Entry, EntryCreate } from '../api/entries'

interface Props {
  entry?: Entry | null
  onSubmit: (data: EntryCreate) => Promise<void>
  onClose: () => void
  defaultProjectId?: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  padding: '0.5rem 0.75rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.375rem',
  letterSpacing: '0.02em',
}

function EntryForm({ entry, onSubmit, onClose, defaultProjectId }: Props) {
  const { projects, projectsLoading } = useSharedProjects()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<'prompt' | 'snippet' | 'context'>('prompt')
  const [language, setLanguage] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    if (entry) {
      setTitle(entry.title)
      setBody(entry.body)
      setType(entry.type)
      setLanguage(entry.language ?? '')
      setProjectId(entry.project_id)
      setTags(entry.tags.map((t) => t.name).join(', '))
    } else if (defaultProjectId) {
      setProjectId(defaultProjectId)
    }
  }, [entry, defaultProjectId])

  function getFocusStyle(field: string): React.CSSProperties {
    return focusedField === field
      ? { borderColor: 'var(--accent-amber)', boxShadow: '0 0 0 3px var(--accent-amber-glow)' }
      : {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      await onSubmit({
        title,
        body,
        type,
        language: language || undefined,
        project_id: projectId || undefined,
        tags: tagList.length ? tagList : undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(7, 8, 12, 0.75)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-default)',
          borderRadius: '14px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          padding: '1.5rem',
        }}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.0625rem',
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {entry ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '7px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              transition: 'all 120ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              style={{ ...inputStyle, ...getFocusStyle('title') }}
              placeholder="Give this entry a clear name"
            />
          </div>

          {/* Body */}
          <div>
            <label style={labelStyle}>Body</label>
            <textarea
              required
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onFocus={() => setFocusedField('body')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                lineHeight: 1.65,
                resize: 'vertical',
                ...getFocusStyle('body'),
              }}
              placeholder="Paste your prompt, snippet, or context here…"
            />
          </div>

          {/* Type + Language row */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                onFocus={() => setFocusedField('type')}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  cursor: 'pointer',
                  ...getFocusStyle('type'),
                }}
              >
                <option value="prompt">prompt</option>
                <option value="snippet">snippet</option>
                <option value="context">context</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Language</label>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                onFocus={() => setFocusedField('lang')}
                onBlur={() => setFocusedField(null)}
                placeholder="python, typescript…"
                style={{ ...inputStyle, ...getFocusStyle('lang') }}
              />
            </div>
          </div>

          {/* Folder */}
          <div>
            <label style={labelStyle}>Folder</label>
            <select
              value={projectId ?? ''}
              onChange={(e) => setProjectId(e.target.value || null)}
              onFocus={() => setFocusedField('folder')}
              onBlur={() => setFocusedField(null)}
              disabled={projectsLoading}
              style={{
                ...inputStyle,
                appearance: 'none',
                cursor: projectsLoading ? 'not-allowed' : 'pointer',
                ...getFocusStyle('folder'),
              }}
            >
              <option value="">No folder</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags <span style={{ fontWeight: 400, opacity: 0.6 }}>(comma-separated)</span></label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onFocus={() => setFocusedField('tags')}
              onBlur={() => setFocusedField(null)}
              placeholder="auth, react, api"
              style={{ ...inputStyle, ...getFocusStyle('tags') }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.8125rem', color: '#f87171', margin: 0 }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? 'rgba(245,158,11,0.6)' : 'var(--accent-amber)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#0b0d12',
                fontFamily: 'var(--font-body)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'opacity 150ms ease',
              }}
            >
              {submitting ? 'Saving…' : entry ? 'Save Changes' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EntryForm
