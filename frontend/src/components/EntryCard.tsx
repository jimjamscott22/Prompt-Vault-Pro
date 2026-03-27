import { useEffect, useState } from 'react'
import { useSharedProjects } from '../App'
import type { Entry } from '../api/entries'

interface Props {
  entry: Entry
  onEdit: (entry: Entry) => void
  onDelete: (id: string) => void
  activeFolderId?: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function EntryCard({ entry, onEdit, onDelete, activeFolderId }: Props) {
  const { projects } = useSharedProjects()
  const folder = entry.project_id ? projects.find((p) => p.id === entry.project_id) : null
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (copyState === 'idle') return

    const timeout = window.setTimeout(() => setCopyState('idle'), 1800)
    return () => window.clearTimeout(timeout)
  }, [copyState])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(entry.body)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }

  return (
    <div
      className="entry-card"
      data-type={entry.type}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '1rem 1.125rem',
        marginBottom: '0.75rem',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.625rem', gap: '1rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.9375rem',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {entry.title}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span
            className="type-badge"
            data-type={entry.type}
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '0.2rem 0.5rem',
              borderRadius: '5px',
            }}
          >
            {entry.type}
          </span>
          <button
            onClick={handleCopy}
            className={`entry-action-button${copyState === 'copied' ? ' is-copied' : ''}${copyState === 'error' ? ' is-error' : ''}`}
            aria-label={`Copy ${entry.title}`}
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Failed' : 'Copy'}
          </button>
          <button
            onClick={() => onEdit(entry)}
            className="entry-action-button"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#ef4444',
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: '5px',
              padding: '0.2rem 0.625rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 120ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Body / code */}
      <pre
        style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '7px',
          padding: '0.75rem 1rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8125rem',
          lineHeight: 1.65,
          color: 'var(--text-code)',
          overflowX: 'auto',
          margin: '0 0 0.75rem 0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <code>{entry.body}</code>
      </pre>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {entry.language && (
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              background: 'var(--bg-surface)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            {entry.language}
          </span>
        )}
        {folder && !activeFolderId && (
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: 'var(--accent-amber)',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>📁</span>
            {folder.name}
          </span>
        )}
        {entry.tags.map((tag) => (
          <span
            key={tag.id}
            style={{
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            #{tag.name}
          </span>
        ))}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
          }}
        >
          {formatDate(entry.created_at)}
        </span>
      </div>
    </div>
  )
}

export default EntryCard
