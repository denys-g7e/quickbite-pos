import React, { useState, useEffect } from 'react'
import { POSLayout } from '../../components/layout/POSLayout'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import { Clock } from 'lucide-react'

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const result = await window.api.orders.list({ employeeId: user?.id, limit: 50 })
      setOrders(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <POSLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-h2 font-bold text-text-primary">Mis órdenes</h2>
            <p className="text-body-sm text-text-muted">Historial de órdenes registradas</p>
          </div>
          <Badge variant="info">{orders.length} órdenes</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center py-12">
            <Clock size={40} className="mx-auto text-text-muted mb-3" />
            <p className="text-body text-text-secondary">No tienes órdenes registradas</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="hover:border-border-light transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
                      <span className="text-body font-bold text-accent">#{order.order_number?.split('-')[2]}</span>
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-text-primary">{order.customer_name}</p>
                      <p className="text-caption text-text-muted">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-body font-semibold text-accent">Bs. {order.total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </POSLayout>
  )
}
