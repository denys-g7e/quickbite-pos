import { IpcMain, safeStorage } from 'electron'
import Database from 'better-sqlite3'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

function decryptValue(value: string): string {
  if (value.startsWith('enc:') && safeStorage.isEncryptionAvailable()) {
    try {
      const buf = Buffer.from(value.slice(4), 'base64')
      return safeStorage.decryptString(buf)
    } catch { return value }
  }
  return value
}

export function registerAIHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('ai:ask', async (_event, message: string) => {
    const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'ai_api_key'").get() as any
    const apiKey = settingsRow?.value ? decryptValue(settingsRow.value) : null

    if (!apiKey) {
      return '⚠️ API Key de Groq no configurada. Ve a Configuración > Integración IA para configurarla.'
    }

    const businessName = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || 'QuickBite'
    const today = new Date().toISOString().split('T')[0]

    const todaySales = (db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE date(created_at) = ? AND status != 'cancelled'
    `).get(today) as any)?.total || 0

    const todayOrders = (db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE date(created_at) = ? AND status != 'cancelled'
    `).get(today) as any)?.count || 0

    const avgTicket = (db.prepare(`
      SELECT COALESCE(ROUND(AVG(total), 2), 0) as avg FROM orders WHERE date(created_at) = ? AND status != 'cancelled'
    `).get(today) as any)?.avg || 0

    const topProducts = (db.prepare(`
      SELECT oi.product_name, SUM(oi.quantity) as qty
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE date(o.created_at) = ? AND o.status != 'cancelled'
      GROUP BY oi.product_name ORDER BY qty DESC LIMIT 5
    `).all(today) as any[])

    const lowStock = (db.prepare(`
      SELECT name, stock FROM products WHERE stock >= 0 AND stock <= 5 AND is_active = 1 LIMIT 5
    `).all() as any[])

    const peakHour = (db.prepare(`
      SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as count
      FROM orders WHERE date(created_at) = ? AND status != 'cancelled'
      GROUP BY hour ORDER BY count DESC LIMIT 1
    `).get(today) as any)?.hour || 'N/A'

    const weeklySales = (db.prepare(`
      SELECT date(created_at) as date, COALESCE(SUM(total), 0) as total
      FROM orders WHERE created_at >= date('now', '-7 days') AND status != 'cancelled'
      GROUP BY date(created_at) ORDER BY date(created_at)
    `).all() as any[])

    const yesterdaySales = (db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE date(created_at) = date('now', '-1 day') AND status != 'cancelled'
    `).get() as any)?.total || 0

    const systemPrompt = `Eres el asistente inteligente de QuickBite POS, un sistema de punto de venta para un restaurante de comida rápida en Bolivia. Tienes acceso a los datos del negocio:

DATOS DEL NEGOCIO:
- Nombre: ${businessName}
- Fecha actual: ${new Date().toLocaleDateString('es-BO')}
- Ventas hoy: Bs. ${todaySales}
- Órdenes hoy: ${todayOrders}
- Ticket promedio: Bs. ${avgTicket}
- Top productos hoy: ${topProducts.map((p: any) => `${p.product_name} (${p.qty})`).join(', ')}
- Stock bajo: ${lowStock.map((p: any) => `${p.name} (${p.stock})`).join(', ')}
- Hora pico: ${peakHour}
- Ventas ayer: Bs. ${yesterdaySales}
- Ventas esta semana: ${JSON.stringify(weeklySales.map((d: any) => ({ fecha: d.date, total: d.total })))}

Responde en español, de forma concisa y útil. Máximo 3 párrafos.
Si el usuario pregunta sobre datos específicos, usa los datos reales del contexto.
Puedes sugerir estrategias de negocio, analizar tendencias, alertar sobre problemas.`

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          return '⚠️ La API Key de Groq no es válida. Verifica la clave en Configuración > Integración IA.'
        }
        const err = await response.text()
        return `Error de Groq: ${err}`
      }

      const data: any = await response.json()
      return data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu solicitud.'
    } catch (error: any) {
      return `Error al contactar con Groq: ${error.message || 'Error desconocido'}`
    }
  })
}
