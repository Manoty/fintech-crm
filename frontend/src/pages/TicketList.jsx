import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTickets } from '../api'
import { StatusBadge, PriorityBadge } from '../utils/badges'
import { Search } from 'lucide-react'

const STATUSES   = ['', 'open', 'in_progress', 'resolved', 'closed']
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent']
const CATEGORIES = ['', 'transaction', 'kyc', 'fraud', 'account', 'other']

export default function TicketList() {
  const [tickets, setTickets]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({ status: '', priority: '', category: '' })
  const [search, setSearch]       = useState('')

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filters.status)   params.status   = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.category) params.category = filters.category
    if (search)           params.search   = search

    getTickets(params)
      .then(r => setTickets(r.data.results || r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filters, search])

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Tickets</h1>
        <Link
          to="/tickets/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search tickets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {[
          { key: 'status',   options: STATUSES,   label: 'Status' },
          { key: 'priority', options: PRIORITIES, label: 'Priority' },
          { key: 'category', options: CATEGORIES, label: 'Category' },
        ].map(({ key, options, label }) => (
          <select
            key={key}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters[key]}
            onChange={e => setFilter(key, e.target.value)}
          >
            <option value="">All {label}s</option>
            {options.filter(Boolean).map(o => (
              <option key={o} value={o}>{o.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        ))}
        {(filters.status || filters.priority || filters.category || search) && (
          <button
            onClick={() => { setFilters({ status: '', priority: '', category: '' }); setSearch('') }}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No tickets found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {['#', 'Subject', 'Customer', 'Category', 'Status', 'Priority', 'Agent', 'Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <Link to={`/tickets/${t.id}`} className="text-blue-600 hover:underline font-medium line-clamp-1">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/customers/${t.customer}`} className="text-gray-700 hover:underline">
                      {t.customer_name}
                    </Link>
                    <div className="text-xs text-gray-400">{t.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{t.category}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3 text-gray-500">{t.assigned_to || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}