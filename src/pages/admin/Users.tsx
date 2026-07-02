import React, { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Plus, ToggleLeft, ToggleRight, Key, Trash2, Settings } from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', pin: '' })
  const [newPassword, setNewPassword] = useState('')
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' })

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      const result = await window.api.users.list()
      setUsers(result)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setSelectedUser(null)
    setForm({ name: '', email: '', password: '', pin: '' })
    setShowModal(true)
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      alert('Todos los campos son obligatorios')
      return
    }
    if (form.password.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres')
      return
    }
    try {
      await window.api.users.create(form)
      setShowModal(false)
      loadUsers()
    } catch (err) {
      alert('Error al crear empleado')
      console.error(err)
    }
  }

  const toggleActive = async (id: number) => {
    await window.api.users.toggleActive(id)
    loadUsers()
  }

  const handleResetPassword = async () => {
    if (selectedUser && newPassword) {
      await window.api.users.resetPassword(selectedUser.id, newPassword)
      setShowPasswordModal(false)
      setNewPassword('')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      await window.api.users.delete(id)
      loadUsers()
    }
  }

  const handleAdminSettings = async () => {
    const admin = users.find(u => u.role === 'admin')
    if (!admin) return
    const data: any = {}
    if (adminForm.name) data.name = adminForm.name
    if (adminForm.email) data.email = adminForm.email
    if (adminForm.password) data.password = adminForm.password
    if (Object.keys(data).length === 0) return
    await window.api.users.updateAdmin(admin.id, data)
    setShowAdminModal(false)
    setAdminForm({ name: '', email: '', password: '' })
    loadUsers()
  }

  const openAdminSettings = () => {
    const admin = users.find(u => u.role === 'admin')
    if (admin) {
      setAdminForm({ name: admin.name || '', email: admin.email || '', password: '' })
    }
    setShowAdminModal(true)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-text-primary">Empleados</h1>
            <p className="text-body-sm text-text-muted">{users.filter(u => u.role === 'employee').length} empleados registrados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={openAdminSettings}><Settings size={16} className="mr-1.5" />Admin</Button>
            <Button onClick={openCreate}><Plus size={16} className="mr-1.5" />Nuevo empleado</Button>
          </div>
        </div>

        <Card padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left p-3 text-label text-text-muted font-medium">Nombre</th>
                  <th className="text-left p-3 text-label text-text-muted font-medium">Email</th>
                  <th className="text-left p-3 text-label text-text-muted font-medium">Rol</th>
                  <th className="text-right p-3 text-label text-text-muted font-medium">Ventas</th>
                  <th className="text-center p-3 text-label text-text-muted font-medium">Estado</th>
                  <th className="text-right p-3 text-label text-text-muted font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-text-muted">Cargando...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-text-muted">Sin usuarios</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b border-border-subtle hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="text-caption font-semibold text-accent">{u.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-body-sm font-medium text-text-primary">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-3"><span className="text-caption text-text-secondary">{u.email}</span></td>
                    <td className="p-3">
                      <Badge variant={u.role === 'admin' ? 'accent' : 'info'} size="sm">
                        {u.role === 'admin' ? 'Admin' : 'Empleado'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-body-sm font-medium text-accent">Bs. {(u.total_sales || 0).toFixed(2)}</span>
                      <p className="text-label text-text-muted">{u.order_count || 0} órdenes</p>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={u.is_active ? 'success' : 'error'} size="sm">
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 rounded-lg hover:bg-status-error/20 text-text-muted hover:text-status-error transition-colors"
                            title="Eliminar empleado"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(u.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
                          title={u.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {u.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <button
                          onClick={() => { setSelectedUser(u); setShowPasswordModal(true) }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
                          title="Resetear contraseña"
                        >
                          <Key size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo empleado" size="md">
        <div className="space-y-4">
          <Input label="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Correo electrónico" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input label="PIN (4 dígitos, opcional)" type="text" maxLength={4} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleCreate} className="flex-1">Crear empleado</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Resetear contraseña" size="sm">
        <div className="space-y-4">
          <p className="text-body-sm text-text-secondary">
            Nueva contraseña para <strong className="text-text-primary">{selectedUser?.name}</strong>
          </p>
          <Input type="password" label="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleResetPassword} className="flex-1">Actualizar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} title="Configuración de administrador" size="md">
        <div className="space-y-4">
          <Input label="Nombre del administrador" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} placeholder="Dejar vacío para mantener actual" />
          <Input label="Correo electrónico" type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="Dejar vacío para mantener actual" />
          <Input label="Nueva contraseña" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Dejar vacío para mantener actual" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAdminModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleAdminSettings} className="flex-1">Guardar cambios</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
