import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login }               = useAuth()
  const navigate                = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) { setError('Please enter your username and password.'); return }
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex">

      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 bg-[#0d1220] border-r border-white/5 p-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white font-black text-base">P</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Payd CRM</span>
          </div>

          <div className="mt-16 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white leading-tight">
                Customer Support<br />
                <span className="text-emerald-400">Without Borders</span>
              </h2>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Manage every customer interaction — WhatsApp, email, and portal — from one unified workspace.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: '⚡', label: 'Real-time WhatsApp ticketing' },
                { icon: '📊', label: 'Live analytics & SLA tracking' },
                { icon: '🔒', label: 'Role-based agent access' },
                { icon: '🌍', label: 'Built for African fintech' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-gray-400 text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-xs">© 2026 Payd · Support Platform v1.0</p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white font-black text-base">P</span>
            </div>
            <span className="text-white font-bold text-lg">Payd CRM</span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your agent account</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Username
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-3 text-gray-500" />
                <input
                  type="text"
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="e.g. alice"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-3 text-gray-500" />
                <input
                  type="password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-emerald-600/20 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs">
            Need access? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}