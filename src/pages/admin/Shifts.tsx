import React, { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { DollarSign, Clock, User, CheckCircle2, XCircle, History } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function Shifts() {
  const [currentShift, setCurrentShift] = useState<any>(null)
  const [shifts, setShifts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [shiftNotes, setShiftNotes] = useState('')
  const { user } = useAuthStore()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [current, list] = await Promise.all([
        window.api.shifts.current(),
        window.api.shifts.list(),
      ])
      setCurrentShift(current)
      setShifts(list)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleOpen = async () => {
    if (!openingAmount || parseFloat(openingAmount) <= 0) return
    try {
      await window.api.shifts.open({ employeeId: user!.id, openingAmount: parseFloat(openingAmount), notes: shiftNotes || undefined })
      setShowOpenModal(false)
      setOpeningAmount('')
      setShiftNotes('')
      loadData()
    } catch (err: any) { alert(err.message) }
  }

  const handleClose = async () => {
    if (!closingAmount || parseFloat(closingAmount) <= 0) return
    try {
      await window.api.shifts.close({ id: currentShift.id, closingAmount: parseFloat(closingAmount), notes: shiftNotes || undefined })
      setShowCloseModal(false)
      setClosingAmount('')
      setShiftNotes('')
      loadData()
    } catch (err: any) { alert(err.message) }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-h2 font-bold text-text-primary">Turno de Caja</h1>
          <p className="text-body-sm text-text-muted">Gestiona la apertura y cierre de caja</p>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-title font-semibold text-text-primary flex items-center gap-2">
              <Clock size={18} className="text-accent" />
              Turno actual
            </h3>
            {currentShift ? (
              <Badge variant="success" size="sm">Abierto</Badge>
            ) : (
              <Badge variant="error" size="sm">Cerrado</Badge>
            )}
          </div>
          {currentShift ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-label text-text-muted">Apertura</p>
                  <p className="text-title font-bold text-accent">Bs. {currentShift.opening_amount.toFixed(2)}</p>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-label text-text-muted">Abierto por</p>
                  <p className="text-body-sm font-medium text-text-primary">{currentShift.employee_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-caption text-text-muted">
                <Clock size={14} />
                Abierto: {new Date(currentShift.opened_at).toLocaleString('es-BO')}
              </div>
              {currentShift.notes && (
                <p className="text-caption text-text-muted">Notas: {currentShift.notes}</p>
              )}
              <Button onClick={() => { setShowCloseModal(true); setClosingAmount(''); setShiftNotes('') }} className="w-full">
                <CheckCircle2 size={16} className="mr-1.5" />Cerrar turno
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <XCircle size={32} className="mx-auto mb-2 text-text-muted" />
              <p className="text-body-sm text-text-muted mb-3">No hay turno abierto</p>
              <Button onClick={() => { setShowOpenModal(true); setOpeningAmount(''); setShiftNotes('') }}>
                <DollarSign size={16} className="mr-1.5" />Abrir turno
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <History size={18} className="text-accent" />
            Historial de turnos
          </h3>
          {shifts.length === 0 ? (
            <p className="text-caption text-text-muted">Sin turnos registrados</p>
          ) : (
            <div className="space-y-2">
              {shifts.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
                  <div>
                    <p className="text-caption font-medium text-text-primary">
                      {s.employee_name || 'Empleado'} — <span className="text-text-muted">{new Date(s.opened_at).toLocaleDateString('es-BO')}</span>
                    </p>
                    <p className="text-label text-text-muted">
                      Apertura: Bs. {s.opening_amount.toFixed(2)}
                      {s.closing_amount !== null ? ` | Cierre: Bs. ${s.closing_amount.toFixed(2)}` : ''}
                    </p>
                  </div>
                  <Badge variant={s.status === 'open' ? 'success' : 'default'} size="sm">
                    {s.status === 'open' ? 'Abierto' : 'Cerrado'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} title="Abrir turno">
        <div className="space-y-4">
          <Input label="Monto de apertura" type="number" placeholder="0.00" icon={<DollarSign size={16} />} value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} />
          <Input label="Notas (opcional)" placeholder="Observaciones" value={shiftNotes} onChange={(e) => setShiftNotes(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowOpenModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleOpen} className="flex-1">Abrir turno</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Cerrar turno">
        <div className="space-y-4">
          <div className="bg-bg-tertiary rounded-xl p-4 text-center">
            <p className="text-label text-text-muted mb-1">Total en caja</p>
            <p className="text-h2 font-bold text-accent">Bs. {(closingAmount ? parseFloat(closingAmount) : 0).toFixed(2)}</p>
          </div>
          <Input label="Monto de cierre" type="number" placeholder="0.00" icon={<DollarSign size={16} />} value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} />
          <Input label="Notas (opcional)" placeholder="Observaciones del cierre" value={shiftNotes} onChange={(e) => setShiftNotes(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCloseModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleClose} className="flex-1">Cerrar turno</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
