import React, { useState, useEffect } from 'react'
import { Banknote, CreditCard, QrCode, Building2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useCartStore } from '../../store/cartStore'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { validateNIT } from '../../lib/formatters'

function isHappyHour(settings: Record<string, string>): { active: boolean; discount: number; label: string } {
  if (settings.happy_hour_enabled !== 'true') return { active: false, discount: 0, label: '' }
  const now = new Date()
  const current = now.getHours() * 60 + now.getMinutes()
  const startParts = (settings.happy_hour_start || '18:00').split(':').map(Number)
  const endParts = (settings.happy_hour_end || '20:00').split(':').map(Number)
  const start = startParts[0] * 60 + (startParts[1] || 0)
  const end = endParts[0] * 60 + (endParts[1] || 0)
  const discount = parseInt(settings.happy_hour_discount || '10', 10)
  if (start <= end) {
    if (current >= start && current < end) return { active: true, discount, label: `Hora Feliz (${discount}% desc.)` }
  } else {
    if (current >= start || current < end) return { active: true, discount, label: `Hora Feliz (${discount}% desc.)` }
  }
  return { active: false, discount: 0, label: '' }
}

export function PaymentModal() {
  const {
    items, customerName, customerNIT, serviceType, tableNumber,
    paymentMethod, setPaymentMethod, amountPaid, setAmountPaid,
    getSubtotal, getTotal, clearCart, discount, setDiscount
  } = useCartStore()
  const { showPaymentModal, setShowPaymentModal } = useUIStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null)
  const [qrImage, setQrImage] = useState('')
  const [qrEnabled, setQrEnabled] = useState(false)
  const [qrBase64, setQrBase64] = useState('')
  const [happyHour, setHappyHour] = useState<{ active: boolean; discount: number; label: string }>({ active: false, discount: 0, label: '' })

  useEffect(() => {
    window.api.settings.getAll().then(async (s) => {
      const path = s.qr_image || ''
      setQrImage(path)
      setQrEnabled(s.qr_enabled === 'true')
      if (path) {
        const b64 = await window.api.app.readFileBase64(path)
        setQrBase64(b64 || '')
      } else {
        setQrBase64('')
      }
      const hh = isHappyHour(s)
      setHappyHour(hh)
      if (hh.active && discount === 0) {
        const subtotal = getSubtotal()
        const hhDiscount = Math.round(subtotal * hh.discount) / 100
        setDiscount(hhDiscount)
      }
    }).catch(() => {})
  }, [showPaymentModal])

  const total = getTotal()
  const change = paymentMethod === 'efectivo' ? Math.max(0, amountPaid - total) : 0

  const handlePayment = async () => {
    if (paymentMethod === 'efectivo' && amountPaid < total) {
      setError('El monto recibido es menor al total')
      return
    }

    setError('')
    setLoading(true)

    if (customerNIT && customerNIT !== '0') {
      const nitCheck = validateNIT(customerNIT)
      if (!nitCheck.valid) {
        setError(nitCheck.error || 'NIT inválido')
        setLoading(false)
        return
      }
    }

    try {
      const shiftOk = await window.api.shifts.check()
      if (!shiftOk) {
        window.api.app.notifyNoShift()
      }

      const subtotal = getSubtotal()
      const result = await window.api.orders.create({
        customerName: customerName || 'Consumidor Final',
        customerNIT: customerNIT || null,
        serviceType,
        tableNumber: serviceType === 'mesa' ? tableNumber : null,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          productPrice: i.productPrice,
          quantity: i.quantity,
          subtotal: i.subtotal,
          notes: i.notes,
          categoryName: i.categoryName,
        })),
        subtotal,
        discount,
        total,
        paymentMethod,
        amountPaid: paymentMethod === 'efectivo' ? amountPaid : total,
        change,
        employeeId: user!.id,
      })

      try {
        await window.api.printer.printCombined({
          orderNumber: result.orderNumber,
          customerName: customerName || 'Consumidor Final',
          customerNIT: customerNIT || null,
          tableNumber,
          items,
          subtotal,
          discount,
          total,
          paymentMethod,
          amountPaid: paymentMethod === 'efectivo' ? amountPaid : total,
          change,
        })
      } catch (printErr) {
        console.error('Error printing:', printErr)
      }

      setSuccess({ orderNumber: result.orderNumber })
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    clearCart()
    setShowPaymentModal(false)
    setSuccess(null)
  }

  return (
    <Modal isOpen={showPaymentModal} onClose={handleClose} title={success ? '¡Pago exitoso!' : 'Procesar pago'} size="md">
      {success ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-status-success/20 flex items-center justify-center mx-auto mb-3">
              <Banknote size={28} className="text-status-success" />
            </div>
            <p className="text-h3 font-bold text-text-primary">¡Pago recibido!</p>
            <p className="text-body-sm text-text-secondary">Orden {success.orderNumber}</p>
          </div>

          <div className="bg-bg-tertiary rounded-xl p-4 border border-border-subtle space-y-2">
            <p className="text-label text-text-muted uppercase tracking-wide text-center">— Ticket —</p>
            <div className="border-t border-border-light my-2" />
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-body-sm">
                <span className="text-text-primary">{item.quantity}x {item.productName}</span>
                <span className="text-text-primary font-medium">Bs. {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border-light my-2" />
            <div className="flex justify-between text-body-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="text-text-primary">Bs. {getSubtotal().toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-body-sm">
                <span className="text-status-error">{happyHour.active ? happyHour.label : 'Descuento'}</span>
                <span className="text-status-error">-Bs. {discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-body font-bold">
              <span className="text-text-primary">TOTAL</span>
              <span className="text-accent">Bs. {total.toFixed(2)}</span>
            </div>
            <div className="border-t border-border-light my-2" />
            <div className="flex justify-between text-caption">
              <span className="text-text-muted">Método de pago</span>
              <span className="text-text-secondary capitalize">{paymentMethod}</span>
            </div>
            {paymentMethod === 'efectivo' && (
              <>
                <div className="flex justify-between text-caption">
                  <span className="text-text-muted">Recibido</span>
                  <span className="text-text-secondary">Bs. {amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-caption">
                  <span className="text-text-muted">Cambio</span>
                  <span className="text-status-success">Bs. {change.toFixed(2)}</span>
                </div>
              </>
            )}
            {customerName && (
              <div className="text-caption text-text-muted text-center pt-1">Cliente: {customerName}</div>
            )}
          </div>
          <Button onClick={handleClose} className="w-full">Nueva orden</Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-bg-tertiary rounded-xl p-4 text-center border border-border-subtle">
            <p className="text-label text-text-muted mb-1">Total a cobrar</p>
            <p className="text-h1 font-bold text-accent">Bs. {total.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-label font-medium text-text-secondary mb-2">Método de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'efectivo' as const, icon: Banknote, label: 'Efectivo' },
                { value: 'tarjeta' as const, icon: CreditCard, label: 'Tarjeta' },
                { value: 'qr' as const, icon: QrCode, label: 'QR' },
                { value: 'transferencia' as const, icon: Building2, label: 'Transferencia' },
              ].map((mp) => (
                <button
                  key={mp.value}
                  onClick={() => setPaymentMethod(mp.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-body-sm font-medium ${
                    paymentMethod === mp.value
                      ? 'bg-accent-muted border-accent text-accent'
                      : 'bg-bg-tertiary border-border-light text-text-secondary hover:border-text-hint'
                  }`}
                >
                  <mp.icon size={18} />
                  {mp.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'qr' && qrEnabled && qrBase64 && (
            <div className="text-center">
              <img src={qrBase64} alt="QR de pago" className="w-full max-w-sm object-contain mx-auto rounded-xl border border-border-light" />
              <p className="text-caption text-text-muted mt-2">Escanea el código QR para pagar</p>
            </div>
          )}

          {paymentMethod === 'efectivo' && (
            <Input
              label="Monto recibido"
              type="number"
              placeholder="0.00"
              icon={<Banknote size={16} />}
              value={amountPaid || ''}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
            />
          )}

          {paymentMethod === 'efectivo' && amountPaid > 0 && (
            <div className="bg-bg-tertiary rounded-xl p-4 border border-border-subtle">
              <div className="flex justify-between text-body-sm mb-1">
                <span className="text-text-secondary">Recibido</span>
                <span className="text-text-primary">Bs. {amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-body font-bold">
                <span className="text-text-secondary">Cambio</span>
                <span className="text-status-success">Bs. {change.toFixed(2)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/20 text-body-sm text-status-error">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleClose} className="flex-1">Cancelar</Button>
            <Button onClick={handlePayment} loading={loading} className="flex-1">
              Confirmar cobro — Bs. {total.toFixed(2)}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
