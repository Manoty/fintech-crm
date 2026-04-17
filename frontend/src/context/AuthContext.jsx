import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// ✅ 1. AXIOS INTERCEPTOR: The "Toll Booth"
// This runs before every single request leaves your app.
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('payd_token')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('payd_token'))
  const [loading, setLoading] = useState(true)

  // ✅ 2. INITIAL LOAD: Verify current session
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await axios.get('/api/auth/me/')
        setUser(res.data)
      } catch (err) {
        // If token is invalid/expired, clear everything
        console.error("Session expired or invalid")
        setToken(null)
        setUser(null)
        localStorage.removeItem('payd_token')
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [token])

  // ✅ 3. LOGIN: Authenticate and Save
  const login = useCallback(async (username, password) => {
    try {
      const res = await axios.post('/api/auth/login/', { username, password })
      const newToken = res.data.token

      // Save to localStorage immediately so the Interceptor can find it
      localStorage.setItem('payd_token', newToken)
      setToken(newToken)

      // Fetch user profile
      const userRes = await axios.get('/api/auth/me/')
      setUser(userRes.data)
      
      return res.data
    } catch (error) {
      throw error // Let the UI handle the error message
    }
  }, [])

  // ✅ 4. LOGOUT: Clear and Reset
  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout/')
    } catch (e) {
      console.warn("Server-side logout failed, clearing local state anyway.")
    } finally {
      localStorage.removeItem('payd_token')
      setToken(null)
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}