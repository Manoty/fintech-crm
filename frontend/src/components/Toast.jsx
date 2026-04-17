import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const remove = (id) => setToasts(t => t.filter(x => x.id !== id))

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />,
    error:   <XCircle size={16} className="text-red-400 flex-shrink-0" />,
    warning: <AlertCircle size={16} className="text-yellow-400 flex-shrink-0" />,
  }

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 w-80">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-start gap-3 bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl shadow-2xl animate-fade-in"
          >
            {icons[t.type]}
            <p className="text-sm flex-1 leading-snug">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}