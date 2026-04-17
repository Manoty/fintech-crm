import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor — reads token from localStorage before every request
// This bridges the gap between the auth context and this axios instance
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('payd_token')
  if (token) {
    config.headers['Authorization'] = `Token ${token}`
  }
  return config
})

// ── Customers ──────────────────────────────────────────────
export const getCustomers = (params) => api.get('/customers/', { params })
export const getCustomer  = (id)     => api.get(`/customers/${id}/`)
export const createCustomer = (data) => api.post('/customers/', data)
export const updateCustomer = (id, data) => api.put(`/customers/${id}/`, data)

// ── Tickets ────────────────────────────────────────────────
export const getTickets   = (params) => api.get('/tickets/', { params })
export const getTicket    = (id)     => api.get(`/tickets/${id}/`)
export const createTicket = (data)   => api.post('/tickets/', data)
export const updateTicket = (id, data) => api.put(`/tickets/${id}/`, data)
export const resolveTicket = (id)    => api.patch(`/tickets/${id}/resolve/`)

// ── Messages ───────────────────────────────────────────────
export const getMessages  = (ticketId) => api.get('/messages/', { params: { ticket: ticketId } })
export const postMessage  = (data)     => api.post('/messages/', data)

// ── Analytics ──────────────────────────────────────────────
export const getAnalytics = () => api.get('/analytics/summary/')