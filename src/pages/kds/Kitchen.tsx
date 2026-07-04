import React, { useState, useEffect, useCallback } from 'react'
import { Maximize2, Monitor, UtensilsCrossed, Coffee, ChevronLeft, ChevronRight } from 'lucide-react'

interface OrderItem {
  id: number
  product_name: string
  quantity: number
  notes: string | null
  item_status: string
  category_name: string
  cancel_reason: string | null
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  service_type: string
  table_number: number | null
  status: string
  created_at: string
  employee_name: string
  items: OrderItem[]
}

type StationTab = 'all' | 'cocina' | 'barra'

const COCINA_CATS = ['Hamburguesas', 'Pizzas', 'Postres', 'Ensaladas', 'Papas y Acompañantes']
const BARRA_CATS = ['Bebidas']

function getItemStation(cat: string): string {
  if (COCINA_CATS.includes(cat)) return 'cocina'
  if (BARRA_CATS.includes(cat)) return 'barra'
  return 'cocina'
}

function statusColor(status: string): string {
  switch (status) {
    case 'pendiente': return 'bg-status-warning/20 text-status-warning border-status-warning/30'
    case 'en_cocina':
    case 'en_barra': return 'bg-accent-muted text-accent border-accent/30'
    case 'listo': return 'bg-status-success/20 text-status-success border-status-success/30'
    case 'entregado': return 'bg-text-hint/20 text-text-muted border-border-light'
    case 'cancelado': return 'bg-status-error/20 text-status-error border-status-error/30'
    default: return 'bg-bg-tertiary text-text-secondary border-border-light'
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pendiente: 'Pendiente',
    en_cocina: 'Cocinando',
    en_barra: 'Preparando',
    listo: 'Listo',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  }
  return map[status] || status
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}

