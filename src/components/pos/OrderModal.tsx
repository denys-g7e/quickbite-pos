import React, { useState, useEffect } from 'react'
import { User, FileText, ArmchairIcon, ShoppingBag, Bike, Phone, Award } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useCartStore } from '../../store/cartStore'
import { useUIStore } from '../../store/uiStore'

export function OrderModal() {
  const {
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    customerNIT, setCustomerNIT,
    serviceType, setServiceType,
    tableNumber, setTableNumber,
  } = useCartStore()
  const { showOrderModal, setShowOrderModal, setShowPaymentModal } = useUIStore()
  const [error, setError] = useState('')
  const [frequentInfo, setFrequentInfo] = useState<{ visit_count: number; last_visit: string } | null>(null)

  useEffect(() => {
    if (customerName.trim().length >= 2) {
      window.api.orders.getCustomerHistory(customerName.trim()).then((res) => {
        setFrequentInfo(res.visit_count >= 1 ? res : null)
      }).catch(() => setFrequentInfo(null))
    } else {
      setFrequentInfo(null)
    }
  }, [customerName])

  const handleConfirm = () => {
    if (!customerName.trim()) {
      setError('El nombre del cliente es requerido')
      return
    }
    if (serviceType === 'mesa' && !tableNumber) {
      setError('El número de mesa es requerido para servicio en mesa')
      return
    }
    setError('')
    setShowOrderModal(false)
    setShowPaymentModal(true)
  }

  return (
    <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title="Datos de la orden" size="lg">
      <div className="space-y-5">
        <Input
          label="Nombre del cliente *"
          placeholder="Nombre del cliente"
          icon={<User size={16} />}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        {frequentInfo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30 text-body-sm text-accent">
            <Award size={16} />
            <span className="font-medium">Cliente frecuente</span>
            {frequentInfo.visit_count >= 3 && (
              <span className="ml-auto text-label bg-accent/20 px-2 py-0.5 rounded-full">Frecuente</span>
            )}
            <span className="text-label text-text-muted">{frequentInfo.visit_count} visita(s)</span>
          </div>
        )}

        <Input
          label="Teléfono (opcional)"
          placeholder="Ej: 77712345"
          icon={<Phone size={16} />}
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
        />

        <Input
          label="NIT / CI (opcional)"
          placeholder="12345678"
          icon={<FileText size={16} />}
          value={customerNIT}
          onChange={(e) => setCustomerNIT(e.target.value.replace(/\D/g, '').slice(0, 10))}
        />

        <div>
          <label className="block text-label font-medium text-text-secondary mb-2">Tipo de servicio *</label>
          <div className="flex gap-2">
            {[
              { value: 'mesa' as const, icon: ArmchairIcon, label: 'Mesa' },
              { value: 'para_llevar' as const, icon: ShoppingBag, label: 'Para llevar' },
              { value: 'delivery' as const, icon: Bike, label: 'Delivery' },
            ].map((svc) => (
              <button
                key={svc.value}
                onClick={() => setServiceType(svc.value)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-body-sm font-medium ${
                  serviceType === svc.value
                    ? 'bg-accent-muted border-accent text-accent'
                    : 'bg-bg-tertiary border-border-light text-text-secondary hover:border-text-hint'
                }`}
              >
                <svc.icon size={18} />
                {svc.label}
              </button>
            ))}
          </div>
        </div>

        {serviceType === 'mesa' && (
          <Input
            label="Número de mesa *"
            type="number"
            placeholder="Ej: 4"
            icon={<ArmchairIcon size={16} />}
            value={tableNumber || ''}
            onChange={(e) => setTableNumber(parseInt(e.target.value) || null)}
          />
        )}

        {error && (
          <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/20 text-body-sm text-status-error">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => setShowOrderModal(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Confirmar orden →
          </Button>
        </div>
      </div>
    </Modal>
  )
}
