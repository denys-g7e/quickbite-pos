import React, { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Save, Printer, Key, Database, Download, Upload, Eye, EyeOff, CheckCircle2, Image as ImageIcon, QrCode, Palette, Trash2, Monitor, FileText, Clock, Gift, Smartphone, Heart, Mail, Plus, Zap, X } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [printerTestResult, setPrinterTestResult] = useState<any>(null)
  const [printers, setPrinters] = useState<Array<{ name: string; isDefault: boolean }>>([])
  const [qrPreview, setQrPreview] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteOptions, setDeleteOptions] = useState({ orders: true, products: true, categories: true })
  const [purgeDate, setPurgeDate] = useState('')
  const [purgeCount, setPurgeCount] = useState(0)
  const [purging, setPurging] = useState(false)
  const [purged, setPurged] = useState(false)
  const [hhRules, setHhRules] = useState<any[]>([])
  const [showNewHHModal, setShowNewHHModal] = useState(false)
  const [newHHRule, setNewHHRule] = useState({
    name: '', days: [1, 2, 3, 4, 5, 6, 0], timeStart: '18:00', timeEnd: '20:00',
    discountType: 'percentage', discountValue: 10, categoryId: null as number | null,
    productId: null as number | null, minQuantity: 1, priority: 0,
  })
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    if (settings.qr_image) {
      window.api.app.readFileBase64(settings.qr_image).then(setQrPreview).catch(() => setQrPreview(''))
    } else { setQrPreview('') }
  }, [settings.qr_image])

  useEffect(() => {
    if (settings.logo_path) {
      window.api.app.readFileBase64(settings.logo_path).then(setLogoPreview).catch(() => setLogoPreview(''))
    } else { setLogoPreview('') }
  }, [settings.logo_path])

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const all = await window.api.settings.getAll()
      setSettings(all)
      const list = await window.api.printer.getPrinters()
      setPrinters(list)
      const rules = await window.api.happyHour.listRules()
      setHhRules(rules)
      const cats = await window.api.categories.list()
      setCategories(cats)
      const prods = await window.api.products.list({ activeOnly: true })
      setProducts(prods)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(settings)) {
        await window.api.settings.set(key, value)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    }
    finally { setSaving(false) }
  }

  const handleTestPrinter = async () => {
    const result = await window.api.printer.test()
    setPrinterTestResult(result)
  }

  const handleTestApiKey = async () => {
    const result = await window.api.ai.ask('Hola, prueba de conexión. Responde solo "OK" si funciona.')
    setPrinterTestResult({ success: true, message: result })
  }

  const handleExportDB = async () => {
    await window.api.app.exportDB()
  }

  const handleImportDB = async () => {
    await window.api.app.importDB()
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
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-text-primary">Configuración</h1>
            <p className="text-body-sm text-text-muted">Administra los ajustes del sistema</p>
          </div>
          <Button onClick={handleSave} loading={saving}>
            {saved ? <CheckCircle2 size={16} className="mr-1.5" /> : <Save size={16} className="mr-1.5" />}
            {saved ? 'Guardado' : 'Guardar cambios'}
          </Button>
        </div>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Database size={18} className="text-accent" />
            Datos del negocio
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre del restaurante" value={settings.business_name || ''} onChange={(e) => updateSetting('business_name', e.target.value)} />
            <Input label="NIT empresa (Bolivia)" value={settings.nit_empresa || ''} onChange={(e) => updateSetting('nit_empresa', e.target.value)} />
            <Input label="Dirección" value={settings.address || ''} onChange={(e) => updateSetting('address', e.target.value)} />
            <Input label="Ciudad" value={settings.city || ''} onChange={(e) => updateSetting('city', e.target.value)} />
            <Input label="Teléfono" value={settings.phone || ''} onChange={(e) => updateSetting('phone', e.target.value)} />
            <Input label="Símbolo moneda" value={settings.currency_symbol || ''} onChange={(e) => updateSetting('currency_symbol', e.target.value)} />
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Heart size={18} className="text-accent" />
            General
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Mensaje de agradecimiento" value={settings.thank_you_message || 'Gracias por su visita!'} onChange={(e) => updateSetting('thank_you_message', e.target.value)} />
            <Input label="Umbral alerta stock bajo" type="number" value={settings.stock_alert_threshold || '10'} onChange={(e) => updateSetting('stock_alert_threshold', e.target.value)} />
            <Input label="Correo notificación turno" type="email" icon={<Mail size={16} />} placeholder="admin@correo.com" value={settings.notification_email || ''} onChange={(e) => updateSetting('notification_email', e.target.value)} />
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <ImageIcon size={18} className="text-accent" />
            Logo del restaurante
          </h3>
          <div className="space-y-3">
              {logoPreview && (
              <img src={logoPreview} alt="Logo" className="h-20 object-contain rounded-lg border border-border-light" />
            )}
            <Button variant="secondary" onClick={async () => {
              const path = await window.api.app.selectLogo()
              if (path) {
                updateSetting('logo_path', path)
              }
            }}>
              <Upload size={16} className="mr-1.5" />{settings.logo_path ? 'Cambiar logo' : 'Subir logo'}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Monitor size={18} className="text-accent" />
            Personalización
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre de la app" value={settings.app_name || 'QuickBite POS'} onChange={(e) => updateSetting('app_name', e.target.value)} />
            <div>
              <label className="block text-label font-medium text-text-secondary mb-1.5">Color del tema</label>
              <div className="flex gap-3 items-center">
                <input type="color" value={settings.theme_color || '#2563eb'} onChange={(e) => updateSetting('theme_color', e.target.value)} className="w-10 h-10 rounded-lg border border-border-light cursor-pointer bg-transparent p-0.5" />
                <span className="text-body-sm text-text-muted font-mono">{settings.theme_color || '#2563eb'}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Clock size={18} className="text-accent" />
            Hora Feliz
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-body-sm font-medium text-text-primary">Descuentos por hora feliz</p>
                <p className="text-label text-text-muted">Las reglas activas se aplican automáticamente al cobrar</p>
              </div>
              <Button size="sm" onClick={() => setShowNewHHModal(true)}>
                <Plus size={14} className="mr-1" />Nueva regla
              </Button>
            </div>

            {showNewHHModal && (
              <div className="bg-bg-tertiary rounded-xl p-4 border border-border-subtle space-y-3">
                <h4 className="text-body-sm font-semibold text-text-primary">Nueva regla de hora feliz</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Nombre" placeholder="Ej: 2x1 Cervezas" value={newHHRule.name} onChange={(e) => setNewHHRule({ ...newHHRule, name: e.target.value })} />
                  <div>
                    <label className="block text-label font-medium text-text-secondary mb-1.5">Tipo descuento</label>
                    <select className="w-full bg-bg-secondary border border-border-light rounded-lg px-3 py-2.5 text-body-sm text-text-primary focus:outline-none focus:border-accent" value={newHHRule.discountType} onChange={(e) => setNewHHRule({ ...newHHRule, discountType: e.target.value })}>
                      <option value="percentage">Porcentaje (%)</option>
                      <option value="fixed">Monto fijo (Bs)</option>
                      <option value="2x1">2x1 / Lleva N paga M</option>
                    </select>
                  </div>
                  <Input label={newHHRule.discountType === 'percentage' ? 'Descuento %' : newHHRule.discountType === 'fixed' ? 'Descuento Bs' : 'Cantidad mínima'} type="number" placeholder="10" value={newHHRule.discountValue} onChange={(e) => setNewHHRule({ ...newHHRule, discountValue: parseFloat(e.target.value) || 0 })} />
                  <Input label="Hora inicio" placeholder="18:00" value={newHHRule.timeStart} onChange={(e) => setNewHHRule({ ...newHHRule, timeStart: e.target.value })} />
                  <Input label="Hora fin" placeholder="20:00" value={newHHRule.timeEnd} onChange={(e) => setNewHHRule({ ...newHHRule, timeEnd: e.target.value })} />
                  <div>
                    <label className="block text-label font-medium text-text-secondary mb-1.5">Aplicar a categoría</label>
                    <select className="w-full bg-bg-secondary border border-border-light rounded-lg px-3 py-2.5 text-body-sm text-text-primary focus:outline-none focus:border-accent" value={newHHRule.categoryId || ''} onChange={(e) => setNewHHRule({ ...newHHRule, categoryId: e.target.value ? parseInt(e.target.value) : null, productId: null })}>
                      <option value="">Todas las categorías</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-label font-medium text-text-secondary mb-1.5">O a producto específico</label>
                    <select className="w-full bg-bg-secondary border border-border-light rounded-lg px-3 py-2.5 text-body-sm text-text-primary focus:outline-none focus:border-accent" value={newHHRule.productId || ''} onChange={(e) => setNewHHRule({ ...newHHRule, productId: e.target.value ? parseInt(e.target.value) : null, categoryId: null })}>
                      <option value="">Todos los productos</option>
                      {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-label font-medium text-text-secondary mb-1.5">Días de la semana</label>
                  <div className="flex gap-2">
                    {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((day, i) => (
                      <button key={i} onClick={() => {
                        const days = newHHRule.days.includes(i) ? newHHRule.days.filter((d: number) => d !== i) : [...newHHRule.days, i]
                        setNewHHRule({ ...newHHRule, days })
                      }} className={`px-3 py-1.5 text-label rounded-lg border transition-all ${newHHRule.days.includes(i) ? 'bg-accent text-white border-accent' : 'bg-bg-secondary text-text-secondary border-border-light hover:border-accent'}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowNewHHModal(false)}>Cancelar</Button>
                  <Button size="sm" onClick={async () => {
                    if (!newHHRule.name.trim()) return
                    await window.api.happyHour.createRule({
                      name: newHHRule.name, days: newHHRule.days, timeStart: newHHRule.timeStart,
                      timeEnd: newHHRule.timeEnd, discountType: newHHRule.discountType,
                      discountValue: newHHRule.discountValue, categoryId: newHHRule.categoryId,
                      productId: newHHRule.productId, minQuantity: newHHRule.discountType === '2x1' ? newHHRule.discountValue : 1,
                      priority: 0,
                    })
                    setShowNewHHModal(false)
                    setNewHHRule({ name: '', days: [1,2,3,4,5,6,0], timeStart: '18:00', timeEnd: '20:00', discountType: 'percentage', discountValue: 10, categoryId: null, productId: null, minQuantity: 1, priority: 0 })
                    const rules = await window.api.happyHour.listRules()
                    setHhRules(rules)
                  }} disabled={!newHHRule.name.trim()}>
                    <Zap size={14} className="mr-1" />Crear regla
                  </Button>
                </div>
              </div>
            )}

            {hhRules.length === 0 && !showNewHHModal && (
              <p className="text-body-sm text-text-muted">Sin reglas de hora feliz configuradas</p>
            )}

            {hhRules.length > 0 && (
              <div className="space-y-2">
                {hhRules.map((rule: any) => {
                  let days: number[]
                  try { days = JSON.parse(rule.days) } catch { days = [] }
                  const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
                  return (
                    <div key={rule.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-subtle">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-label px-1.5 py-0.5 rounded-full font-medium ${rule.enabled ? 'bg-status-success/20 text-status-success' : 'bg-text-hint/20 text-text-hint'}`}>
                            {rule.enabled ? 'Activo' : 'Inactivo'}
                          </span>
                          <p className="text-body-sm font-medium text-text-primary">{rule.name}</p>
                        </div>
                        <div className="flex gap-3 mt-1 text-caption text-text-muted">
                          <span>{rule.discount_type === 'percentage' ? `${rule.discount_value}%` : rule.discount_type === 'fixed' ? `Bs${rule.discount_value}` : `${rule.discount_value}x1`}</span>
                          <span>{rule.time_start} - {rule.time_end}</span>
                          <span>{days.map((d: number) => dayNames[d]).join(', ')}</span>
                          {rule.category_id && <span>Categoría específica</span>}
                          {rule.product_id && <span>Producto específico</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3">
                        <button onClick={async () => {
                          await window.api.happyHour.updateRule(rule.id, { enabled: rule.enabled ? 0 : 1 })
                          const rules = await window.api.happyHour.listRules()
                          setHhRules(rules)
                        }} className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors">
                          {rule.enabled ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={async () => {
                          if (!confirm(`¿Eliminar regla "${rule.name}"?`)) return
                          await window.api.happyHour.deleteRule(rule.id)
                          const rules = await window.api.happyHour.listRules()
                          setHhRules(rules)
                        }} className="p-1.5 rounded-lg hover:bg-status-error/10 text-text-muted hover:text-status-error transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Smartphone size={18} className="text-accent" />
            Modo demostración
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm font-medium text-text-primary">Activar modo demo</p>
              <p className="text-label text-text-muted">Muestra un banner "MODO DEMO" en el POS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.demo_mode === 'true'} onChange={(e) => updateSetting('demo_mode', e.target.checked ? 'true' : 'false')} />
              <div className="w-10 h-5 bg-bg-tertiary rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Database size={18} className="text-status-warning" />
            Purgar órdenes antiguas
          </h3>
          <p className="text-body-sm text-text-muted mb-3">Elimina órdenes anteriores a una fecha específica para liberar espacio.</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-label font-medium text-text-secondary mb-1.5">Órdenes anteriores a:</label>
              <input
                type="date"
                className="w-full bg-bg-tertiary border border-border-light rounded-lg px-3 py-2.5 text-body-sm text-text-primary focus:outline-none focus:border-accent"
                value={purgeDate}
                onChange={(e) => {
                  setPurgeDate(e.target.value)
                  if (e.target.value) {
                    window.api.orders.getPurgeCount(e.target.value).then(setPurgeCount).catch(() => setPurgeCount(0))
                  } else { setPurgeCount(0) }
                }}
              />
            </div>
            <Button variant="secondary" className="text-status-warning border-status-warning/30 hover:bg-status-warning/10" disabled={!purgeDate || purgeCount === 0} onClick={async () => {
              if (!purgeDate || purgeCount === 0) return
              if (!confirm(`¿Eliminar ${purgeCount} órdenes anteriores a ${purgeDate}? Esta acción no se puede deshacer.`)) return
              setPurging(true)
              try {
                await window.api.orders.purge(purgeDate)
                setPurged(true)
                setPurgeCount(0)
                setTimeout(() => setPurged(false), 3000)
              } catch (err) { console.error(err) }
              setPurging(false)
            }} loading={purging}>
              {purged ? <CheckCircle2 size={16} className="mr-1.5" /> : <Trash2 size={16} className="mr-1.5" />}
              {purged ? 'Purgado' : purgeCount > 0 ? `Purgar (${purgeCount} órdenes)` : 'Selecciona una fecha'}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Printer size={18} className="text-accent" />
            Modo de impresión
          </h3>
          <div className="space-y-3">
            <p className="text-body-sm text-text-muted">Elige qué se imprime al cobrar una orden:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'both', label: 'Cliente + Cocina', icon: FileText },
                { value: 'invoice_only', label: 'Solo Cliente', icon: FileText },
                { value: 'ticket_only', label: 'Solo Cocina', icon: Printer },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('print_mode', opt.value)}
                  className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-all text-body-sm font-medium ${
                    (settings.print_mode || 'both') === opt.value
                      ? 'bg-accent-muted border-accent text-accent'
                      : 'bg-bg-tertiary border-border-light text-text-secondary hover:border-text-hint'
                  }`}
                >
                  <opt.icon size={20} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <QrCode size={18} className="text-accent" />
            Pago QR
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm font-medium text-text-primary">Mostrar QR al pagar</p>
                <p className="text-label text-text-muted">Muestra la imagen QR como método de pago en POS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.qr_enabled === 'true'} onChange={(e) => updateSetting('qr_enabled', e.target.checked ? 'true' : 'false')} />
                <div className="w-10 h-5 bg-bg-tertiary rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
            <div className="space-y-3">
              {qrPreview && (
                <img src={qrPreview} alt="QR" className="h-32 object-contain rounded-lg border border-border-light mx-auto" />
              )}
              <Button variant="secondary" onClick={async () => {
                const path = await window.api.app.selectLogo()
                if (path) {
                  updateSetting('qr_image', path)
                }
              }}>
                <Upload size={16} className="mr-1.5" />{settings.qr_image ? 'Cambiar imagen QR' : 'Subir imagen QR'}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Key size={18} className="text-accent" />
            Integración IA (Groq)
          </h3>
          <div className="space-y-3">
            <div className="relative">
              <Input
                label="API Key Groq"
                type={showApiKey ? 'text' : 'password'}
                placeholder="gsk_..."
                value={settings.ai_api_key || ''}
                onChange={(e) => updateSetting('ai_api_key', e.target.value)}
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-8 text-text-muted hover:text-text-primary"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Button variant="secondary" size="sm" onClick={handleTestApiKey}>
              Probar conexión
            </Button>
            {printerTestResult && printerTestResult.message && (
              <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/20 text-body-sm text-status-success">
                {printerTestResult.message}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Printer size={18} className="text-accent" />
            Impresora
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-label font-medium text-text-secondary mb-1.5">Impresora seleccionada</label>
              <select
                className="w-full bg-bg-tertiary border border-border-light rounded-lg px-3 py-2.5 text-body-sm text-text-primary focus:outline-none focus:border-accent"
                value={settings.selected_printer || ''}
                onChange={(e) => updateSetting('selected_printer', e.target.value)}
              >
                <option value="">Auto-detectar (recomendado)</option>
                {printers.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label font-medium text-text-secondary mb-1.5">Ancho de papel</label>
              <select
                className="w-full bg-bg-tertiary border border-border-light rounded-lg px-3 py-2.5 text-body-sm text-text-primary focus:outline-none focus:border-accent"
                value="80mm"
              >
                <option value="58mm">58mm</option>
                <option value="80mm">80mm</option>
              </select>
            </div>
            <Button variant="secondary" size="sm" onClick={handleTestPrinter}>
              Prueba de impresión
            </Button>
            {printerTestResult && (
              <Badge variant={printerTestResult.success ? 'success' : 'error'}>
                {printerTestResult.success ? 'Impresión exitosa' : `Error: ${printerTestResult.error}`}
              </Badge>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Database size={18} className="text-accent" />
            Sistema
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleExportDB}>
                <Download size={16} className="mr-1.5" />Respaldo DB
              </Button>
              <Button variant="secondary" onClick={handleImportDB}>
                <Upload size={16} className="mr-1.5" />Restaurar DB
              </Button>
            </div>
            <div>
              <label className="block text-label font-medium text-text-secondary mb-1.5">Tiempo de inactividad antes de cerrar sesión</label>
              <select
                className="w-full bg-bg-tertiary border border-border-light rounded-lg px-3 py-2.5 text-body-sm text-text-primary focus:outline-none focus:border-accent"
                value={settings.session_timeout || '5'}
                onChange={(e) => updateSetting('session_timeout', e.target.value)}
              >
                <option value="0">Desactivado</option>
                <option value="5">5 minutos</option>
                <option value="10">10 minutos</option>
                <option value="15">15 minutos</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Trash2 size={18} className="text-status-error" />
            Borrar datos
          </h3>
          {!showDeleteConfirm ? (
            <div>
              <p className="text-body-sm text-text-muted mb-3">Selecciona qué datos borrar. Requiere credenciales de administrador.</p>
              <div className="space-y-2 mb-4">
                {[
                  { key: 'orders' as const, label: 'Órdenes y pedidos', desc: 'Elimina todas las órdenes registradas' },
                  { key: 'products' as const, label: 'Productos', desc: 'Elimina todos los productos del menú' },
                  { key: 'categories' as const, label: 'Categorías', desc: 'Elimina todas las categorías' },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-3 p-3 rounded-lg border border-border-light hover:bg-bg-tertiary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteOptions[opt.key]}
                      onChange={() => setDeleteOptions((prev) => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                      className="w-4 h-4 rounded border-border-light text-accent focus:ring-accent"
                    />
                    <div>
                      <p className="text-body-sm font-medium text-text-primary">{opt.label}</p>
                      <p className="text-caption text-text-muted">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <Button variant="secondary" className="text-status-error border-status-error/30 hover:bg-status-error/10" onClick={() => {
                const anySelected = Object.values(deleteOptions).some(Boolean)
                if (!anySelected) return
                setShowDeleteConfirm(true)
              }}>
                <Trash2 size={16} className="mr-1.5" />Continuar con eliminación
              </Button>
            </div>
          ) : (
            <div className="space-y-3 border border-status-error/30 rounded-xl p-4 bg-status-error/5">
              <p className="text-body-sm font-medium text-status-error">Confirma tu identidad para borrar los datos seleccionados</p>
              <div className="text-body-sm text-text-muted space-y-1">
                {deleteOptions.orders && <p>- Órdenes y pedidos</p>}
                {deleteOptions.products && <p>- Productos</p>}
                {deleteOptions.categories && <p>- Categorías</p>}
              </div>
              <Input label="Correo del administrador" type="email" value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} />
              <Input label="Contraseña" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
              {deleteError && <p className="text-body-sm text-status-error">{deleteError}</p>}
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => { setShowDeleteConfirm(false); setDeleteEmail(''); setDeletePassword(''); setDeleteError('') }}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-status-error hover:bg-status-error/90" loading={deleting} onClick={async () => {
                  setDeleteError('')
                  setDeleting(true)
                  try {
                    const result = await window.api.auth.login({ email: deleteEmail, password: deletePassword })
                    if (result.role !== 'admin') { setDeleteError('Solo el administrador puede borrar datos'); setDeleting(false); return }
                    await window.api.app.deleteAllData(deleteOptions)
                    setShowDeleteConfirm(false); setDeleteEmail(''); setDeletePassword('')
                    window.location.reload()
                  } catch {
                    setDeleteError('Credenciales inválidas')
                  }
                  setDeleting(false)
                }}>
                  <Trash2 size={16} className="mr-1.5" />Borrar
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
