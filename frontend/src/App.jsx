import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import CustomerProfile from './pages/CustomerProfile';
import { LayoutDashboard, Ticket, Users } from 'lucide-react';
import NewTicket from './pages/NewTicket'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tickets', label: 'Tickets', icon: Ticket },
  
];

function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 min-h-screen flex flex-col flex-shrink-0">
      <div className="px-5 py-5 border-b border-gray-700">
        <h1 className="text-white font-bold text-lg tracking-tight">Payd CRM</h1>
        <p className="text-gray-400 text-xs mt-0.5">Support Platform</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs">v1.0.0 · MVP</p>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets" element={<TicketList />} />
            <Route path="/tickets/new"   element={<NewTicket />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/customers" element={<CustomerProfile />} />
            <Route path="/customers/:id" element={<CustomerProfile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
