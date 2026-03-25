import { useRef, useState } from 'react'
import { importClaudeSkillsContent, importClaudeSkillsFile } from '../api/imports'

interface ImportModalProps {
  onClose: () => void
  onImported: () => void
}

type Tab = 'paste' | 'upload'

function ImportModal({ onClose, onImported }: ImportModalProps) {
  const [tab, setTab] = useState<Tab>('paste')
  const [pasteText, setPasteText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessCount(null)
    setLoading(true)

    try {
      let result
      if (tab === 'upload') {
        if (!file) {
          setError('Please select a .md file to upload.')
          return
        }
        result = await importClaudeSkillsFile(file)
      } else {
        if (!pasteText.trim()) {
          setError('Please paste some markdown content.')
          return
        }
        result = await importClaudeSkillsContent(pasteText)
      }
      setSuccessCount(result.imported)
      onImported()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed. Please check your markdown.')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setError(null)
    setSuccessCount(null)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    border: 'none',
    cursor: 'pointer',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
    background: active ? 'var(--bg-surface)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  })

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Import Claude Skills Markdown"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.125rem',
                color: 'var(--text-primary)',
                margin: '0 0 0.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              Import Claude Skills
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
              Upload or paste a Claude skills markdown file to create prompt entries.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            background: 'var(--bg-base)',
            borderRadius: '8px',
            padding: '0.25rem',
            marginBottom: '1.25rem',
            width: 'fit-content',
          }}
        >
          <button style={tabStyle(tab === 'paste')} onClick={() => { setTab('paste'); setError(null); setSuccessCount(null) }}>
            Paste Markdown
          </button>
          <button style={tabStyle(tab === 'upload')} onClick={() => { setTab('upload'); setError(null); setSuccessCount(null) }}>
            Upload File
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Paste tab */}
          {tab === 'paste' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="import-paste"
                style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.5rem' }}
              >
                Markdown content
              </label>
              <textarea
                id="import-paste"
                className="vault-input"
                placeholder={`# My Skill\n\n## Description\nWhat this skill does.\n\n## Instructions\nStep-by-step instructions…`}
                value={pasteText}
                onChange={(e) => { setPasteText(e.target.value); setError(null); setSuccessCount(null) }}
                rows={10}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Upload tab */}
          {tab === 'upload' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.5rem' }}
              >
                Markdown file (.md)
              </label>
              <div
                style={{
                  border: '2px dashed var(--border-default)',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition-fast)',
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const dropped = e.dataTransfer.files[0]
                  if (dropped) { setFile(dropped); setError(null); setSuccessCount(null) }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,text/markdown,text/plain"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  aria-label="Choose markdown file"
                />
                {file ? (
                  <div>
                    <p style={{ color: 'var(--accent-amber)', fontWeight: 600, margin: '0 0 0.25rem', fontSize: '0.9rem' }}>
                      {file.name}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
                      {(file.size / 1024).toFixed(1)} KB — click or drop to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: '0 0 0.25rem' }}>
                      Click to choose or drag &amp; drop
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
                      .md files only, max 1 MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '0.625rem 0.875rem',
                marginBottom: '1rem',
                color: '#f87171',
                fontSize: '0.8125rem',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Success */}
          {successCount !== null && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '0.625rem 0.875rem',
                marginBottom: '1rem',
                color: '#34d399',
                fontSize: '0.8125rem',
              }}
              role="status"
            >
              ✓ Successfully imported {successCount} {successCount === 1 ? 'prompt' : 'prompts'}.
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
            >
              {successCount !== null ? 'Close' : 'Cancel'}
            </button>
            {successCount === null && (
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: loading ? 'rgba(245, 158, 11, 0.5)' : 'var(--accent-amber)',
                  color: '#0b0d12',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 150ms ease',
                }}
              >
                {loading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                    Importing…
                  </>
                ) : (
                  'Import'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default ImportModal
