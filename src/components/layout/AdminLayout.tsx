import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BarChart3, ShoppingBag, Package, Grid3X3, Users,
  Bot, Settings, Zap, ChevronLeft, ChevronRight, LogOut, Bell, Clock
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { TitleBar } from '../ui/TitleBar'
import { Button } from '../ui/Button'
import { useInactivityTimeout } from '../../hooks/useInactivityTimeout'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
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

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/statistics', icon: BarChart3, label: 'Estadísticas' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Órdenes', badge: '?' },
    { to: '/admin/products', icon: Package, label: 'Productos' },
    { to: '/admin/categories', icon: Grid3X3, label: 'Categorías' },
    { to: '/admin/users', icon: Users, label: 'Empleados' },
    { to: '/admin/ai-assistant', icon: Bot, label: 'Asistente IA' },
    { to: '/admin/shifts', icon: Clock, label: 'Turnos' },
    { to: '/admin/settings', icon: Settings, label: 'Configuración' },
  ]

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`bg-bg-secondary border-r border-border-subtle flex flex-col transition-all duration-200 ${
            collapsed ? 'w-16' : 'w-56'
          }`}
        >
          <div className="flex items-center h-12 px-3 border-b border-border-subtle">
            {!collapsed && (
              <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
                  <Zap size={12} className="text-white" />
                </div>
                <span className="text-body-sm font-semibold text-text-primary">QuickBite</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted transition-colors"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className="flex-1 py-3 space-y-0.5 px-2">
            {!collapsed && (
              <p className="text-label text-text-hint px-3 py-2 uppercase tracking-wider">Principal</p>
            )}
            {navItems.slice(0, 3).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-body-sm ${
                    isActive
                      ? 'bg-accent-muted text-accent'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  }`
                }
              >
                <item.icon size={18} />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="w-5 h-5 rounded-full bg-accent text-white text-label flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}

            {!collapsed && (
              <p className="text-label text-text-hint px-3 py-2 mt-3 uppercase tracking-wider">Gestión</p>
            )}
            {navItems.slice(3, 6).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-body-sm ${
                    isActive
                      ? 'bg-accent-muted text-accent'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  }`
                }
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}

            {!collapsed && (
              <p className="text-label text-text-hint px-3 py-2 mt-3 uppercase tracking-wider">Sistema</p>
            )}
            {navItems.slice(6).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-body-sm ${
                    isActive
                      ? 'bg-accent-muted text-accent'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  }`
                }
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-border-subtle">
            {!collapsed ? (
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-label font-semibold text-accent">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-caption font-medium text-text-primary truncate">{user?.name}</p>
                  <p className="text-label text-text-muted capitalize">{user?.role}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-label font-semibold text-accent">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full mt-2 px-3 py-2 rounded-lg text-text-muted hover:text-status-error hover:bg-status-error/10 transition-colors text-body-sm"
            >
              <LogOut size={16} />
              {!collapsed && <span>Cerrar sesión</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
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
