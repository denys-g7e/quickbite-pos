import React from 'react'
import { Trash2, Plus, Minus, ShoppingCart, Tag } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/Button'

export function CartPanel() {
  const {
    items, removeItem, updateQuantity, getSubtotal, getTotal, getItemCount, discount, setDiscount
  } = useCartStore()
  const { setShowOrderModal } = useUIStore()

  if (items.length === 0) {
    return (
      <div className="w-80 bg-bg-secondary border-l border-border-subtle flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-4">
          <ShoppingCart size={28} className="text-text-muted" />
        </div>
        <p className="text-body-sm text-text-muted text-center">Carrito vacío</p>
        <p className="text-caption text-text-hint text-center mt-1">Selecciona productos para comenzar</p>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const total = getTotal()
  const itemCount = getItemCount()

  return (
    <div className="w-80 bg-bg-secondary border-l border-border-subtle flex flex-col">
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <h3 className="text-body font-semibold text-text-primary">Carrito</h3>
          <span className="px-2 py-0.5 bg-accent-muted text-accent text-label rounded-md font-medium">{itemCount} items</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.map((item) => (
          <div key={item.productId} className="bg-bg-tertiary rounded-xl p-3 border border-border-subtle">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-text-primary truncate">{item.productName}</p>
                <p className="text-caption text-text-muted">Bs. {item.productPrice.toFixed(2)} c/u</p>
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                className="p-1 rounded-md hover:bg-status-error/10 text-text-muted hover:text-status-error transition-colors ml-2"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-7 h-7 rounded-md bg-bg-secondary border border-border-light flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Minus size={12} className="text-text-secondary" />
                </button>
                <span className="w-8 text-center text-body-sm font-medium text-text-primary">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-7 h-7 rounded-md bg-bg-secondary border border-border-light flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Plus size={12} className="text-text-secondary" />
                </button>
              </div>
              <span className="text-body-sm font-semibold text-accent">Bs. {item.subtotal.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border-subtle space-y-3">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-text-muted" />
          <input
            type="number"
            placeholder="Descuento (Bs.)"
            className="flex-1 bg-bg-tertiary border border-border-light rounded-lg px-3 py-1.5 text-caption text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent"
            value={discount || ''}
            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-caption text-text-secondary">
            <span>Subtotal</span>
            <span>Bs. {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-caption text-status-error">
              <span>Descuento</span>
              <span>-Bs. {discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-body font-bold text-text-primary pt-1 border-t border-border-subtle">
            <span>TOTAL</span>
            <span className="text-accent">Bs. {total.toFixed(2)}</span>
          </div>
        </div>

        <Button onClick={() => setShowOrderModal(true)} className="w-full" size="lg">
          Proceder al cobro — Bs. {total.toFixed(2)}
        </Button>
      </div>
    </div>
  )
}
