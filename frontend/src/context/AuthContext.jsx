import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('payd_token'))
  const [loading, setLoading] = useState(true)

  // Attach token to every axios request
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`
      localStorage.setItem('payd_token', token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('payd_token')
    }
  }, [token])

  // On app load, verify stored token is still valid
  useEffect(() => {
    if (!token) { setLoading(false); return }

    axios.get('/api/auth/me/')
      .then(r => setUser(r.data))
      .catch(() => {
        // Token invalid or expired — clear it
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await axios.post('/api/auth/login/', { username, password })
    setToken(res.data.token)
    setUser(res.data.user)
    return res.data
  }, [])

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout/')
    } catch (e) {
      // Even if request fails, clear local state
    }
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}