import { useState, useEffect, useRef } from 'react'
import { getCustomers, createCustomer } from '../api'
import { Search, Plus, User } from 'lucide-react'

export default function CustomerSearch({ value, onChange }) {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [showDrop, setShowDrop]   = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const [creating, setCreating]   = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    full_name: '', phone_number: '', email: ''
  })
  const dropRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Search customers as user types
  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(() => {
      getCustomers({ search: query })
        .then(r => setResults(r.data.results || r.data))
        .catch(console.error)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const selectCustomer = (customer) => {
    onChange(customer)
    setQuery(customer.full_name)
    setShowDrop(false)
    setShowNew(false)
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.full_name || !newCustomer.phone_number) {
      alert('Full name and phone number are required.')
      return
    }
    setCreating(true)
    try {
      const res = await createCustomer(newCustomer)
      selectCustomer(res.data)
      setShowNew(false)
      setNewCustomer({ full_name: '', phone_number: '', email: '' })
    } catch (e) {
      const msg = e.response?.data?.phone_number?.[0]
        || e.response?.data?.email?.[0]
        || 'Failed to create customer.'
      alert(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative" ref={dropRef}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name or phone number..."
            value={value ? `${value.full_name} (${value.phone_number})` : query}
            onChange={e => {
              setQuery(e.target.value)
              onChange(null)
              setShowDrop(true)
            }}
            onFocus={() => { if (results.length > 0) setShowDrop(true) }}
          />
          {value && (
            <button
              onClick={() => { onChange(null); setQuery('') }}
              className="absolute right-3 top-2 text-gray-300 hover:text-gray-500 text-lg leading-none"
            >×</button>
          )}
        </div>

        {/* Dropdown results */}
        {showDrop && results.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {results.map(c => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c)}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span className="font-medium text-gray-800 text-sm">{c.full_name}</span>
                  <span className="text-gray-400 text-xs">{c.phone_number}</span>
                </div>
                {c.email && (
                  <p className="text-xs text-gray-400 ml-6">{c.email}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create new customer toggle */}
      {!value && (
        <button
          type="button"
          onClick={() => setShowNew(s => !s)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus size={14} />
          {showNew ? 'Cancel new customer' : 'Create new customer'}
        </button>
      )}

      {/* New customer inline form */}
      {showNew && !value && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase">New Customer</p>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs text-gray-500">Full Name *</label>
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jane Wanjiku"
                value={newCustomer.full_name}
                onChange={e => setNewCustomer(s => ({ ...s, full_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Phone Number * (E.164)</label>
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+254700000001"
                value={newCustomer.phone_number}
                onChange={e => setNewCustomer(s => ({ ...s, phone_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Email (optional)</label>
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="jane@example.com"
                value={newCustomer.email}
                onChange={e => setNewCustomer(s => ({ ...s, email: e.target.value }))}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreateCustomer}
            disabled={creating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {creating ? 'Creating...' : 'Create Customer'}
          </button>
        </div>
      )}

      {/* Selected customer confirmation */}
      {value && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <User size={14} className="text-green-600" />
          <div className="text-sm">
            <span className="font-medium text-green-800">{value.full_name}</span>
            <span className="text-green-600 ml-2">{value.phone_number}</span>
          </div>
        </div>
      )}
    </div>
  )
}