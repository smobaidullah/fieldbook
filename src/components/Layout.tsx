import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, KanbanSquare, Users, Receipt, Moon, Sun, LogOut, RotateCcw, Menu, Wrench } from 'lucide-react'
import { useAuth } from '../auth'
import { useStore } from '../store'

const THEME_KEY = 'fieldbook:theme'

function initialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // fall through to system preference
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/jobs', label: 'Jobs board', icon: KanbanSquare },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { dispatch } = useStore()
  const [theme, setTheme] = useState(initialTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // not critical
    }
  }, [theme])

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <div className="shell">
      <div className="mobile-bar">
        <div className="brand" style={{ padding: 0 }}>
          <span className="brand-mark"><Wrench size={16} /></span> Fieldbook
        </div>
        <button className="btn btn-sm" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          <Menu size={16} />
        </button>
      </div>

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><Wrench size={16} /></span> Fieldbook
        </div>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon size={17} /> {label}
          </NavLink>
        ))}

        <div className="sidebar-foot">
          <button className="btn btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            className="btn btn-ghost"
            title="Restore the original demo data"
            onClick={() => dispatch({ type: 'reset' })}
          >
            <RotateCcw size={16} /> Reset demo data
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            <LogOut size={16} /> Sign out <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{user}</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
