import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// ── Customers ──────────────────────────────────────────────
export const getCustomers = () => api.get('/customers/')
export const getCustomer = (id) => api.get(`/customers/${id}/`)
export const createCustomer = (data) => api.post('/customers/', data)
export const updateCustomer = (id, data) => api.put(`/customers/${id}/`, data)

// ── Tickets ────────────────────────────────────────────────
export const getTickets = (params) => api.get('/tickets/', { params })
export const getTicket = (id) => api.get(`/tickets/${id}/`)
export const createTicket = (data) => api.post('/tickets/', data)
export const updateTicket = (id, data) => api.put(`/tickets/${id}/`, data)
export const resolveTicket = (id) => api.patch(`/tickets/${id}/resolve/`)

// ── Messages ───────────────────────────────────────────────
export const getMessages = (ticketId) =>
  api.get('/messages/', { params: { ticket: ticketId } })
export const postMessage = (data) => api.post('/messages/', data)

// ── Analytics ──────────────────────────────────────────────
export const getAnalytics = () => api.get('/analytics/summary/')