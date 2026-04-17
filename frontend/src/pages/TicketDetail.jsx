import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTicket, postMessage, resolveTicket, updateTicket } from '../api'
import { StatusBadge, PriorityBadge } from '../utils/badges'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { timeAgo, fullDateTime } from '../utils/time'
import {
  Lock, Send, CheckCircle, Activity,
  User, MessageSquare, Clock
} from 'lucide-react'

function SystemEvent({ msg }) {
  return (
    <div className="flex items-center gap-3 py-1 my-1">
      <div className="flex-1 h-px bg-gray-100" />
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 whitespace-nowrap">
        <Activity size={10} />
        <span>{msg.body}</span>
        <span className="text-gray-300">·</span>
        <span title={fullDateTime(msg.created_at)}>{timeAgo(msg.created_at)}</span>
      </div>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

function InternalNote({ msg }) {
  return (
    <div className="flex justify-center my-2">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 max-w-lg w-full">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold">
            <Lock size={11} />
            Internal Note · {msg.sender_name}
          </div>
          <span
            className="text-[10px] text-amber-400"
            title={fullDateTime(msg.created_at)}
          >
            {timeAgo(msg.created_at)}
          </span>
        </div>
        <p className="text-sm text-amber-900 leading-relaxed">{msg.body}</p>
      </div>
    </div>
  )
}

function MessageBubble({ msg }) {
  if (msg.message_type === 'system')   return <SystemEvent msg={msg} />
  if (msg.is_internal)                 return <InternalNote msg={msg} />

  const isCustomer = msg.message_type === 'customer'

  return (
    <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} my-1.5`}>
      <div className={`max-w-sm rounded-2xl px-4 py-3 shadow-sm ${
        isCustomer
          ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
          : 'bg-emerald-600 text-white rounded-tr-none'
      }`}>
        <div className={`flex items-center justify-between gap-4 mb-1`}>
          <p className={`text-[11px] font-semibold ${isCustomer ? 'text-gray-400' : 'text-emerald-200'}`}>
            {msg.sender_name}
            {msg.channel !== 'portal' && (
              <span className="ml-1 opacity-70">· {msg.channel}</span>
            )}
          </p>
          <span
            className={`text-[10px] ${isCustomer ? 'text-gray-300' : 'text-emerald-200'}`}
            title={fullDateTime(msg.created_at)}
          >
            {timeAgo(msg.created_at)}
          </span>
        </div>
        <p className="text-sm leading-relaxed">{msg.body}</p>
      </div>
    </div>
  )
}

export default function TicketDetail() {
  const { id }                          = useParams()
  const { user }                        = useAuth()
  const toast                           = useToast()
  const [ticket, setTicket]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [replyBody, setReplyBody]       = useState('')
  const [isInternal, setIsInternal]     = useState(false)
  const [senderName, setSenderName]     = useState('')
  const [sending, setSending]           = useState(false)
  const [resolving, setResolving]       = useState(false)
  const bottomRef                       = useRef(null)

  useEffect(() => {
    if (user) setSenderName(user.full_name)
  }, [user])

  const fetchTicket = () =>
    getTicket(id).then(r => setTicket(r.data)).catch(() => toast('Failed to load ticket.', 'error'))

  useEffect(() => {
    setLoading(true)
    fetchTicket().finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages?.length])

  const handleSend = async () => {
    if (!replyBody.trim()) return
    setSending(true)
    try {
      await postMessage({
        ticket:       parseInt(id),
        message_type: isInternal ? 'internal' : 'agent',
        channel:      isInternal ? 'internal' : 'portal',
        sender_name:  senderName,
        body:         replyBody.trim(),
        is_internal:  isInternal,
      })
      setReplyBody('')
      toast(isInternal ? 'Internal note added.' : 'Reply sent.', 'success')
      await fetchTicket()
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to send message.', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async () => {
    setResolving(true)
    try {
      await resolveTicket(id)
      await fetchTicket()
      toast('Ticket resolved successfully.', 'success')
    } catch (e) {
      toast(e.response?.data?.detail || 'Could not resolve ticket.', 'error')
    } finally {
      setResolving(false)
    }
  }

  const handleFieldChange = async (field, value) => {
    try {
      await updateTicket(id, { ...ticket, customer: ticket.customer, [field]: value })
      await fetchTicket()
      toast(`${field.replace('_', ' ')} updated.`, 'success')
    } catch (e) {
      toast('Update failed.', 'error')
    }
  }

  const customerMessages = ticket?.messages?.filter(m => m.message_type === 'customer').length || 0
  const agentMessages    = ticket?.messages?.filter(m => m.message_type === 'agent').length || 0
  const internalNotes    = ticket?.messages?.filter(m => m.is_internal).length || 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )
  if (!ticket) return (
    <div className="p-10 text-center text-red-400">Ticket not found.</div>
  )

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">

      {/* ── Chat thread ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                  {ticket.category}
                </span>
              </div>
              <h1 className="font-bold text-gray-800 text-base leading-snug truncate">
                {ticket.subject}
              </h1>
              <Link
                to={`/customers/${ticket.customer}`}
                className="text-xs text-emerald-600 hover:underline mt-0.5 inline-block"
              >
                {ticket.customer_name} · {ticket.customer_phone}
              </Link>
            </div>
            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex-shrink-0"
              >
                <CheckCircle size={13} />
                {resolving ? 'Resolving...' : 'Resolve'}
              </button>
            )}
          </div>

          {/* Thread stats */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <User size={11} /> <span>{customerMessages} from customer</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <MessageSquare size={11} /> <span>{agentMessages} agent replies</span>
            </div>
            {internalNotes > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500">
                <Lock size={11} /> <span>{internalNotes} internal notes</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
              <Clock size={11} />
              <span title={fullDateTime(ticket.created_at)}>
                Opened {timeAgo(ticket.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50/50 space-y-0.5">
          {ticket.messages?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <MessageSquare size={32} className="mb-2" />
              <p className="text-sm">No messages yet</p>
            </div>
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
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Your name"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
            />
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={e => setIsInternal(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <Lock size={11} className="text-amber-500" />
              <span className="text-gray-500">Internal note</span>
            </label>
          </div>
          <div className="flex gap-2">
            <textarea
              rows={2}
              className={`flex-1 border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 transition-colors ${
                isInternal
                  ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-400 placeholder-amber-300'
                  : 'border-gray-200 focus:ring-emerald-500'
              }`}
              placeholder={isInternal
                ? 'Internal note — not visible to customer...'
                : 'Reply to customer... (Enter to send)'}
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !replyBody.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 rounded-xl transition-colors flex items-center"
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={15} />
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────── */}
      <div className="w-60 space-y-3 flex-shrink-0 overflow-y-auto">

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ticket Controls</h2>

          {[
            { label: 'Status', field: 'status', options: ['open','in_progress','resolved','closed'] },
            { label: 'Priority', field: 'priority', options: ['low','medium','high','urgent'] },
            { label: 'Category', field: 'category', options: ['transaction','kyc','fraud','account','other'] },
          ].map(({ label, field, options }) => (
            <div key={field}>
              <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{label}</label>
              <select
                className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
                value={ticket[field]}
                onChange={e => handleFieldChange(field, e.target.value)}
              >
                {options.map(o => (
                  <option key={o} value={o}>
                    {o.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div>
            <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">
              Assigned To
            </label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Agent name"
              defaultValue={ticket.assigned_to}
              onBlur={e => {
                if (e.target.value !== ticket.assigned_to) {
                  handleFieldChange('assigned_to', e.target.value)
                }
              }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Timeline</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span className="text-gray-600 font-medium" title={fullDateTime(ticket.created_at)}>
                {timeAgo(ticket.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Updated</span>
              <span className="text-gray-600 font-medium" title={fullDateTime(ticket.updated_at)}>
                {timeAgo(ticket.updated_at)}
              </span>
            </div>
            {ticket.resolved_at && (
              <div className="flex justify-between">
                <span className="text-gray-400">Resolved</span>
                <span className="text-emerald-600 font-medium" title={fullDateTime(ticket.resolved_at)}>
                  {timeAgo(ticket.resolved_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Customer card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Customer</h2>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-700 text-xs font-bold">
                {ticket.customer_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{ticket.customer_name}</p>
              <p className="text-[10px] text-gray-400 truncate">{ticket.customer_phone}</p>
            </div>
          </div>
          <Link
            to={`/customers/${ticket.customer}`}
            className="block text-center text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-200 rounded-lg py-1.5 hover:bg-emerald-50 transition-colors"
          >
            View Profile →
          </Link>
        </div>
      </div>
    </div>
  )
}