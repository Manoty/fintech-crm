import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCustomer, getTickets } from '../api'
import { StatusBadge, PriorityBadge } from '../utils/badges'
import { Phone, Mail, Calendar } from 'lucide-react'

export default function CustomerProfile() {
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [tickets, setTickets]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getCustomer(id), getTickets({ customer: id })])
      .then(([c, t]) => {
        setCustomer(c.data)
        setTickets(t.data.results || t.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-10 text-center text-gray-400">Loading...</div>
  if (!customer) return <div className="p-10 text-center text-red-400">Customer not found.</div>

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-start gap-5">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold flex-shrink-0">
          {customer.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{customer.full_name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Phone size={13} />{customer.phone_number}</span>
            {customer.email && <span className="flex items-center gap-1"><Mail size={13} />{customer.email}</span>}
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              Joined {new Date(customer.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800">{customer.ticket_count}</p>
          <p className="text-xs text-gray-400">Total Tickets</p>
        </div>
      </div>

      {/* Ticket history */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Ticket History</h2>
        </div>
        {tickets.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No tickets yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {['#', 'Subject', 'Status', 'Priority', 'Category', 'Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/tickets/${t.id}`} className="text-blue-600 hover:underline">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3 capitalize text-gray-600">{t.category}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}