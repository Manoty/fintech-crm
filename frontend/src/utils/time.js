export function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)

  if (seconds < 60)   return 'just now'
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    return `${m} ${m === 1 ? 'min' : 'mins'} ago`
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600)
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`
  }
  if (seconds < 604800) {
    const d = Math.floor(seconds / 86400)
    return `${d} ${d === 1 ? 'day' : 'days'} ago`
  }
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function fullDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}