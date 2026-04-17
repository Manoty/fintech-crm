import { Clock } from 'lucide-react'

export function StatusBadge({ status }) {
  const styles = {
    open:        'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved:    'bg-emerald-100 text-emerald-800',
    closed:      'bg-gray-100 text-gray-500',
  }
  const labels = {
    open: 'Open', in_progress: 'In Progress',
    resolved: 'Resolved', closed: 'Closed',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const styles = {
    low:    'bg-gray-100 text-gray-500',
    medium: 'bg-blue-100 text-blue-700',
    high:   'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700 animate-pulse',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[priority] || 'bg-gray-100'}`}>
      {priority}
    </span>
  )
}

export function SLABadge({ createdAt, status }) {
  if (status === 'resolved' || status === 'closed') return null

  const hours = (Date.now() - new Date(createdAt)) / 36e5

  let color, label
  if (hours < 1)       { color = 'text-emerald-600'; label = `${Math.round(hours * 60)}m` }
  else if (hours < 4)  { color = 'text-blue-600';    label = `${Math.round(hours)}h` }
  else if (hours < 24) { color = 'text-orange-600';  label = `${Math.round(hours)}h` }
  else                 { color = 'text-red-600';      label = `${Math.round(hours / 24)}d` }

  const urgent = hours >= 24

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color} ${urgent ? 'font-bold' : ''}`}>
      <Clock size={11} className={urgent ? 'animate-pulse' : ''} />
      {label}
    </span>
  )
}