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

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_sales_summary',
      description: 'Obtener resumen de ventas (total, ordenes, ticket promedio) para un periodo',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'yesterday', 'week', 'month', 'custom'], description: 'Periodo a consultar' },
          dateFrom: { type: 'string', description: 'Fecha inicio (YYYY-MM-DD) solo si period=custom' },
          dateTo: { type: 'string', description: 'Fecha fin (YYYY-MM-DD) solo si period=custom' },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_products',
      description: 'Obtener los productos mas vendidos en un periodo',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month'], description: 'Periodo' },
          limit: { type: 'number', description: 'Cuantos productos (default 10)' },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_unsold_products',
      description: 'Obtener productos que NO se vendieron en el periodo indicado',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month'], description: 'Periodo' },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_peak_hours',
      description: 'Obtener las horas con mas ventas/ordenes en un periodo',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month'], description: 'Periodo' },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_employee_stats',
      description: 'Obtener estadisticas de empleados (ventas, ordenes, cancelaciones)',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month'], description: 'Periodo' },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_low_stock',
      description: 'Obtener productos con stock bajo (menor o igual al limite)',
      parameters: {
        type: 'object',
        properties: {
          threshold: { type: 'number', description: 'Limite de stock (default 5)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_category_sales',
      description: 'Obtener ventas agrupadas por categoria',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month'], description: 'Periodo' },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_cancelled_orders',
      description: 'Obtener informacion de ordenes canceladas en un periodo',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month'], description: 'Periodo' },
        },
        required: ['period'],
      },
    },
  },
]

function applyPeriodFilter(period: string, dateFrom?: string, dateTo?: string): string {
  switch (period) {
    case 'today': return "date(created_at) = date('now', 'localtime')"
    case 'yesterday': return "date(created_at) = date('now', '-1 day', 'localtime')"
    case 'week': return "created_at >= datetime('now', '-7 days', 'localtime')"
    case 'month': return "created_at >= datetime('now', '-30 days', 'localtime')"
    case 'custom':
      if (dateFrom && dateTo) return `date(created_at) >= '${dateFrom}' AND date(created_at) <= '${dateTo}'`
      if (dateFrom) return `date(created_at) >= '${dateFrom}'`
      return "date(created_at) = date('now', 'localtime')"
    default: return "date(created_at) = date('now', 'localtime')"
  }
}

