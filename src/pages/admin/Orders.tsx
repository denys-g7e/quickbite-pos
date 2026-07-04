import React, { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Eye, Download, FileSpreadsheet, XCircle } from 'lucide-react'
import { formatDate } from '../../lib/utils'

const CANCEL_REASONS = [
  'Cliente canceló',
  'Error del mesero',
  'Producto agotado',
  'Error de sistema',
  'Otro',
]

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelCustomReason, setCancelCustomReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    try {
      const result = await window.api.orders.list({ limit: 100 })
      setOrders(result)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const viewDetail = async (id: number) => {
    const order = await window.api.orders.getById(id)
    setSelectedOrder(order)
    setShowDetail(true)
  }

  const handleCancel = async () => {
    if (!selectedOrder) return
    setCancelling(true)
    try {
      const reason = cancelReason === 'Otro' ? cancelCustomReason.trim() : cancelReason
      await window.api.orders.cancel(selectedOrder.id, reason || undefined)
      setShowCancelModal(false)
      setShowDetail(false)
      setCancelReason('')
      setCancelCustomReason('')
      loadOrders()
    } catch (err: any) {
      alert('Error al cancelar orden: ' + err.message)
    }
    setCancelling(false)
  }

  const handleExportCsv = async () => {
    const csv = await window.api.orders.exportCsv()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ordenes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportSin = async () => {
    try {
      const result = await window.api.orders.exportSin()
      alert(`Exportación exitosa\n\n${result.count} órdenes exportadas\nArchivo guardado en:\n${result.path}`)
    } catch (err: any) {
      alert('Error al exportar: ' + err.message)
    }
  }

  const handleExportCancelled = async () => {
    const csv = await window.api.orders.exportCsv({ status: 'cancelled' })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cancelaciones-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-text-primary">Órdenes</h1>
            <p className="text-body-sm text-text-muted">{orders.length} órdenes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportCancelled}>
              <XCircle size={16} className="mr-1.5" />Cancelaciones
            </Button>
            <Button variant="secondary" onClick={handleExportCsv}>
              <Download size={16} className="mr-1.5" />CSV
            </Button>
            <Button variant="secondary" onClick={handleExportSin}>
              <FileSpreadsheet size={16} className="mr-1.5" />Exportar SIN
            </Button>
          </div>
        </div>

        <Card padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left p-3 text-label text-text-muted font-medium">Productos</th>
                  <th className="text-left p-3 text-label text-text-muted font-medium">Cliente</th>
                  <th className="text-left p-3 text-label text-text-muted font-medium">Tipo</th>
                  <th className="text-left p-3 text-label text-text-muted font-medium">Empleado</th>
                  <th className="text-right p-3 text-label text-text-muted font-medium">Total</th>
                  <th className="text-right p-3 text-label text-text-muted font-medium">Fecha</th>
                  <th className="text-right p-3 text-label text-text-muted font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-text-muted">Cargando...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-text-muted">Sin órdenes</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id} className={`border-b border-border-subtle hover:bg-white/[0.02] ${o.status === 'cancelled' ? 'opacity-60' : ''}`}>
                    <td className="p-3 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="text-body-sm font-medium text-text-primary">{o.order_number}</span>
                        {o.status === 'cancelled' && <span className="text-label px-1.5 py-0.5 rounded-full bg-status-error/20 text-status-error">Cancelada</span>}
                      </div>
                      {o.items_summary && <p className="text-label text-text-muted truncate">{o.items_summary}</p>}
                    </td>
                    <td className="p-3"><span className="text-caption text-text-secondary">{o.customer_name}</span></td>
                    <td className="p-3"><span className="text-caption text-text-secondary capitalize">{o.service_type}</span></td>
                    <td className="p-3"><span className="text-caption text-text-secondary">{o.employee_name}</span></td>
                    <td className="p-3 text-right"><span className="text-body-sm font-medium text-accent">Bs. {o.total.toFixed(2)}</span></td>
                    <td className="p-3 text-right"><span className="text-caption text-text-muted">{formatDate(o.created_at)}</span></td>
                    <td className="p-3 text-right">
                      <button onClick={() => viewDetail(o.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title={`Orden ${selectedOrder?.order_number}`} size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-label text-text-muted">Cliente</p>
                <p className="text-body-sm text-text-primary">{selectedOrder.customer_name}</p>
                {selectedOrder.customer_nit && <p className="text-label text-text-muted">NIT: {selectedOrder.customer_nit}</p>}
              </div>
              <div>
                <p className="text-label text-text-muted">Empleado</p>
                <p className="text-body-sm text-text-primary">{selectedOrder.employee_name}</p>
              </div>
              <div>
                <p className="text-label text-text-muted">Tipo de servicio</p>
                <p className="text-body-sm text-text-primary capitalize">{selectedOrder.service_type}</p>
                {selectedOrder.table_number && <p className="text-label text-text-muted">Mesa: {selectedOrder.table_number}</p>}
              </div>
              <div>
                <p className="text-label text-text-muted">Método de pago</p>
                <p className="text-body-sm text-text-primary capitalize">{selectedOrder.payment_method || '—'}</p>
              </div>
            </div>

            {selectedOrder.status === 'cancelled' && (
              <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/20">
                <p className="text-body-sm font-medium text-status-error">Orden cancelada</p>
                {selectedOrder.items?.some((i: any) => i.cancel_reason) && (
                  <p className="text-caption text-text-muted mt-1">Motivo: {selectedOrder.items.find((i: any) => i.cancel_reason)?.cancel_reason}</p>
                )}
              </div>
            )}

            <div className="border-t border-border-subtle pt-4">
              <p className="text-title font-semibold text-text-primary mb-3">Items</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-border-subtle">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-body-sm text-text-primary">{item.product_name}</p>
                        {item.item_status === 'cancelado' && <span className="text-label px-1.5 py-0.5 rounded-full bg-status-error/20 text-status-error">Cancelado</span>}
                        {item.item_status === 'en_cocina' && <span className="text-label px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">Cocina</span>}
                        {item.item_status === 'en_barra' && <span className="text-label px-1.5 py-0.5 rounded-full bg-status-warning/20 text-status-warning">Barra</span>}
                        {item.item_status === 'listo' && <span className="text-label px-1.5 py-0.5 rounded-full bg-status-success/20 text-status-success">Listo</span>}
                        {item.item_status === 'entregado' && <span className="text-label px-1.5 py-0.5 rounded-full bg-status-success/20 text-status-success">Entregado</span>}
                      </div>
                      {item.notes && <p className="text-label text-text-muted">Nota: {item.notes}</p>}
                      {item.cancel_reason && <p className="text-label text-status-error">Motivo: {item.cancel_reason}</p>}
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-body-sm text-text-primary">x{item.quantity}</p>
                      <p className="text-label text-accent">Bs. {item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border-subtle pt-4 flex justify-between items-end">
              <div>
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-status-error border-status-error/30 hover:bg-status-error/10"
                    onClick={() => { setCancelReason(''); setCancelCustomReason(''); setShowCancelModal(true) }}
                  >
                    <XCircle size={14} className="mr-1" />Cancelar orden
                  </Button>
                )}
              </div>
              <div className="w-48 space-y-1">
                <div className="flex justify-between text-caption text-text-secondary">
                  <span>Subtotal</span><span>Bs. {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-caption text-status-error">
                    <span>Descuento</span><span>-Bs. {selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-body font-bold text-text-primary pt-1 border-t border-border-subtle">
                  <span>TOTAL</span><span className="text-accent">Bs. {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancelar orden" size="sm">
        <div className="space-y-4">
          <p className="text-body-sm text-text-muted">Selecciona el motivo de cancelación para <strong>{selectedOrder?.order_number}</strong></p>
          <div className="space-y-2">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setCancelReason(r)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-body-sm transition-all ${
                  cancelReason === r
                    ? 'bg-status-error/10 border-status-error/50 text-status-error font-medium'
                    : 'bg-bg-tertiary border-border-light text-text-secondary hover:border-text-hint'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {cancelReason === 'Otro' && (
            <input
              type="text"
              placeholder="Especifica el motivo..."
              className="w-full bg-bg-tertiary border border-border-light rounded-lg px-3 py-2.5 text-body-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent"
              value={cancelCustomReason}
              onChange={(e) => setCancelCustomReason(e.target.value)}
              autoFocus
            />
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCancelModal(false)}>Volver</Button>
            <Button className="flex-1 bg-status-error hover:bg-status-error/90" loading={cancelling} disabled={!cancelReason} onClick={handleCancel}>
              <XCircle size={14} className="mr-1" />Cancelar orden
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
