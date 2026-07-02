import React, { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Button } from '../../components/ui/Button'
import { DollarSign, ShoppingBag, TrendingUp, Award, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '../../lib/formatters'

export default function Statistics() {
  const [period, setPeriod] = useState('today')
  const [stats, setStats] = useState<any>({})
  const [dailySales, setDailySales] = useState<any[]>([])
  const [categorySales, setCategorySales] = useState<any[]>([])
  const [paymentDist, setPaymentDist] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [employeeSales, setEmployeeSales] = useState<any[]>([])

  useEffect(() => { loadData() }, [period])

  const loadData = async () => {
    try {
      const [statsData, catData, payData, topData, empData] = await Promise.all([
        window.api.orders.getStats(period),
        window.api.orders.getCategorySales(period),
        window.api.orders.getPaymentMethodDistribution(period),
        window.api.orders.getTopProducts(period),
        window.api.orders.getEmployeeSales(period),
      ])
      setStats(statsData)

      if (period === 'month') {
        setDailySales(await window.api.orders.getHourlySales('month'))
      } else {
        setDailySales([])
      }

      setCategorySales(catData)
      setPaymentDist(payData)
      setTopProducts(topData)
      setEmployeeSales(empData)
    } catch (err) { console.error(err) }
  }

  const handleExport = async () => {
    const csv = await window.api.orders.exportCsv()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-${period}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const PAYMENT_COLORS: Record<string, string> = {
    efectivo: '#4CAF50',
    tarjeta: '#2196F3',
    qr: '#FF9800',
    transferencia: '#9C27B0',
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-text-primary">Estadísticas</h1>
            <p className="text-body-sm text-text-muted">Análisis de ventas y rendimiento</p>
          </div>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} className="mr-1.5" />Exportar CSV
          </Button>
        </div>

        <div className="flex gap-2">
          {[{ key: 'today', label: 'Hoy' }, { key: 'week', label: 'Semana' }, { key: 'month', label: 'Mes' }, { key: 'year', label: 'Año' }].map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-caption font-medium transition-all ${period === p.key ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-white/10'}`}
            >{p.label}</button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KPICard title="Ventas totales" value={formatCurrency(stats.total_sales || 0)} icon={<DollarSign size={20} />} />
          <KPICard title="Órdenes" value={String(stats.total_orders || 0)} icon={<ShoppingBag size={20} />} />
          <KPICard title="Ticket promedio" value={formatCurrency(stats.avg_ticket || 0)} icon={<TrendingUp size={20} />} />
          <KPICard title="Producto top" value={topProducts[0]?.product_name || '—'} icon={<Award size={20} />} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <h3 className="text-title font-semibold text-text-primary mb-4">Ventas por categoría</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySales} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickFormatter={(v) => `Bs.${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    formatter={(value: number) => [formatCurrency(value), 'Ventas']} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {categorySales.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color || '#FF6B35'} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-title font-semibold text-text-primary mb-4">Método de pago</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentDist} dataKey="count" nameKey="payment_method" cx="50%" cy="50%" outerRadius={90} label={({ payment_method, percent }) => `${payment_method} ${(percent * 100).toFixed(0)}%`}>
                    {paymentDist.map((entry, idx) => (
                      <Cell key={idx} fill={PAYMENT_COLORS[entry.payment_method] || '#FF6B35'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    formatter={(value: number, name: string) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <h3 className="text-title font-semibold text-text-primary mb-4">Top 10 productos</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickFormatter={(v) => `Bs.${v}`} />
                  <YAxis type="category" dataKey="product_name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} width={140} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    formatter={(value: number) => [formatCurrency(value), 'Ventas']} />
                  <Bar dataKey="total_sales" fill="#FF6B35" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-title font-semibold text-text-primary mb-4">Empleado con más ventas</h3>
            <div className="space-y-3">
              {employeeSales.length === 0 ? (
                <p className="text-caption text-text-muted">Sin datos</p>
              ) : (
                employeeSales.map((emp: any, idx: number) => (
                  <div key={emp.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-label font-semibold text-accent">{idx + 1}</span>
                      </div>
                      <span className="text-body-sm text-text-primary">{emp.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-body-sm font-medium text-accent">{formatCurrency(emp.total_sales)}</span>
                      <p className="text-label text-text-muted">{emp.order_count} órdenes</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
