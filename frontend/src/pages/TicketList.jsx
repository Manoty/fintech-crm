import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTickets } from '../api'
import { StatusBadge, PriorityBadge, SLABadge } from '../utils/badges'
import { SkeletonRow } from '../components/Skeleton'
import { Search, ChevronLeft, ChevronRight, InboxIcon } from 'lucide-react'

const PAGE_SIZE = 10
const STATUSES   = ['', 'open', 'in_progress', 'resolved', 'closed']
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent']
const CATEGORIES = ['', 'transaction', 'kyc', 'fraud', 'account', 'other']

export default function TicketList() {
  const [tickets, setTickets]   = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ status: '', priority: '', category: '' })
  const [search, setSearch]     = useState('')

  useEffect(() => {
    setPage(1)
  }, [filters, search])

  useEffect(() => {
    setLoading(true)
    const params = { page, page_size: PAGE_SIZE }
    if (filters.status)   params.status   = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.category) params.category = filters.category
    if (search)           params.search   = search

    getTickets(params)
      .then(r => {
        const data = r.data
        if (data.results) {
          setTickets(data.results)
          setTotal(data.count)
        } else {
          setTickets(data)
          setTotal(data.length)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filters, search, page])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const setFilter  = (key, val) => setFilters(f => ({ ...f, [key]: val }))
  const hasFilters = filters.status || filters.priority || filters.category || search

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Tickets</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} tickets {hasFilters ? 'matching filters' : 'total'}</p>
        </div>
        <Link
          to="/tickets/new"
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          + New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
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
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            value={filters[key]}
            onChange={e => setFilter(key, e.target.value)}
          >
            <option value="">All {label}s</option>
            {options.filter(Boolean).map(o => (
              <option key={o} value={o}>
                {o.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>
        ))}

        {hasFilters && (
          <button
            onClick={() => { setFilters({ status: '', priority: '', category: '' }); setSearch('') }}
            className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 uppercase text-[11px] tracking-wide border-b border-gray-100">
              <tr>
                {['#', 'Subject', 'Customer', 'Category', 'Status', 'Priority', 'SLA', 'Agent', 'Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? [...Array(PAGE_SIZE)].map((_, i) => <SkeletonRow key={i} cols={9} />)
                : tickets.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center">
                        <InboxIcon size={32} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-400 text-sm font-medium">No tickets found</p>
                        {hasFilters && (
                          <p className="text-xs text-gray-300 mt-1">Try adjusting your filters</p>
                        )}
                      </td>
                    </tr>
                  )
                  : tickets.map(t => (
                    <tr key={t.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{t.id}</td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <Link
                          to={`/tickets/${t.id}`}
                          className="text-gray-800 font-medium hover:text-emerald-600 line-clamp-1 text-xs transition-colors"
                        >
                          {t.subject}
                        </Link>
                        <p className="text-[10px] text-gray-400 mt-0.5">{t.message_count} messages</p>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/customers/${t.customer}`} className="hover:text-emerald-600 transition-colors">
                          <p className="text-xs font-medium text-gray-700">{t.customer_name}</p>
                          <p className="text-[10px] text-gray-400">{t.customer_phone}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 capitalize">{t.category}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3">
                        <SLABadge createdAt={t.created_at} status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{t.assigned_to || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    p === page
                      ? 'bg-emerald-600 text-white'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}