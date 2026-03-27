import { useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import EntriesPage from './pages/EntriesPage'
import ResourcesPage from './pages/ResourcesPage'
import { useEntries } from './hooks/useEntries'
import type { Entry } from './api/entries'

interface EntriesContextValue {
  entries: Entry[]
  loading: boolean
  total: number
  refetch: () => void
}

const EntriesContext = createContext<EntriesContextValue>({
  entries: [],
  loading: true,
  total: 0,
  refetch: () => {},
})

export function useSharedEntries() {
  return useContext(EntriesContext)
}

const TYPE_CONFIG: { key: Entry['type']; label: string; color: string }[] = [
  { key: 'prompt', label: 'Prompts', color: 'var(--type-prompt)' },
  { key: 'snippet', label: 'Snippets', color: 'var(--type-snippet)' },
  { key: 'context', label: 'Context', color: 'var(--type-context)' },
]

function SidebarEntryList() {
  const { entries, loading } = useSharedEntries()
  const navigate = useNavigate()
  const [vaultOpen, setVaultOpen] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  function toggleGroup(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const grouped = TYPE_CONFIG.map((t) => ({
    ...t,
    items: entries.filter((e) => e.type === t.key),
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
            color: 'var(--text-muted)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            padding: '0 0.375rem',
            borderRadius: '99px',
            lineHeight: '1.4',
          }}
        >
          {entries.length}
        </span>
      </button>

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
    </div>
  )
}

function Sidebar() {
  return (
    <aside
      style={{
        width: '220px',
        minWidth: '220px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1.5rem 1.25rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
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
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2h10v2H2V2zm0 3h10v2H2V5zm0 3h6v2H2V8z"
                fill="#0b0d12"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
            }}
          >
            PromptVault
            <span style={{ color: 'var(--accent-amber)' }}>Pro</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0.75rem 0.75rem 0.5rem' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            padding: '0 0.5rem',
            marginBottom: '0.375rem',
          }}
        >
          Library
        </p>
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.625rem',
            borderRadius: '7px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--bg-surface)' : 'transparent',
            transition: 'all 120ms ease',
          })}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.7" />
            <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.7" />
            <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.7" />
            <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.4" />
          </svg>
          Entries
        </NavLink>

        <p
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            padding: '0 0.5rem',
            margin: '1rem 0 0.375rem',
          }}
        >
          Discover
        </p>
        <NavLink
          to="/resources"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.625rem',
            borderRadius: '7px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--bg-surface)' : 'transparent',
            transition: 'all 120ms ease',
          })}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
            <path d="M7.5 4v3.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
          </svg>
          Resources
        </NavLink>
      </nav>

      {/* Entries list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.75rem',
          minHeight: 0,
        }}
      >
        <SidebarEntryList />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>
          v0.1.0 · local-only
        </p>
      </div>
    </aside>
  )
}

function AppShell() {
  const entriesState = useEntries()

  return (
    <EntriesContext.Provider value={entriesState}>
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