export default function Kitchen() {
  const [orders, setOrders] = useState<Order[]>([])
  const [station, setStation] = useState<StationTab>('all')
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [kdsMode, setKdsMode] = useState(false)

  const loadOrders = useCallback(async () => {
    try {
      const data = await window.api.kds.getActiveOrders()
      setOrders(data || [])
    } catch { /* KDS no muestra error visual */ }
  }, [])

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 3000)
    return () => clearInterval(interval)
  }, [loadOrders])

  const handleSetStatus = async (itemId: number, status: string) => {
    try {
      await window.api.kds.setItemStatus(itemId, status)
      loadOrders()
    } catch (err: any) {
      console.error('KDS error:', err)
    }
  }

  const getNextStatus = (current: string): string | null => {
    if (current === 'pendiente') return null
    if (current === 'en_cocina' || current === 'en_barra') return 'listo'
    if (current === 'listo') return null
    return null
  }

  const getActionForItem = (item: OrderItem): { label: string; nextStatus: string; color: string } | null => {
    if (item.item_status === 'pendiente') {
      const st = getItemStation(item.category_name)
      return { label: st === 'cocina' ? '👨‍🍳 Cocinar' : '🥤 Preparar', nextStatus: st, color: 'bg-accent hover:bg-accent-hover text-white' }
    }
    if (item.item_status === 'en_cocina' || item.item_status === 'en_barra') {
      return { label: '✅ Listo', nextStatus: 'listo', color: 'bg-status-success hover:bg-green-600 text-white' }
    }
    return null
  }

  const toggleKdsMode = () => {
    setKdsMode(!kdsMode)
    if (!kdsMode) {
      try { document.documentElement.requestFullscreen?.() } catch {}
    } else {
      try { document.exitFullscreen?.() } catch {}
    }
  }

  const filterFn = (order: Order): boolean => {
    if (station === 'all') return true
    return order.items.some(i => getItemStation(i.category_name) === station && i.item_status !== 'entregado' && i.item_status !== 'cancelado')
  }

  const filteredOrders = orders.filter(filterFn)

  return (
    <div className={`h-full flex flex-col ${kdsMode ? 'bg-black' : 'bg-bg-primary'}`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${kdsMode ? 'border-gray-800 bg-gray-900' : 'border-border-subtle bg-bg-secondary'}`}>
        <div className="flex items-center gap-3">
          <h1 className={`text-h3 font-bold ${kdsMode ? 'text-white' : 'text-text-primary'}`}>
            🍽️ KDS - Cocina
          </h1>
          <span className={`px-2 py-0.5 text-label rounded-md ${kdsMode ? 'bg-gray-800 text-gray-400' : 'bg-bg-tertiary text-text-muted'}`}>
            {orders.length} órdenes
          </span>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'cocina', 'barra'].map((s) => (
            <button
              key={s}
              onClick={() => setStation(s as StationTab)}
              className={`px-3 py-1.5 text-label rounded-lg font-medium transition-all ${
                station === s
                  ? kdsMode ? 'bg-accent text-white' : 'bg-accent text-white'
                  : kdsMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-bg-tertiary text-text-secondary hover:bg-border-light'
              }`}
            >
              {s === 'all' ? 'Todas' : s === 'cocina' ? '🍳 Cocina' : '🥤 Barra'}
            </button>
          ))}
          <button
            onClick={toggleKdsMode}
            className={`p-1.5 rounded-lg ${kdsMode ? 'bg-gray-800 text-accent' : 'bg-bg-tertiary text-text-secondary hover:bg-border-light'}`}
            title="Modo KDS (pantalla completa)"
          >
            {kdsMode ? <ChevronLeft size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-3 ${kdsMode ? 'bg-black' : ''}`}>
        {filteredOrders.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <UtensilsCrossed size={48} className="mx-auto mb-3 text-text-hint" />
              <p className="text-body text-text-muted">No hay órdenes activas</p>
            </div>
          </div>
        )}

        <div className={`grid gap-3 ${kdsMode ? 'grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
          {filteredOrders.map((order) => {
            const visibleItems = order.items.filter(i => i.item_status !== 'entregado')
            if (visibleItems.length === 0) return null

            return (
              <div
                key={order.id}
                className={`rounded-xl border overflow-hidden ${
                  kdsMode
                    ? 'bg-gray-900 border-gray-800'
                    : 'bg-bg-secondary border-border-subtle shadow-sm'
                }`}
              >
                <div className={`px-3 py-2 border-b flex items-center justify-between ${
                  kdsMode ? 'border-gray-800' : 'border-border-subtle'
                }`}>
                  <div>
                    <div className={`text-h4 font-bold ${kdsMode ? 'text-white' : 'text-text-primary'}`}>
                      {order.service_type === 'mesa' ? `Mesa ${order.table_number}` : 'Para llevar'}
                    </div>
                    <div className={`text-label ${kdsMode ? 'text-gray-400' : 'text-text-muted'}`}>
                      #{order.order_number} · {formatTime(order.created_at)}
                    </div>
                  </div>
                  <div className={`text-right ${kdsMode ? 'text-gray-400' : 'text-text-muted'}`}>
                    <div className="text-label">{order.customer_name}</div>
                    <div className="text-caption">{order.employee_name}</div>
                  </div>
                </div>

                <div className="p-2 space-y-1.5">
                  {visibleItems.map((item) => {
                    const action = getActionForItem(item)
                    const isActive = action !== null
                    const stationType = getItemStation(item.category_name)

                    if (station !== 'all' && stationType !== station) return null

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg p-2.5 border transition-all ${
                          kdsMode ? 'border-gray-800' : 'border-border-light'
                        } ${item.item_status === 'listo' ? (kdsMode ? 'bg-green-900/20 border-green-800' : 'bg-status-success/5 border-status-success/20') : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-label font-bold ${
                              stationType === 'cocina'
                                ? kdsMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'
                                : kdsMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {stationType === 'cocina' ? '🍳' : '🥤'}
                            </span>
                            <span className={`font-bold text-body ${kdsMode ? 'text-white' : 'text-text-primary'}`}>
                              {item.quantity}x {item.product_name}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 text-label rounded-md border ${statusColor(item.item_status)}`}>
                            {statusLabel(item.item_status)}
                          </span>
                        </div>

                        {item.notes && (
                          <p className={`text-label mb-1.5 ${kdsMode ? 'text-yellow-400' : 'text-status-warning'}`}>
                            📝 {item.notes}
                          </p>
                        )}

                        {action && (
                          <button
                            onClick={() => handleSetStatus(item.id, action.nextStatus)}
                            className={`w-full py-2.5 rounded-lg text-body-sm font-bold transition-all active:scale-95 ${
                              kdsMode ? 'text-lg py-4' : ''
                            } ${action.color}`}
                          >
                            {action.label}
                          </button>
                        )}

                        {item.item_status === 'cancelado' && (
                          <p className={`text-label ${kdsMode ? 'text-red-400' : 'text-status-error'}`}>
                            Cancelado: {item.cancel_reason || 'Sin motivo'}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {kdsMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-t border-gray-800">
          <span className="text-gray-400 text-label">{new Date().toLocaleString('es-BO')}</span>
          <button
            onClick={toggleKdsMode}
            className="px-3 py-1 bg-gray-800 text-gray-400 rounded-lg text-label hover:bg-gray-700"
          >
            Salir de KDS
          </button>
        </div>
      )}
    </div>
  )
}