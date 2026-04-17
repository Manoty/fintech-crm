import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import TicketList from './pages/TicketList'
import TicketDetail from './pages/TicketDetail'
import CustomerProfile from './pages/CustomerProfile'
import NewTicket from './pages/NewTicket'
import Login from './pages/Login'
import {
  LayoutDashboard, Ticket, LogOut,
  Search, Plus, X, Command
} from 'lucide-react'
import { getTickets, getCustomers } from './api'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tickets',   label: 'Tickets',   icon: Ticket },
]

// ── Command Palette ────────────────────────────────────────────────────────
function CommandPalette({ onClose }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate              = useNavigate()

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    setLoading(true)
    Promise.all([
      getTickets({ search: query }),
      getCustomers({ search: query }),
    ]).then(([t, c]) => {
      const tickets    = (t.data.results || t.data).slice(0, 4).map(x => ({
        type: 'ticket', id: x.id, label: x.subject,
        sub: `#${x.id} · ${x.customer_name}`, to: `/tickets/${x.id}`
      }))
      const customers  = (c.data.results || c.data).slice(0, 3).map(x => ({
        type: 'customer', id: x.id, label: x.full_name,
        sub: x.phone_number, to: `/customers/${x.id}`
      }))
      setResults([...tickets, ...customers])
    }).finally(() => setLoading(false))
  }, [query])

  const go = (to) => { navigate(to); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={16} className="text-gray-400" />
          <input
            autoFocus
            className="flex-1 text-sm outline-none placeholder-gray-400"
            placeholder="Search tickets, customers..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {loading && <div className="w-4 h-4 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />}
          <button onClick={onClose}><X size={16} className="text-gray-300 hover:text-gray-500" /></button>
        </div>
        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto py-2">
            {results.map(r => (
              <li key={`${r.type}-${r.id}`}>
                <button
                  onClick={() => go(r.to)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                >
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    r.type === 'ticket'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {r.type === 'ticket' ? 'Ticket' : 'Customer'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.label}</p>
                    <p className="text-xs text-gray-400">{r.sub}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.length >= 2 && results.length === 0 && !loading && (
          <p className="px-4 py-6 text-sm text-center text-gray-400">No results for "{query}"</p>
        )}
        {query.length === 0 && (
          <div className="px-4 py-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">Start typing to search...</p>
            <button
              onClick={() => { navigate('/tickets/new'); onClose() }}
              className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"
            >
              <Plus size={12} /> New Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ onSearch }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="w-56 bg-[#0a0e1a] min-h-screen flex flex-col flex-shrink-0 border-r border-white/5">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">P</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-tight leading-none">Payd CRM</h1>
            <p className="text-gray-500 text-[10px] mt-0.5">Support Platform</p>
          </div>
        </div>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-4">
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 text-sm transition-colors group"
        >
          <Search size={14} />
          <span className="flex-1 text-left text-xs">Search...</span>
          <kbd className="hidden group-hover:flex items-center gap-0.5 text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
            <Command size={9} />K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <button
          onClick={() => navigate('/tickets/new')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <Plus size={16} />
          New Ticket
        </button>
      </nav>

      {/* Agent footer */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 text-xs font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.full_name}</p>
            <p className="text-gray-500 text-[10px] truncate">{user?.is_staff ? 'Administrator' : 'Support Agent'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg text-xs transition-colors"
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ── App Shell ──────────────────────────────────────────────────────────────
function AppShell() {
  const [showSearch, setShowSearch] = useState(false)

  // Global ⌘K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(s => !s)
      }
      if (e.key === 'Escape') setShowSearch(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {showSearch && <CommandPalette onClose={() => setShowSearch(false)} />}
      <Sidebar onSearch={() => setShowSearch(true)} />
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route path="/"              element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/tickets"       element={<TicketList />} />
          <Route path="/tickets/new"   element={<NewTicket />} />
          <Route path="/tickets/:id"   element={<TicketDetail />} />
          <Route path="/customers"     element={<Navigate to="/tickets" replace />} />
          <Route path="/customers/:id" element={<CustomerProfile />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}