import { useState, useRef, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import EntriesPage from './pages/EntriesPage'
import ResourcesPage from './pages/ResourcesPage'
import { useEntries } from './hooks/useEntries'
import { useProjects } from './hooks/useProjects'
import type { Entry } from './api/entries'
import type { Project } from './api/projects'

interface EntriesContextValue {
  entries: Entry[]
  loading: boolean
  total: number
  refetch: () => void
  projects: Project[]
  projectsLoading: boolean
  createFolder: (name: string) => Promise<Project>
  deleteFolder: (id: string) => Promise<void>
  refetchProjects: () => void
}

const EntriesContext = createContext<EntriesContextValue>({
  entries: [],
  loading: true,
  total: 0,
  refetch: () => {},
  projects: [],
  projectsLoading: true,
  createFolder: async () => { throw new Error('Not initialized') },
  deleteFolder: async () => { throw new Error('Not initialized') },
  refetchProjects: () => {},
})

export function useSharedEntries() {
  return useContext(EntriesContext)
}

export function useSharedProjects() {
  return useContext(EntriesContext)
}

const TYPE_CONFIG: { key: Entry['type']; label: string; color: string }[] = [
  { key: 'prompt', label: 'Prompts', color: 'var(--type-prompt)' },
  { key: 'snippet', label: 'Snippets', color: 'var(--type-snippet)' },
  { key: 'context', label: 'Context', color: 'var(--type-context)' },
]

function SidebarFolderList() {
  const { projects, projectsLoading, createFolder, deleteFolder, entries } = useSharedEntries()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeFolderId = searchParams.get('folder')
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreateFolder = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newFolderName.trim()) {
      e.preventDefault()
      setSubmitting(true)
      try {
        await createFolder(newFolderName)
        setNewFolderName('')
        setIsCreating(false)
      } finally {
        setSubmitting(false)
      }
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewFolderName('')
    }
  }

  const handleDeleteFolder = async (id: string) => {
    if (id === activeFolderId) {
      navigate('/')
    }
    await deleteFolder(id)
  }

  if (projectsLoading && projects.length === 0) {
    return null
  }

  if (projects.length === 0 && !isCreating) {
    return null
  }

  return (
    <div style={{ padding: '0 0.75rem' }}>
      {/* Section header */}
      <button
        onClick={() => setIsCreating(!isCreating)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 0.5rem',
          marginBottom: '0.375rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Folders
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsCreating(true)
            setNewFolderName('')
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            padding: '0 0.25rem',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 120ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
          }}
        >
          +
        </button>
      </button>

      {/* Inline creation input */}
      {isCreating && (
        <div style={{ marginBottom: '0.375rem', paddingLeft: '0.5rem' }}>
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={handleCreateFolder}
            onBlur={() => {
              if (!submitting) {
                setIsCreating(false)
                setNewFolderName('')
              }
            }}
            disabled={submitting}
            placeholder="Folder name…"
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--accent-amber)',
              borderRadius: '5px',
              padding: '0.25rem 0.375rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* All Entries button */}
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          width: '100%',
          padding: '0.3rem 0.5rem',
          borderRadius: '5px',
          background: !activeFolderId ? 'var(--bg-surface)' : 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 120ms ease',
        }}
        onMouseEnter={(e) => {
          if (activeFolderId) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'
          }
        }}
        onMouseLeave={(e) => {
          if (activeFolderId) {
            (e.currentTarget as HTMLButtonElement).style.background = 'none'
          }
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: !activeFolderId ? 'var(--accent-amber)' : 'var(--text-secondary)',
            transition: 'color 120ms ease',
          }}
        >
          All Entries
        </span>
        <span
          style={{
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
            marginLeft: 'auto',
          }}
        >
          {entries.length}
        </span>
      </button>

      {/* Folder list */}
      {projects.length > 0 && (
        <div style={{ marginBottom: '0.25rem' }}>
          {projects.map((folder) => {
            const folderEntryCount = entries.filter((e) => e.project_id === folder.id).length
            const isActive = activeFolderId === folder.id

            return (
              <div
                key={folder.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '5px',
                  background: isActive ? 'var(--bg-surface)' : 'none',
                  transition: 'background 120ms ease',
                  group: 'folder-row',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'none'
                  }
                }}
              >
                <button
                  onClick={() => navigate(`/?folder=${folder.id}`)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    📁
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isActive ? 'var(--accent-amber)' : 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'color 120ms ease',
                    }}
                  >
                    {folder.name}
                  </span>
                </button>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {folderEntryCount}
                </span>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    padding: '0 0.25rem',
                    opacity: 0,
                    transition: 'opacity 120ms ease, color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = '1'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#f87171'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = '0'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
                  }}
                  title="Delete folder"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type SortKey = 'newest' | 'oldest' | 'a-z' | 'z-a'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'a-z', label: 'A → Z' },
  { key: 'z-a', label: 'Z → A' },
]

