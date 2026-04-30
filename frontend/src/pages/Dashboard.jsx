import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalytics, getTickets } from '../api'
import { StatusBadge, PriorityBadge, SLABadge } from '../utils/badges'
import { SkeletonStatCards, SkeletonRow } from '../components/Skeleton'
import {
  TicketCheck, Clock, AlertCircle,
  InboxIcon, ChevronLeft, ChevronRight,
  TrendingUp, Activity
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 5

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-black text-gray-800 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <li className="flex items-center gap-3">
      <span className="text-xs text-gray-500 capitalize w-24 truncate">
        {label.replace('_', ' ')}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 w-5 text-right">
        {value}
      </span>
    </li>
  )
}

export default function Dashboard() {
  const [analytics, setAnalytics]       = useState(null)
  const [tickets, setTickets]           = useState([])
  const [totalTickets, setTotalTickets] = useState(0)
  const [page, setPage]                 = useState(1)
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingTable, setLoadingTable] = useState(true)

  const { user } = useAuth()
  const [myTickets, setMyTickets] = useState(false)

  // Load analytics
  useEffect(() => {
    getAnalytics()
      .then(r => setAnalytics(r.data))
      .catch(console.error)
      .finally(() => setLoadingStats(false))
  }, [])

  // Load tickets (FIXED: params properly defined)
  useEffect(() => {
    const params = {
      page,
      page_size: PAGE_SIZE,
      ...(myTickets ? { mine: true } : {})
    }

    setLoadingTable(true)

    getTickets(params)
      .then(r => {
        const data = r.data

        if (data.results) {
          setTickets(data.results)
          setTotalTickets(data.count)
        } else {
          const all = data
          setTotalTickets(all.length)
          setTickets(all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE))
        }
      })
      .catch(console.error)
      .finally(() => setLoadingTable(false))
  }, [page, myTickets])

  const totalPages = Math.ceil(totalTickets / PAGE_SIZE)

  const categoryColors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
    'bg-purple-500', 'bg-pink-500'
  ]

  const categoryValues = Object.values(analytics?.tickets_by_category || {})
  const maxCategory = Math.max(...categoryValues, 1)

  const priorityValues = Object.values(analytics?.tickets_by_priority || {})
  const maxPriority = Math.max(...priorityValues, 1)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-KE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <Link
          to="/tickets/new"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
        >
          + New Ticket
        </Link>
      </div>

      {/* Stat Cards */}
      {loadingStats ? (
        <SkeletonStatCards />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tickets" value={analytics?.total_tickets} icon={InboxIcon} color="bg-blue-500" sub="All time" />
          <StatCard label="Open Now" value={analytics?.open_tickets} icon={AlertCircle} color="bg-amber-500" sub={`${analytics?.in_progress_tickets || 0} in progress`} />
          <StatCard label="Resolved" value={analytics?.resolved_tickets} icon={TicketCheck} color="bg-emerald-500" sub="Closed tickets" />
          <StatCard
            label="Avg Resolution"
            value={
              analytics?.avg_resolution_time_hours != null
                ? analytics.avg_resolution_time_hours < 1
                  ? `${Math.round(analytics.avg_resolution_time_hours * 60)}m`
                  : `${analytics.avg_resolution_time_hours}h`
                : 'N/A'
            }
            icon={Clock}
            color="bg-violet-500"
            sub="Per ticket"
          />
        </div>
      )}

      {/* Breakdown */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Category */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="text-xs font-semibold text-gray-500 mb-4 uppercase">By Category</h2>
            <ul className="space-y-3">
              {Object.entries(analytics.tickets_by_category || {}).map(([k, v], i) => (
                <MiniBar
                  key={k}
                  label={k}
                  value={v}
                  max={maxCategory}
                  color={categoryColors[i % categoryColors.length]}
                />
              ))}
            </ul>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="text-xs font-semibold text-gray-500 mb-4 uppercase">By Priority</h2>
            <ul className="space-y-3">
              {[
                { k: 'urgent', color: 'bg-red-500' },
                { k: 'high', color: 'bg-orange-500' },
                { k: 'medium', color: 'bg-blue-500' },
                { k: 'low', color: 'bg-gray-400' }
              ].map(({ k, color }) => (
                <MiniBar
                  key={k}
                  label={k}
                  value={analytics.tickets_by_priority?.[k] || 0}
                  max={maxPriority}
                  color={color}
                />
              ))}
            </ul>
          </div>

          {/* Last 7 days */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="text-xs font-semibold text-gray-500 mb-4 uppercase">Last 7 Days</h2>

            {analytics.tickets_last_7_days?.length > 0 ? (
              <div className="flex items-end gap-1.5 h-20">
                {analytics.tickets_last_7_days.map(({ date, count }) => {
                  const max = Math.max(...analytics.tickets_last_7_days.map(d => d.count), 1)
                  const pct = Math.round((count / max) * 100)

                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1 relative group">
                      <div className="absolute -top-6 bg-gray-800 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100">
                        {count}
                      </div>
                      <div
                        className="w-full bg-emerald-500 rounded-t-sm"
                        style={{ height: `${Math.max(pct, 8)}%` }}
                      />
                      <span className="text-[9px] text-gray-400">
                        {new Date(date).toLocaleDateString('en', { weekday: 'short' }).charAt(0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">No activity</p>
            )}
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border">

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <div>
            <h2 className="font-bold">Recent Tickets</h2>
            <p className="text-xs text-gray-400">{totalTickets} total</p>
          </div>

          <div className="flex items-center gap-3">

            {/* Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => { setMyTickets(m => !m); setPage(1) }}
                className={`w-8 h-4 rounded-full relative ${myTickets ? 'bg-emerald-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${myTickets ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-gray-500">My tickets</span>
            </label>

            <Link to="/tickets" className="text-xs text-emerald-600">View all →</Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-400">
              <tr>
                {['#','Subject','Customer','Status','Priority','SLA','Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y">
              {loadingTable ? (
                [...Array(PAGE_SIZE)].map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No tickets yet
                  </td>
                </tr>
              ) : (
                tickets.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">#{t.id}</td>
                    <td className="px-4 py-3">
                      <Link to={`/tickets/${t.id}`} className="hover:text-emerald-600">
                        {t.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.customer_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3">
                      <SLABadge createdAt={t.created_at} status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-5 py-3 border-t bg-gray-50">
            <p className="text-xs text-gray-400">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={p === page ? 'text-emerald-600 font-bold' : ''}
                >
                  {p}
                </button>
              ))}

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}