import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, KeyRound, TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const [role, setRole] = useState<'admin' | 'employee'>('admin')
  const [mode, setMode] = useState<'credentials' | 'pin'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pinAttempts, setPinAttempts] = useState(0)
  const [pinBlocked, setPinBlocked] = useState(false)
  const [pinBlockTimer, setPinBlockTimer] = useState(0)

  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pinBlocked) return
    setLoading(true)

    try {
      if (mode === 'pin') {
        const user = await window.api.auth.verifyPin(pin)
        if (user.role !== 'employee') {
          setError('El PIN solo es para empleados')
          setLoading(false)
          setPinAttempts((prev) => prev + 1)
          return
        }
        login(user)
        navigate('/pos')
      } else {
        const user = await window.api.auth.login({ email, password })
        if (user.role !== role) {
          setError(`Este usuario no tiene rol de ${role === 'admin' ? 'Administrador' : 'Empleado'}`)
          setLoading(false)
          return
        }
        login(user)
        navigate(role === 'admin' ? '/admin/dashboard' : '/pos')
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
      if (mode === 'pin') {
        setPinAttempts((prev) => {
          const next = prev + 1
          if (next >= 3) {
            setPinBlocked(true)
            setPinBlockTimer(30)
            const interval = setInterval(() => {
              setPinBlockTimer((t) => {
                if (t <= 1) { clearInterval(interval); setPinBlocked(false); setPinAttempts(0); return 0 }
                return t - 1
              })
            }, 1000)
          }
          return next
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex bg-bg-primary">
      <div className="w-[55%] p-12 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]">
          <div className="absolute top-20 left-20 w-64 h-64 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/25">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-h2 font-bold text-text-primary">QuickBite</h1>
              <p className="text-label text-text-muted">Sistema de Punto de Venta</p>
            </div>
          </div>

          <p className="text-body text-text-secondary mt-8 leading-relaxed">
            Sistema de punto de venta para restaurantes de comida rápida. Gestión de pedidos, estadísticas y más.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="bg-bg-tertiary rounded-xl p-4 border border-border-subtle">
              <DollarSign size={20} className="text-accent mb-2" />
              <p className="text-h3 font-bold text-text-primary">Bs. 0</p>
              <p className="text-caption text-text-muted">Ventas hoy</p>
            </div>
            <div className="bg-bg-tertiary rounded-xl p-4 border border-border-subtle">
              <ShoppingBag size={20} className="text-accent mb-2" />
              <p className="text-h3 font-bold text-text-primary">0</p>
              <p className="text-caption text-text-muted">Órdenes hoy</p>
            </div>
            <div className="bg-bg-tertiary rounded-xl p-4 border border-border-subtle">
              <Users size={20} className="text-accent mb-2" />
              <p className="text-h3 font-bold text-text-primary">--</p>
              <p className="text-caption text-text-muted">Empleados activos</p>
            </div>
            <div className="bg-bg-tertiary rounded-xl p-4 border border-border-subtle">
              <TrendingUp size={20} className="text-accent mb-2" />
              <p className="text-h3 font-bold text-text-primary">--</p>
              <p className="text-caption text-text-muted">Ticket promedio</p>
            </div>
          </div>

          <div className="mt-10 flex gap-2">
            {['Bolivia', 'Gestión de ventas', 'Offline', 'IA Integrada'].map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-accent-muted text-accent text-label rounded-md border border-accent-border">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="w-[45%] bg-bg-secondary flex items-center justify-center p-12">
        <div className="w-full max-w-sm">
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => { setRole('admin'); setMode('credentials'); setError('') }}
              className={`flex-1 p-4 rounded-xl border transition-all ${
                role === 'admin'
                  ? 'bg-accent-muted border-accent text-accent'
                  : 'bg-bg-tertiary border-border-light text-text-secondary hover:border-text-hint'
              }`}
            >
              <Users size={24} className="mx-auto mb-1" />
              <p className="text-body-sm font-medium">Administrador</p>
            </button>
            <button
              onClick={() => { setRole('employee'); setError('') }}
              className={`flex-1 p-4 rounded-xl border transition-all ${
                role === 'employee'
                  ? 'bg-accent-muted border-accent text-accent'
                  : 'bg-bg-tertiary border-border-light text-text-secondary hover:border-text-hint'
              }`}
            >
              <ShoppingBag size={24} className="mx-auto mb-1" />
              <p className="text-body-sm font-medium">Empleado</p>
            </button>
          </div>

          {role === 'employee' && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setMode('credentials'); setError('') }}
                className={`flex-1 py-2 rounded-lg text-label font-medium transition-all ${
                  mode === 'credentials' ? 'bg-bg-tertiary text-text-primary border border-border-light' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Email + Contraseña
              </button>
              <button
                onClick={() => { setMode('pin'); setError('') }}
                className={`flex-1 py-2 rounded-lg text-label font-medium transition-all ${
                  mode === 'pin' ? 'bg-bg-tertiary text-text-primary border border-border-light' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                PIN Rápido
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {mode === 'credentials' ? (
              <>
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="admin@quickbite.com"
                  icon={<Mail size={16} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock size={16} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </>
            ) : (
              <div>
                <label className="block text-label font-medium text-text-secondary mb-2">PIN de acceso</label>
                <div className="flex gap-2 justify-center">
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={pinBlocked}
                    className="w-32 text-center text-h2 bg-bg-tertiary border border-border-light rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    autoFocus
                  />
                </div>
                {!pinBlocked && pinAttempts > 0 && (
                  <p className="text-center text-label text-status-error mt-2">
                    Intentos restantes: {3 - pinAttempts}
                  </p>
                )}
                {pinBlocked && (
                  <p className="text-center text-label text-status-error mt-2 font-medium">
                    Demasiados intentos. Espera {pinBlockTimer} segundos
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/20 text-body-sm text-status-error">
                {error}
              </div>
            )}

            {mode === 'credentials' && (
              <div className="text-right">
                <button type="button" className="text-label text-accent hover:text-accent-hover transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <KeyRound size={16} className="mr-2" />
              Ingresar al sistema
            </Button>
          </form>

          <p className="text-center text-label text-text-muted mt-6">
            Demo: admin@quickbite.com / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
