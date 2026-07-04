import React, { useState, useEffect, Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { KeyRound, ShieldCheck, Loader } from 'lucide-react'
import Login from './pages/Login'

const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Products = lazy(() => import('./pages/admin/Products'))
const Categories = lazy(() => import('./pages/admin/Categories'))
const Users = lazy(() => import('./pages/admin/Users'))
const Orders = lazy(() => import('./pages/admin/Orders'))
const Statistics = lazy(() => import('./pages/admin/Statistics'))
const AIAssistant = lazy(() => import('./pages/admin/AIAssistant'))
const Settings = lazy(() => import('./pages/admin/Settings'))
const Shifts = lazy(() => import('./pages/admin/Shifts'))
const POS = lazy(() => import('./pages/employee/POS'))
const MyOrders = lazy(() => import('./pages/employee/MyOrders'))
const Profile = lazy(() => import('./pages/employee/Profile'))
const Kitchen = lazy(() => import('./pages/kds/Kitchen'))

function LoadingFallback() {
  return (
    <div className="h-full flex items-center justify-center">
      <Loader size={24} className="text-accent animate-spin" />
    </div>
  )
}

function ActivationScreen() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    window.api.app.checkActivation().then(setActivated)
  }, [])

  const handleActivate = async () => {
    setError('')
    setLoading(true)
    try {
      const ok = await window.api.app.activate(key)
      if (ok) {
        setActivated(true)
      } else {
        setError('Clave incorrecta')
      }
    } catch {
      setError('Error al validar la clave')
    } finally {
      setLoading(false)
    }
  }

  if (activated) return null

  return (
    <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-2xl border border-border-subtle p-8 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-accent" />
          </div>
          <h1 className="text-h2 font-bold text-text-primary">QuickBite POS</h1>
          <p className="text-body-sm text-text-muted mt-1">Ingresa la clave de activación</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="password"
              placeholder="Clave de activación"
              className="w-full bg-bg-tertiary border border-border-light rounded-lg pl-9 pr-4 py-2.5 text-body-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/20 text-body-sm text-status-error text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={loading || !key.trim()}
            className="w-full bg-accent text-white rounded-lg py-2.5 text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Validando...' : 'Activar'}
          </button>

          <p className="text-caption text-text-muted text-center">
            Ingresa la clave proporcionada al adquirir el sistema
          </p>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/pos'} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <HashRouter>
      <ActivationScreen />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute role="admin"><Suspense fallback={<LoadingFallback />}><Products /></Suspense></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute role="admin"><Suspense fallback={<LoadingFallback />}><Categories /></Suspense></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><Suspense fallback={<LoadingFallback />}><Users /></Suspense></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute role="admin"><Suspense fallback={<LoadingFallback />}><Orders /></Suspense></ProtectedRoute>} />
        <Route path="/admin/statistics" element={<ProtectedRoute role="admin"><Suspense fallback={<LoadingFallback />}><Statistics /></Suspense></ProtectedRoute>} />
        <Route path="/admin/ai-assistant" element={<ProtectedRoute role="admin"><Suspense fallback={<LoadingFallback />}><AIAssistant /></Suspense></ProtectedRoute>} />
        <Route path="/admin/shifts" element={<ProtectedRoute role="admin"><Suspense fallback={<LoadingFallback />}><Shifts /></Suspense></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute role="admin"><Suspense fallback={<LoadingFallback />}><Settings /></Suspense></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute role="employee"><Suspense fallback={<LoadingFallback />}><POS /></Suspense></ProtectedRoute>} />
        <Route path="/employee/orders" element={<ProtectedRoute role="employee"><Suspense fallback={<LoadingFallback />}><MyOrders /></Suspense></ProtectedRoute>} />
        <Route path="/employee/profile" element={<ProtectedRoute role="employee"><Suspense fallback={<LoadingFallback />}><Profile /></Suspense></ProtectedRoute>} />
        <Route path="/kds" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Kitchen /></Suspense></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}
