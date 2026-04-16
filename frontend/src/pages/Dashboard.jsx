import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalytics, getTickets } from '../api'
import { StatusBadge, PriorityBadge } from '../utils/badges'
import { TicketCheck, Clock, AlertCircle, InboxIcon } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [analytics, setAnalytics]         = useState(null)
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    Promise.all([
      getAnalytics().catch(() => ({ data: null })),
      getTickets({ page_size: 8 }).catch(() => ({ data: [] })),
    ])
      .then(([a, t]) => {
        setAnalytics(a.data)
        setRecentTickets(t.data.results || t.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      Loading dashboard...
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={analytics?.total_tickets}
          icon={InboxIcon}
          color="bg-blue-500"
        />
        <StatCard
          label="Open Tickets"
          value={analytics?.open_tickets}
          icon={AlertCircle}
          color="bg-yellow-500"
        />
        <StatCard
          label="Resolved"
          value={analytics?.resolved_tickets}
          icon={TicketCheck}
          color="bg-green-500"
        />
        <StatCard
          label="Avg Resolution"
          value={
            analytics?.avg_resolution_time_hours
              ? `${analytics.avg_resolution_time_hours}h`
              : 'N/A'
          }
          icon={Clock}
          color="bg-purple-500"
        />
      </div>

      {/* ── Breakdown Panels ───────────────────────────────────── */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'By Status',   data: analytics.tickets_by_status },
            { title: 'By Priority', data: analytics.tickets_by_priority },
            { title: 'By Category', data: analytics.tickets_by_category },
          ].map(({ title, data }) => (
            <div
              key={title}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <h2 className="text-sm font-semibold text-gray-500 mb-3">{title}</h2>
              <ul className="space-y-2">
                {Object.entries(data || {}).map(([k, v]) => (
                  <li key={k} className="flex justify-between text-sm">
                    <span className="capitalize text-gray-600">
                      {k.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-gray-800">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* ── Recent Tickets ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Recent Tickets</h2>
          <Link to="/tickets" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {['#', 'Subject', 'Customer', 'Status', 'Priority', 'Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-300">
                    No tickets yet.
                  </td>
                </tr>
              )}
              {recentTickets.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/tickets/${t.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.customer_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}