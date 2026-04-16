import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTicket, postMessage, resolveTicket, updateTicket } from '../api'
import { StatusBadge, PriorityBadge } from '../utils/badges'
import { Lock, Send, CheckCircle } from 'lucide-react'

function MessageBubble({ msg }) {
  if (msg.is_internal) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 max-w-lg w-full">
          <div className="flex items-center gap-1 text-yellow-700 text-xs font-semibold mb-1">
            <Lock size={11} /> Internal Note — {msg.sender_name}
          </div>
          <p className="text-sm text-yellow-900">{msg.body}</p>
          <p className="text-xs text-yellow-400 mt-1 text-right">
            {new Date(msg.created_at).toLocaleTimeString()}
          </p>
        </div>
      </div>
    )
  }

  const isCustomer = msg.message_type === 'customer'

  return (
    <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} my-1`}>
      <div className={`max-w-sm rounded-2xl px-4 py-2.5 shadow-sm ${
        isCustomer
          ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
          : 'bg-blue-600 text-white rounded-tr-none'
      }`}>
        <p className={`text-xs font-semibold mb-0.5 ${isCustomer ? 'text-gray-400' : 'text-blue-200'}`}>
          {msg.sender_name} · {msg.channel}
        </p>
        <p className="text-sm leading-relaxed">{msg.body}</p>
        <p className={`text-xs mt-1 text-right ${isCustomer ? 'text-gray-300' : 'text-blue-200'}`}>
          {new Date(msg.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

export default function TicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [replyBody, setReplyBody]   = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [senderName, setSenderName] = useState('Agent')
  const [sending, setSending]       = useState(false)
  const [resolving, setResolving]   = useState(false)
  const bottomRef = useRef(null)

  const fetchTicket = () =>
    getTicket(id).then(r => setTicket(r.data)).catch(console.error)

  useEffect(() => {
    setLoading(true)
    fetchTicket().finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const handleSend = async () => {
    if (!replyBody.trim()) return
    setSending(true)
    try {
      await postMessage({
        ticket: parseInt(id),
        message_type: isInternal ? 'internal' : 'agent',
        channel: isInternal ? 'internal' : 'portal',
        sender_name: senderName,
        body: replyBody.trim(),
        is_internal: isInternal,
      })
      setReplyBody('')
      await fetchTicket()
    } catch (e) {
      alert('Failed to send message.')
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async () => {
    if (!window.confirm('Mark this ticket as resolved?')) return
    setResolving(true)
    try {
      await resolveTicket(id)
      await fetchTicket()
    } catch (e) {
      alert(e.response?.data?.detail || 'Could not resolve ticket.')
    } finally {
      setResolving(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTicket(id, { ...ticket, customer: ticket.customer, status: newStatus })
      await fetchTicket()
    } catch (e) { console.error(e) }
  }

  const handlePriorityChange = async (newPriority) => {
    try {
      await updateTicket(id, { ...ticket, customer: ticket.customer, priority: newPriority })
      await fetchTicket()
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="p-10 text-center text-gray-400">Loading ticket...</div>
  if (!ticket) return <div className="p-10 text-center text-red-400">Ticket not found.</div>

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">

      {/* ── Left: Chat thread ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400 text-sm">#{ticket.id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="font-semibold text-gray-800 text-lg leading-tight">{ticket.subject}</h1>
            <Link to={`/customers/${ticket.customer}`} className="text-sm text-blue-500 hover:underline">
              {ticket.customer_name} · {ticket.customer_phone}
            </Link>
          </div>
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle size={15} />
              {resolving ? 'Resolving...' : 'Resolve'}
            </button>
          )}
        </div>

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50 space-y-1">
          {ticket.messages?.length === 0 && (
            <div className="text-center text-gray-300 mt-20">No messages yet.</div>
          )}
          {ticket.messages?.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        <div className="border-t border-gray-100 p-4 bg-white space-y-2">
          <div className="flex items-center gap-3">
            <input
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
            />
            <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={e => setIsInternal(e.target.checked)}
                className="rounded"
              />
              <Lock size={13} className="text-yellow-500" />
              <span className="text-gray-600">Internal note</span>
            </label>
          </div>
          <div className="flex gap-2">
            <textarea
              rows={2}
              className={`flex-1 border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 ${
                isInternal
                  ? 'border-yellow-300 bg-yellow-50 focus:ring-yellow-400'
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
              placeholder={isInternal ? 'Internal note (not sent to customer)...' : 'Reply to customer...'}
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !replyBody.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 rounded-lg transition-colors flex items-center gap-1"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Ticket metadata ────────────────────────────── */}
      <div className="w-64 space-y-4 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm">Ticket Details</h2>

          <div>
            <label className="text-xs text-gray-400 uppercase">Status</label>
            <select
              className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
              value={ticket.status}
              onChange={e => handleStatusChange(e.target.value)}
            >
              {['open','in_progress','resolved','closed'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase">Priority</label>
            <select
              className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
              value={ticket.priority}
              onChange={e => handlePriorityChange(e.target.value)}
            >
              {['low','medium','high','urgent'].map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase">Category</label>
            <p className="mt-1 text-sm text-gray-700 capitalize">{ticket.category}</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase">Assigned To</label>
            <p className="mt-1 text-sm text-gray-700">{ticket.assigned_to || 'Unassigned'}</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase">Created</label>
            <p className="mt-1 text-sm text-gray-700">{new Date(ticket.created_at).toLocaleString()}</p>
          </div>

          {ticket.resolved_at && (
            <div>
              <label className="text-xs text-gray-400 uppercase">Resolved</label>
              <p className="mt-1 text-sm text-green-600">{new Date(ticket.resolved_at).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}