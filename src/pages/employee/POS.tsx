import React, { useState, useEffect } from 'react'
import { Zap, Clock, AlertTriangle } from 'lucide-react'
import { POSLayout } from '../../components/layout/POSLayout'
import { ProductGrid } from '../../components/pos/ProductGrid'
import { CartPanel } from '../../components/pos/CartPanel'
import { OrderModal } from '../../components/pos/OrderModal'
import { PaymentModal } from '../../components/pos/PaymentModal'
import { useCartStore } from '../../store/cartStore'

export default function POS() {
  const { getItemCount } = useCartStore()
  const [shiftOpen, setShiftOpen] = useState(true)

  useEffect(() => {
    window.api.shifts.check().then(setShiftOpen).catch(() => setShiftOpen(true))
    const interval = setInterval(() => {
      window.api.shifts.check().then(setShiftOpen).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <POSLayout>
      {!shiftOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#fef3cd] border-b border-[#fde68a]">
          <AlertTriangle size={16} className="text-[#92400e]" />
          <span className="text-body-sm font-medium text-[#92400e]">No hay turno de caja abierto. Las ventas se registrarán pero se notificará al administrador.</span>
        </div>
      )}
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-secondary">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-accent" />
              <h2 className="text-title font-semibold text-text-primary">Nueva orden</h2>
            </div>
            <span className={`px-2 py-0.5 text-label rounded-md font-medium ${shiftOpen ? 'bg-accent-muted text-accent' : 'bg-status-warning/10 text-status-warning'}`}>
              {shiftOpen ? 'Turno activo' : 'Sin turno'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-caption text-text-muted">
            <Clock size={14} />
            <span>{new Date().toLocaleTimeString('es-BO')}</span>
            <span className="w-1 h-1 rounded-full bg-text-hint" />
            <span>{new Date().toLocaleDateString('es-BO')}</span>
            <span className="w-1 h-1 rounded-full bg-text-hint" />
            <span>{getItemCount()} items en carrito</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <ProductGrid />
          <CartPanel />
        </div>
      </div>

      <OrderModal />
      <PaymentModal />
    </POSLayout>
  )
}
