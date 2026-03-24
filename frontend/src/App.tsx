import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import EntriesPage from './pages/EntriesPage'
import ResourcesPage from './pages/ResourcesPage'

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
      <nav style={{ padding: '0.75rem 0.75rem', flex: 1 }}>
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

      {/* Footer */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>
          v0.1.0 · local-only
        </p>
      </div>
    </aside>
  )
}

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}

export default App
