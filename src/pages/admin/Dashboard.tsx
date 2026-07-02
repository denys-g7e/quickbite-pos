import React, { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { KPICard } from '../../components/ui/KPICard'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DollarSign, ShoppingBag, TrendingUp, Package, Clock, Bot, Printer, Database, Box, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '../../lib/formatters'
import { formatDate } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState<any>({})
  const [hourlySales, setHourlySales] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [period, setPeriod] = useState('today')
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      const [statsData, hourlyData, ordersData, topData, lowStockData] = await Promise.all([
        window.api.orders.getStats(period),
        window.api.orders.getHourlySales(period),
        window.api.orders.list({ limit: 5 }),
        window.api.orders.getTopProducts(period),
        window.api.products.getLowStock(),
      ])
      setStats(statsData)
      setHourlySales(hourlyData)
      setRecentOrders(ordersData)
      setTopProducts(topData)
      setLowStock(lowStockData)
    } catch (err) {
      console.error(err)
    }
  }

  const getYesterdaySales = async (): Promise<number> => {
    try {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const prevOrders = await window.api.orders.list({
        dateFrom: yesterdayStr,
        dateTo: yesterdayStr,
      })
      return prevOrders.reduce((sum: number, o: any) => sum + o.total, 0)
    } catch {
      return 0
    }
  }

  const [yesterdaySales, setYesterdaySales] = useState(0)
  useEffect(() => {
    getYesterdaySales().then(setYesterdaySales)
  }, [])

  const salesDelta = yesterdaySales > 0
    ? `${(((stats.total_sales || 0) - yesterdaySales) / yesterdaySales * 100).toFixed(1)}%`
    : '—'

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 font-bold text-text-primary">Dashboard</h1>
          <p className="text-body-sm text-text-muted">Resumen del {period === 'today' ? 'día' : period === 'week' ? 'mes' : 'período'}</p>
        </div>

        <div className="flex gap-2">
          {[{ key: 'today', label: 'Hoy' }, { key: 'week', label: 'Esta semana' }, { key: 'month', label: 'Este mes' }].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-caption font-medium transition-all ${
                period === p.key ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KPICard
            title="Ventas hoy"
            value={formatCurrency(stats.total_sales || 0)}
            delta={salesDelta}
            deltaLabel="vs ayer"
            positive={salesDelta !== '—' && !salesDelta.startsWith('-')}
            icon={<DollarSign size={20} />}
          />
          <KPICard
            title="Órdenes completadas"
            value={String(stats.completed_orders || 0)}
            icon={<ShoppingBag size={20} />}
          />
          <KPICard
            title="Ticket promedio"
            value={formatCurrency(stats.avg_ticket || 0)}
            icon={<TrendingUp size={20} />}
          />
          <KPICard
            title="Órdenes totales"
            value={String(stats.total_orders || 0)}
            icon={<Package size={20} />}
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title font-semibold text-text-primary">Ventas por hora</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickFormatter={(v) => `Bs.${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`Bs. ${value.toFixed(2)}`, 'Ventas']}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {hourlySales.map((entry, index) => {
                      const maxVal = Math.max(...hourlySales.map(h => h.total || 0), 1)
                      return (
                        <Cell key={index} fill={entry.total === maxVal ? '#FF6B35' : 'rgba(255,107,53,0.3)'} />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <h3 className="text-title font-semibold text-text-primary mb-3">Últimas órdenes</h3>
              <div className="space-y-2">
                {recentOrders.length === 0 ? (
                  <p className="text-caption text-text-muted">Sin órdenes recientes</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                      <div>
                        <p className="text-caption font-medium text-text-primary">{order.order_number}</p>
                        <p className="text-label text-text-muted">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-caption font-medium text-accent">Bs. {order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate('/admin/orders')}
              >
                Ver todas
              </Button>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-title font-semibold text-text-primary">Asistente IA</h3>
                <Bot size={16} className="text-accent" />
              </div>
              <p className="text-caption text-text-muted mb-3">¿Qué quieres saber sobre tu negocio?</p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => navigate('/admin/ai-assistant')}
              >
                Abrir asistente
              </Button>
            </Card>
          </div>
        </div>

        {lowStock.length > 0 && (
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-status-warning/20 flex items-center justify-center">
                <AlertTriangle size={18} className="text-status-warning" />
              </div>
              <div>
                <h3 className="text-title font-semibold text-text-primary">Alertas de stock bajo</h3>
                <p className="text-caption text-text-muted">{lowStock.length} producto(s) por debajo del umbral</p>
              </div>
            </div>
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((prod: any) => (
                <div key={prod.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-text-muted" />
                    <span className="text-caption text-text-primary">{prod.name}</span>
                  </div>
                  <span className="text-caption font-medium text-status-warning">Stock: {prod.stock}</span>
                </div>
              ))}
            </div>
            {lowStock.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/admin/products')}>
                Ver todos ({lowStock.length})
              </Button>
            )}
          </Card>
        )}

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <h3 className="text-title font-semibold text-text-primary mb-3">Top 5 productos del día</h3>
            {topProducts.length === 0 ? (
              <p className="text-caption text-text-muted">Sin ventas hoy</p>
            ) : (
              <div className="space-y-2">
                {topProducts.slice(0, 5).map((prod: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-border-subtle last:border-0">
                    <div className="w-6 h-6 rounded-md bg-accent-muted flex items-center justify-center">
                      <Box size={12} className="text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-caption font-medium text-text-primary">{prod.product_name}</p>
                      <p className="text-label text-text-muted">{prod.total_qty} unidades</p>
                    </div>
                    <span className="text-caption font-semibold text-accent">{formatCurrency(prod.total_sales)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-title font-semibold text-text-primary mb-3">Estado del sistema</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Printer size={14} className="text-text-muted" />
                  <span className="text-caption text-text-secondary">Impresora</span>
                </div>
                <Badge variant="success" size="sm">Conectada</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-text-muted" />
                  <span className="text-caption text-text-secondary">Base de datos</span>
                </div>
                <Badge variant="success" size="sm">Activa</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-text-muted" />
                  <span className="text-caption text-text-secondary">Stock bajo</span>
                </div>
                <Badge variant={lowStock.length > 0 ? 'warning' : 'success'} size="sm">
                  {lowStock.length > 0 ? `${lowStock.length} productos` : 'Sin alertas'}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-text-muted" />
                  <span className="text-caption text-text-secondary">Modo</span>
                </div>
                <Badge variant="info" size="sm">Offline</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
