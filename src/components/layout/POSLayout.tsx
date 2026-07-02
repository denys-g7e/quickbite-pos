import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, LogOut, ShoppingCart, User, Clock, ClipboardList } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { TitleBar } from '../ui/TitleBar'
import { Button } from '../ui/Button'
import { useInactivityTimeout } from '../../hooks/useInactivityTimeout'

interface POSLayoutProps {
  children: React.ReactNode
}

export function POSLayout({ children }: POSLayoutProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [timeoutMinutes, setTimeoutMinutes] = useState(5)
  const [timeoutEnabled, setTimeoutEnabled] = useState(true)

  useEffect(() => {
    window.api.settings.get('session_timeout').then((v) => {
      const val = parseInt(v || '5', 10)
      setTimeoutMinutes(val > 0 ? val : 0)
      setTimeoutEnabled(val !== 0)
    }).catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
  }

  const { showWarning, countdown, dismissWarning } = useInactivityTimeout({
    timeoutMinutes,
    enabled: timeoutEnabled,
    onTimeout: handleLogout,
  })

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-16 bg-bg-secondary border-r border-border-subtle flex flex-col items-center py-3 gap-2">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center mb-2">
            <Zap size={20} className="text-white" />
          </div>

          <div className="flex-1 flex flex-col items-center gap-2 mt-4">
            <button
              onClick={() => navigate('/pos')}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              title="POS"
            >
              <ShoppingCart size={18} />
            </button>
            <button
              onClick={() => navigate('/employee/orders')}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              title="Mis órdenes"
            >
              <ClipboardList size={18} />
            </button>
            <button
              onClick={() => navigate('/employee/profile')}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              title="Mi perfil"
            >
              <User size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 mt-auto pb-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-label font-semibold text-accent">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <span className="text-label text-text-muted">{user?.name?.split(' ')[0]}</span>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {showWarning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-bg-secondary rounded-2xl p-6 max-w-sm mx-4 border border-border-light shadow-2xl text-center">
            <Clock size={40} className="mx-auto mb-3 text-accent" />
            <h3 className="text-title font-semibold text-text-primary mb-2">¿Sigues ahí?</h3>
            <p className="text-body-sm text-text-muted mb-2">La sesión se cerrará en <span className="font-bold text-accent">{countdown}</span> segundos por inactividad.</p>
            <Button onClick={dismissWarning} className="w-full">Seguir aquí</Button>
          </div>
        </div>
      )}
    </div>
  )
}