function executeTool(db: Database.Database, name: string, args: any): any {
  switch (name) {
    case 'get_sales_summary': {
      const filter = applyPeriodFilter(args.period, args.dateFrom, args.dateTo)
      const data = db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as total_sales,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN 1 ELSE 0 END), 0) as total_orders,
          COALESCE(ROUND(AVG(CASE WHEN status != 'cancelled' THEN total ELSE NULL END), 2), 0) as avg_ticket,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_orders,
          COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_orders
        FROM orders WHERE ${filter}
      `).get()
      return data
    }
    case 'get_top_products': {
      const filter = applyPeriodFilter(args.period)
      const limit = args.limit || 10
      return db.prepare(`
        SELECT oi.product_name, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_sales
        FROM order_items oi JOIN orders o ON oi.order_id = o.id
        WHERE ${filter} AND o.status != 'cancelled'
        GROUP BY oi.product_name ORDER BY total_sales DESC LIMIT ?
      `).all(limit)
    }
    case 'get_unsold_products': {
      const filter = applyPeriodFilter(args.period)
      const soldIds = db.prepare(`
        SELECT DISTINCT oi.product_id FROM order_items oi JOIN orders o ON oi.order_id = o.id
        WHERE ${filter} AND o.status != 'cancelled'
      `).all() as any[]
      const soldSet = new Set(soldIds.map((r: any) => r.product_id))
      const allProducts = db.prepare("SELECT id, name, price, stock FROM products WHERE is_active = 1").all() as any[]
      return allProducts.filter((p: any) => !soldSet.has(p.id)).map((p: any) => ({ name: p.name, price: p.price, stock: p.stock }))
    }
    case 'get_peak_hours': {
      const filter = applyPeriodFilter(args.period)
      return db.prepare(`
        SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as order_count, COALESCE(SUM(total), 0) as total_sales
        FROM orders WHERE ${filter} AND status != 'cancelled'
        GROUP BY hour ORDER BY order_count DESC LIMIT 5
      `).all()
    }
    case 'get_employee_stats': {
      const filter = applyPeriodFilter(args.period)
      return db.prepare(`
        SELECT u.name, u.id,
          COUNT(*) as order_count,
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) as total_sales,
          COALESCE(SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_count
        FROM orders o JOIN users u ON o.employee_id = u.id
        WHERE ${filter}
        GROUP BY u.id ORDER BY total_sales DESC
      `).all()
    }
    case 'get_low_stock': {
      const threshold = args.threshold || 5
      return db.prepare(`
        SELECT p.name, p.stock, p.sku, c.name as category_name
        FROM products p LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.stock >= 0 AND p.stock <= ? AND p.is_active = 1
        ORDER BY p.stock ASC
      `).all(threshold)
    }
    case 'get_category_sales': {
      const filter = applyPeriodFilter(args.period)
      return db.prepare(`
        SELECT c.name, c.color, COALESCE(SUM(oi.subtotal), 0) as total, COUNT(oi.id) as items_count
        FROM order_items oi JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        RIGHT JOIN categories c ON p.category_id = c.id
        WHERE ${filter} AND o.status != 'cancelled'
        GROUP BY c.id ORDER BY total DESC
      `).all()
    }
    case 'get_cancelled_orders': {
      const filter = applyPeriodFilter(args.period)
      return db.prepare(`
        SELECT o.order_number, o.total, o.created_at, u.name as employee_name,
          oi.product_name, oi.cancel_reason
        FROM orders o JOIN users u ON o.employee_id = u.id
        LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.item_status = 'cancelado'
        WHERE ${filter} AND o.status = 'cancelled'
        ORDER BY o.created_at DESC LIMIT 20
      `).all()
    }
    default:
      return { error: `Funcion desconocida: ${name}` }
  }
}

export function registerAIHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('ai:ask', async (_event, message: string) => {
    const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'ai_api_key'").get() as any
    const apiKey = settingsRow?.value ? decryptValue(settingsRow.value) : null

    if (!apiKey) {
      return '⚠️ API Key de Groq no configurada. Ve a Configuración > Integración IA para configurarla.'
    }

    const businessName = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || 'QuickBite'

    const systemPrompt = `Eres el asistente inteligente de QuickBite POS, un sistema de punto de venta para un restaurante en Bolivia. TienES acceso a funciones para consultar datos reales de la base de datos local.

Nombre del negocio: ${businessName}
Fecha actual: ${new Date().toLocaleDateString('es-BO')}

IMPORTANTE:
- Responde SIEMPRE en español, de forma concisa y util.
- Usa las funciones disponibles para responder preguntas sobre ventas, productos, empleados, etc.
- NO inventes datos. Si no tienes informacion, usa las funciones para obtenerla.
- Si no entiendes la pregunta, pide aclaracion.
- Puedes llamar multiples funciones si es necesario para responder.
- Maximo 3 parrafos en tu respuesta final.`

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]

    const callApi = async (msgs: any[]): Promise<any> => {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: msgs,
          tools: TOOLS,
          tool_choice: 'auto',
          max_tokens: 2048,
          temperature: 0.5,
        }),
      })
      if (!response.ok) {
        const errText = await response.text()
        if (response.status === 401) throw new Error('API_KEY_INVALIDA')
        throw new Error(errText)
      }
      return response.json()
    }

    try {
      let data = await callApi(messages)
      const choice = data.choices?.[0]
      if (!choice) return 'Lo siento, no pude procesar tu solicitud.'

      let content = choice.message?.content || ''
      const toolCalls = choice.message?.tool_calls

      if (toolCalls && toolCalls.length > 0) {
        messages.push(choice.message)
        for (const tc of toolCalls) {
          if (tc.type === 'function') {
            const fnName = tc.function.name
            let fnArgs: any = {}
            try { fnArgs = JSON.parse(tc.function.arguments) } catch {}
            const result = executeTool(db, fnName, fnArgs)
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            })
          }
        }

        data = await callApi(messages)
        content = data.choices?.[0]?.message?.content || content
      }

      return content || 'Listo. ¿Alguna otra pregunta?'
    } catch (error: any) {
      if (error.message === 'API_KEY_INVALIDA') {
        return '⚠️ La API Key de Groq no es valida. Verifica la clave en Configuracion > Integracion IA.'
      }
      return `⚠️ No pude contactar con el asistente IA (${error.message || 'Error desconocido'}). Los datos locales siguen disponibles en el Dashboard.`
    }
  })
}