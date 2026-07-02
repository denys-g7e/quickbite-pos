import React, { useState, useEffect } from 'react'
import { POSLayout } from '../../components/layout/POSLayout'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'
import { CheckCircle2, User, Lock, Mail, Shield, CalendarDays } from 'lucide-react'

export default function Profile() {
  const { user, login } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    setProfileError('')
    setProfileSaved(false)
    if (!name.trim()) { setProfileError('El nombre es obligatorio'); return }
    if (!email.trim()) { setProfileError('El correo es obligatorio'); return }
    setSavingProfile(true)
    try {
      await window.api.users.update(user.id, { name: name.trim(), email: email.trim() })
      login({ ...user, name: name.trim(), email: email.trim() })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err: any) {
      setProfileError(err?.message || 'Error al guardar')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return
    setPasswordError('')
    setPasswordSaved(false)
    if (!currentPassword) { setPasswordError('Ingresa tu contraseña actual'); return }
    if (!newPassword) { setPasswordError('Ingresa la nueva contraseña'); return }
    if (newPassword.length < 4) { setPasswordError('La contraseña debe tener al menos 4 caracteres'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Las contraseñas no coinciden'); return }
    setSavingPassword(true)
    try {
      await window.api.auth.login({ email: user.email, password: currentPassword })
      await window.api.users.resetPassword(user.id, newPassword)
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    } catch (err: any) {
      setPasswordError(err?.message === 'Credenciales inválidas' ? 'Contraseña actual incorrecta' : (err?.message || 'Error al cambiar contraseña'))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <POSLayout>
      <div className="p-6 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-h2 font-bold text-text-primary">Mi perfil</h2>
          <p className="text-body-sm text-text-muted">Administra tu información personal y contraseña</p>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <User size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-title font-semibold text-text-primary">Información personal</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Shield size={12} className="text-text-muted" />
                  <span className="text-caption text-text-muted capitalize">{user?.role === 'admin' ? 'Administrador' : 'Empleado'}</span>
                  <CalendarDays size={12} className="text-text-muted" />
                  <span className="text-caption text-text-muted">ID: {user?.id}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Input
                label="Nombre"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User size={16} />}
              />
              <Input
                label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16} />}
              />
              {profileError && <p className="text-body-sm text-status-error">{profileError}</p>}
              <div className="flex items-center gap-3">
                <Button onClick={handleSaveProfile} loading={savingProfile}>
                  Guardar cambios
                </Button>
                {profileSaved && (
                  <span className="flex items-center gap-1.5 text-body-sm text-status-success">
                    <CheckCircle2 size={16} />
                    Guardado
                  </span>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Lock size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-title font-semibold text-text-primary">Cambiar contraseña</h3>
                <p className="text-caption text-text-muted">Mínimo 4 caracteres</p>
              </div>
            </div>
            <div className="space-y-4">
              <Input
                label="Contraseña actual"
                type="password"
                placeholder="••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                icon={<Lock size={16} />}
              />
              <Input
                label="Nueva contraseña"
                type="password"
                placeholder="••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock size={16} />}
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock size={16} />}
              />
              {passwordError && <p className="text-body-sm text-status-error">{passwordError}</p>}
              <div className="flex items-center gap-3">
                <Button onClick={handleChangePassword} loading={savingPassword}>
                  Cambiar contraseña
                </Button>
                {passwordSaved && (
                  <span className="flex items-center gap-1.5 text-body-sm text-status-success">
                    <CheckCircle2 size={16} />
                    Contraseña actualizada
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </POSLayout>
  )
}
