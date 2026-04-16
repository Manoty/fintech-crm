import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createTicket } from '../api'
import CustomerSearch from '../components/CustomerSearch'
import { ArrowLeft, Send } from 'lucide-react'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const CATEGORIES = ['transaction', 'kyc', 'fraud', 'account', 'other']

const PRIORITY_COLORS = {
  low:    'border-gray-300 bg-gray-50 text-gray-600',
  medium: 'border-blue-300 bg-blue-50 text-blue-700',
  high:   'border-orange-300 bg-orange-50 text-orange-700',
  urgent: 'border-red-300 bg-red-50 text-red-700',
}

export default function NewTicket() {
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [form, setForm] = useState({
    subject:     '',
    description: '',
    priority:    'medium',
    category:    'other',
    assigned_to: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]         = useState({})

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const validate = () => {
    const e = {}
    if (!customer)        e.customer    = 'Please select or create a customer.'
    if (!form.subject.trim()) e.subject = 'Subject is required.'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setSubmitting(true)
    try {
      const res = await createTicket({
        customer:    customer.id,
        subject:     form.subject.trim(),
        description: form.description.trim(),
        priority:    form.priority,
        category:    form.category,
        assigned_to: form.assigned_to.trim(),
        status:      'open',
      })
      navigate(`/tickets/${res.data.id}`)
    } catch (err) {
      const data = err.response?.data || {}
      setErrors(data)
      console.error(data)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/tickets"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">New Ticket</h1>
          <p className="text-sm text-gray-400">Create a support ticket for a customer</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">

        {/* Customer */}
        <div className="p-5 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Customer <span className="text-red-400">*</span>
          </label>
          <CustomerSearch value={customer} onChange={setCustomer} />
          {errors.customer && (
            <p className="text-xs text-red-500">{errors.customer}</p>
          )}
        </div>

        {/* Subject */}
        <div className="p-5 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Subject <span className="text-red-400">*</span>
          </label>
          <input
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.subject ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="Brief description of the issue e.g. M-Pesa transfer failed"
            value={form.subject}
            onChange={e => set('subject', e.target.value)}
          />
          {errors.subject && (
            <p className="text-xs text-red-500">{errors.subject}</p>
          )}
        </div>

        {/* Description */}
        <div className="p-5 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Description
            <span className="ml-2 text-xs font-normal text-gray-400">Optional — full details</span>
          </label>
          <textarea
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Provide as much detail as possible about the customer's issue..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        {/* Priority */}
        <div className="p-5 space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => set('priority', p)}
                className={`py-2 rounded-lg border text-sm font-medium capitalize transition-all ${
                  form.priority === p
                    ? PRIORITY_COLORS[p] + ' ring-2 ring-offset-1 ' +
                      (p === 'low' ? 'ring-gray-400' :
                       p === 'medium' ? 'ring-blue-400' :
                       p === 'high' ? 'ring-orange-400' : 'ring-red-400')
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="p-5 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Category</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('category', c)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                  form.category === c
                    ? 'border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-400 ring-offset-1'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Assigned To */}
        <div className="p-5 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Assign To
            <span className="ml-2 text-xs font-normal text-gray-400">Optional</span>
          </label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Agent name e.g. Alice Mwangi"
            value={form.assigned_to}
            onChange={e => set('assigned_to', e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="p-5 flex items-center justify-between bg-gray-50 rounded-b-xl">
          <Link
            to="/tickets"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            <Send size={15} />
            {submitting ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}