function sortEntries(items: Entry[], sort: SortKey): Entry[] {
  const sorted = [...items]
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    case 'a-z':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'z-a':
      return sorted.sort((a, b) => b.title.localeCompare(a.title))
  }
}

function SidebarEntryList() {
  const { entries, loading } = useSharedEntries()
  const navigate = useNavigate()
  const [vaultOpen, setVaultOpen] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTypes, setActiveTypes] = useState<Set<Entry['type']>>(new Set(['prompt', 'snippet', 'context']))
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    if (sortOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sortOpen])

  function toggleType(type: Entry['type']) {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function toggleGroup(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const query = searchQuery.toLowerCase().trim()
  const filtered = entries.filter((e) => {
    if (!activeTypes.has(e.type)) return false
    if (query && !e.title.toLowerCase().includes(query)) return false
    return true
  })
  const sorted = sortEntries(filtered, sortBy)

  const allTypesActive = activeTypes.size === 3
  const hasActiveFilters = !allTypesActive || query !== ''

  const grouped = TYPE_CONFIG.map((t) => ({
    ...t,
    items: sorted.filter((e) => e.type === t.key),
  }))

  if (loading) {
    return (
      <div style={{ padding: '0 0.75rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
          Loading...
        </p>
      </div>
    )
  }

  if (entries.length === 0) return null

  return (
    <div style={{ padding: '0 0.75rem' }}>
      {/* Section header */}
      <button
        onClick={() => setVaultOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 0.5rem',
          marginBottom: '0.375rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Your Vault
        </span>
        <span
          style={{
            fontSize: '0.6875rem',
            color: hasActiveFilters ? 'var(--accent-amber)' : 'var(--text-muted)',
            background: hasActiveFilters ? 'var(--accent-amber-dim)' : 'var(--bg-surface)',
            border: `1px solid ${hasActiveFilters ? 'rgba(245, 158, 11, 0.25)' : 'var(--border-default)'}`,
            padding: '0 0.375rem',
            borderRadius: '99px',
            lineHeight: '1.4',
            transition: 'all 200ms ease',
          }}
        >
          {filtered.length}{hasActiveFilters ? `/${entries.length}` : ''}
        </span>
      </button>

      {/* Filter & sort controls */}
      {vaultOpen && (
        <div style={{ padding: '0 0.25rem', marginBottom: '0.5rem' }}>
          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: '0.375rem' }}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                position: 'absolute',
                left: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <circle cx="5" cy="5" r="3.5" stroke="var(--text-muted)" strokeWidth="1.2" />
              <path d="M7.5 7.5L10 10" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter entries..."
              className="sidebar-search"
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '5px',
                padding: '0.3rem 0.375rem 0.3rem 1.625rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.6875rem',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 120ms ease, box-shadow 120ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-amber)'
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-amber-glow)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.25rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  padding: '0 0.25rem',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Type toggles + sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {TYPE_CONFIG.map((t) => {
              const isActive = activeTypes.has(t.key)
              return (
                <button
                  key={t.key}
                  onClick={() => toggleType(t.key)}
                  title={`${isActive ? 'Hide' : 'Show'} ${t.label.toLowerCase()}`}
                  className="sidebar-type-toggle"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.375rem',
                    borderRadius: '4px',
                    border: `1px solid ${isActive ? t.color + '33' : 'var(--border-subtle)'}`,
                    background: isActive ? t.color + '15' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                    opacity: isActive ? 1 : 0.45,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: t.color,
                      transition: 'opacity 120ms ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      color: isActive ? t.color : 'var(--text-muted)',
                      letterSpacing: '0.02em',
                      transition: 'color 120ms ease',
                    }}
                  >
                    {t.label.charAt(0)}
                  </span>
                </button>
              )
            })}

            {/* Sort dropdown */}
            <div ref={sortRef} style={{ marginLeft: 'auto', position: 'relative' }}>
              <button
                onClick={() => setSortOpen((v) => !v)}
                title={`Sort: ${SORT_OPTIONS.find((o) => o.key === sortBy)?.label}`}
                className="sidebar-sort-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.375rem',
                  borderRadius: '4px',
                  border: `1px solid ${sortOpen ? 'var(--accent-amber)33' : 'var(--border-subtle)'}`,
                  background: sortOpen ? 'var(--accent-amber-dim)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                  color: sortOpen ? 'var(--accent-amber)' : 'var(--text-muted)',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 2.5H8.5M1.5 5H6.5M1.5 7.5H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>

              {sortOpen && (
                <div
                  className="sidebar-sort-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '0.25rem',
                    zIndex: 50,
                    minWidth: '100px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSortBy(opt.key)
                        setSortOpen(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        width: '100%',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '4px',
                        border: 'none',
                        background: sortBy === opt.key ? 'var(--accent-amber-dim)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 120ms ease',
                        fontFamily: 'var(--font-body)',
                      }}
                      onMouseEnter={(e) => {
                        if (sortBy !== opt.key) e.currentTarget.style.background = 'var(--bg-surface)'
                      }}
                      onMouseLeave={(e) => {
                        if (sortBy !== opt.key) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: sortBy === opt.key ? 600 : 400,
                          color: sortBy === opt.key ? 'var(--accent-amber)' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {vaultOpen && grouped.map((group) => {
        if (group.items.length === 0) return null
        const isCollapsed = collapsed[group.key] ?? false

        return (
          <div key={group.key} style={{ marginBottom: '0.25rem' }}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                width: '100%',
                padding: '0.3rem 0.5rem',
                borderRadius: '5px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
              }}
            >
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                fill="none"
                style={{
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 120ms ease',
                  flexShrink: 0,
                }}
              >
                <path d="M1.5 2.5L4 5.5L6.5 2.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                {group.label}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  marginLeft: 'auto',
                }}
              >
                {group.items.length}
              </span>
            </button>

            {/* Entry items */}
            {!isCollapsed && (
              <div style={{ padding: '0.125rem 0 0.125rem 0.625rem' }}>
                {group.items.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => navigate('/')}
                    title={entry.title}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      width: '100%',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '5px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-surface)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none'
                    }}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: group.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Empty filter state */}
      {vaultOpen && filtered.length === 0 && (
        <div style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>
            No entries match filters
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setActiveTypes(new Set(['prompt', 'snippet', 'context']))
            }}
            style={{
              marginTop: '0.375rem',
              fontSize: '0.625rem',
              fontWeight: 600,
              color: 'var(--accent-amber)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              fontFamily: 'var(--font-body)',
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

const SIDEBAR_EXPANDED = 220
const SIDEBAR_COLLAPSED = 52

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <aside
      className="sidebar-rail"
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1), min-width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '1.5rem 0.75rem 1.25rem' : '1.5rem 1.25rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          transition: 'padding 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
            }}
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2h10v2H2V2zm0 3h10v2H2V5zm0 3h6v2H2V8z"
                fill="#0b0d12"
              />
            </svg>
          </div>
          <span
            className="sidebar-label"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
              opacity: collapsed ? 0 : 1,
              transition: 'opacity 200ms ease',
              whiteSpace: 'nowrap',
              pointerEvents: collapsed ? 'none' : 'auto',
            }}
          >
            PromptVault
            <span style={{ color: 'var(--accent-amber)' }}>Pro</span>
          </span>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="sidebar-toggle-btn"
        style={{
          position: 'absolute',
          top: '50%',
          right: '-12px',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          padding: 0,
          transition: 'color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast)',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Nav */}
      <nav style={{ padding: '0.75rem 0.75rem 0.5rem' }}>
        <p
          className="sidebar-label"
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            padding: '0 0.5rem',
            marginBottom: '0.375rem',
            opacity: collapsed ? 0 : 1,
            height: collapsed ? 0 : 'auto',
            marginTop: 0,
            overflow: 'hidden',
            transition: 'opacity 200ms ease, height 250ms ease, margin 250ms ease',
          }}
        >
          Library
        </p>
        <NavLink
          to="/"
          end
          title="Entries"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: collapsed ? '0.5rem' : '0.5rem 0.625rem',
            borderRadius: '7px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--bg-surface)' : 'transparent',
            transition: 'all 120ms ease',
            justifyContent: collapsed ? 'center' : 'flex-start',
          })}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.7" />
            <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.7" />
            <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.7" />
            <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.4" />
          </svg>
          <span className="sidebar-label" style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 200ms ease', whiteSpace: 'nowrap', pointerEvents: collapsed ? 'none' : 'auto' }}>
            Entries
          </span>
        </NavLink>

        <p
          className="sidebar-label"
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            padding: '0 0.5rem',
            margin: collapsed ? '0.5rem 0 0.375rem' : '1rem 0 0.375rem',
            opacity: collapsed ? 0 : 1,
            height: collapsed ? 0 : 'auto',
            overflow: 'hidden',
            transition: 'opacity 200ms ease, height 250ms ease, margin 250ms ease',
          }}
        >
          Discover
        </p>
        <NavLink
          to="/resources"
          title="Resources"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: collapsed ? '0.5rem' : '0.5rem 0.625rem',
            borderRadius: '7px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--bg-surface)' : 'transparent',
            transition: 'all 120ms ease',
            justifyContent: collapsed ? 'center' : 'flex-start',
          })}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
            <path d="M7.5 4v3.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
          </svg>
          <span className="sidebar-label" style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 200ms ease', whiteSpace: 'nowrap', pointerEvents: collapsed ? 'none' : 'auto' }}>
            Resources
          </span>
        </NavLink>
      </nav>

      {/* Entries list — hidden when collapsed */}
      <div
        style={{
          flex: 1,
          overflowY: collapsed ? 'hidden' : 'auto',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.75rem',
          minHeight: 0,
          opacity: collapsed ? 0 : 1,
          transition: 'opacity 200ms ease',
          pointerEvents: collapsed ? 'none' : 'auto',
        }}
      >
        <SidebarFolderList />
        <SidebarEntryList />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: collapsed ? '0.875rem 0.5rem' : '0.875rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
          transition: 'padding 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <p style={{
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
          margin: 0,
          opacity: collapsed ? 0 : 1,
          transition: 'opacity 200ms ease',
          whiteSpace: 'nowrap',
        }}>
          v0.1.0 · local-only
        </p>
      </div>
    </aside>
  )
}

function AppShell() {
  const entriesState = useEntries()
  const projectsState = useProjects()

  return (
    <EntriesContext.Provider value={{ ...entriesState, ...projectsState }}>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2.5rem 2.75rem',
            minWidth: 0,
          }}
        >
          <div style={{ maxWidth: '860px' }}>
            <Routes>
              <Route path="/" element={<EntriesPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </EntriesContext.Provider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
