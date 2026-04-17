import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomers } from '../api'
import { SkeletonRow } from '../components/Skeleton'
import { Search, Users, ChevronLeft, ChevronRight, Phone, Mail } from 'lucide-react'
import { timeAgo } from '../utils/time'

const PAGE_SIZE = 10

export default function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => { setPage(1) }, [search])

  useEffect(() => {
    setLoading(true)
    const params = { page, page_size: PAGE_SIZE }
    if (search) params.search = search

    getCustomers(params)
      .then(r => {
        const data = r.data
        if (data.results) {
          setCustomers(data.results)
          setTotal(data.count)
        } else {
          setCustomers(data)
          setTotal(data.length)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} registered customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 uppercase text-[11px] tracking-wide border-b border-gray-100">
              <tr>
                {['Customer', 'Phone', 'Email', 'Tickets', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? [...Array(PAGE_SIZE)].map((_, i) => <SkeletonRow key={i} cols={6} />)
                : customers.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <Users size={32} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-400 text-sm font-medium">
                          {search ? 'No customers match your search' : 'No customers yet'}
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          Customers are created when a WhatsApp message arrives or a ticket is created
                        </p>
                      </td>
                    </tr>
                  )
                  : customers.map(c => (
                    <tr key={c.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-700 text-xs font-bold">
                              {c.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <Link
                              to={`/customers/${c.id}`}
                              className="text-sm font-semibold text-gray-800 hover:text-emerald-600 transition-colors"
                            >
                              {c.full_name}
                            </Link>
                            <p className="text-[10px] text-gray-400">ID #{c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone size={11} className="text-gray-400" />
                          {c.phone_number}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.email
                          ? (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Mail size={11} className="text-gray-400" />
                              {c.email}
                            </div>
                          )
                          : <span className="text-xs text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          c.ticket_count > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {c.ticket_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        <span title={new Date(c.created_at).toLocaleString()}>
                          {timeAgo(c.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/customers/${c.id}`}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            View Profile
                          </Link>
                          <span className="text-gray-200">·</span>
                          <Link
                            to={`/tickets?customer=${c.id}`}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Tickets
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    p === page ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
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