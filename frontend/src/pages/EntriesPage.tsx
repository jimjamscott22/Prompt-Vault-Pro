import { useState } from 'react'
import { useEntries } from '../hooks/useEntries'
import EntryCard from '../components/EntryCard'
import EntryForm from '../components/EntryForm'
import { createEntry, updateEntry, deleteEntry } from '../api/entries'
import type { Entry, EntryCreate } from '../api/entries'

type FilterType = 'all' | 'prompt' | 'snippet' | 'context'

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Prompts', value: 'prompt' },
  { label: 'Snippets', value: 'snippet' },
  { label: 'Context', value: 'context' },
]

function EmptyState({ filter }: { filter: FilterType }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 4h12v2H4V4zm0 3.5h12v2H4v-2zm0 3.5h8v2H4v-2z"
            fill="var(--text-muted)"
          />
        </svg>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9375rem', margin: '0 0 0.375rem' }}>
        {filter === 'all' ? 'No entries yet' : `No ${filter}s yet`}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
        {filter === 'all'
          ? 'Create your first entry to start building your vault.'
          : `Switch to "All" or create a new ${filter}.`}
      </p>
    </div>
  )
}

function EntriesPage() {
  const { entries, loading, refetch } = useEntries()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Entry | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(entry: Entry) {
    setEditTarget(entry)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
  }

  async function handleSubmit(data: EntryCreate) {
    if (editTarget) {
      await updateEntry(editTarget.id, data)
    } else {
      await createEntry(data)
    }
    closeModal()
    refetch()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    await deleteEntry(id)
    refetch()
  }

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.type === filter)

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.375rem',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Entries
            </h1>
            {!loading && entries.length > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  padding: '0.1rem 0.5rem',
                  borderRadius: '99px',
                }}
              >
                {entries.length}
              </span>
            )}
          </div>
          <button
            onClick={openCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'var(--accent-amber)',
              color: '#0b0d12',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'opacity 150ms ease, transform 150ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Entry
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-tab${filter === f.value ? ' active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              {f.value !== 'all' && !loading && (
                <span style={{ marginLeft: '0.375rem', opacity: 0.6 }}>
                  {entries.filter((e) => e.type === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
          Loading entries…
        </div>
      )}

      {!loading && filtered.length === 0 && <EmptyState filter={filter} />}

      {!loading && filtered.length > 0 && (
        <div>
          {filtered.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <EntryForm
          entry={editTarget}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </>
  )
}

export default EntriesPage
