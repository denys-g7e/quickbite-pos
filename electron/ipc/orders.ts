import { IpcMain, app } from 'electron'
import Database from 'better-sqlite3'
import * as path from 'path'
import * as fs from 'fs'
import { sessionStore } from '../session'
import { logAudit } from './audit'
import { applyHappyHourToItem, getActiveHappyHourRules } from './happy-hour'
const ExcelJS = require('exceljs')
const AdmZip = require('adm-zip')

export function registerOrderHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('orders:create', (_event, data: {
    customerName?: string
    customerNIT?: string
    serviceType: string
    tableNumber?: number
    items: Array<{
      productId: number
      productName: string
      productPrice: number
      categoryName?: string
      quantity: number
      subtotal: number
      notes?: string
    }>
    subtotal: number
    discount?: number
    total: number
    paymentMethod: string
    amountPaid?: number
    change?: number
    employeeId: number
  }) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const orderNumber = generateOrderNumber(db)

    let itemDiscount = 0
    let discountLabels: string[] = []

    const activeRules = getActiveHappyHourRules(db)
    if (activeRules.length > 0) {
      const itemsWithDiscount = data.items.map((item) => {
        const p = db.prepare("SELECT category_id FROM products WHERE id = ?").get(item.productId) as any
        const { discount, discountLabel } = applyHappyHourToItem(db, item.productId, p?.category_id || null, item.productPrice, item.quantity)
        if (discountLabel) discountLabels.push(discountLabel)
        return { ...item, happyHourDiscount: discount }
      })
      const serverDiscount = itemsWithDiscount.reduce((sum, i) => sum + i.happyHourDiscount, 0)

      if (Math.abs((data.discount || 0) - serverDiscount) > 0.01) {
        console.log(`[security] Happy Hour override: client=${data.discount}, server=${serverDiscount}`)
        logAudit(db, { userId: data.employeeId, action: 'price_override', entityType: 'order', details: { attemptedDiscount: data.discount, correctedDiscount: serverDiscount } })
        itemDiscount = serverDiscount
      } else {
        itemDiscount = data.discount || 0
      }
    } else {
      itemDiscount = data.discount || 0
    }

    const total = data.subtotal - itemDiscount
    const amountPaid = data.amountPaid || total
    const changeAmount = data.paymentMethod === 'efectivo' ? Math.max(0, amountPaid - total) : 0

    const orderId = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO orders (order_number, customer_name, customer_nit, service_type, table_number, subtotal, discount, total, payment_method, amount_paid, "change", employee_id, status, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now', 'localtime'))
      `).run(
        orderNumber,
        data.customerName || 'Consumidor Final',
        data.customerNIT || null,
        data.serviceType,
        data.tableNumber || null,
        data.subtotal,
        itemDiscount,
        total,
        data.paymentMethod,
        amountPaid,
        changeAmount,
        data.employeeId,
      )

      const orderId = result.lastInsertRowid as number

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal, notes, category_name, item_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
      `)

      const deductStock = db.prepare(`
        UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= 0
      `)

      for (const item of data.items) {
        insertItem.run(orderId, item.productId, item.productName, item.productPrice, item.quantity, item.subtotal, item.notes || null, item.categoryName || '')
        deductStock.run(item.quantity, item.productId)
      }

      return orderId
    })()

    return {
      id: orderId,
      orderNumber,
      discount: itemDiscount,
      total: total,
      discountLabels: discountLabels.length > 0 ? [...new Set(discountLabels)] : [],
    }
  })

  ipcMain.handle('orders:list', (_event, filters?: {
    status?: string
    dateFrom?: string
    dateTo?: string
    employeeId?: number
    limit?: number
  }) => {
    let query = `
      SELECT o.*, u.name as employee_name,
        (SELECT GROUP_CONCAT(oi.quantity || 'x ' || oi.product_name, ', ') FROM order_items oi WHERE oi.order_id = o.id) as items_summary
      FROM orders o
      LEFT JOIN users u ON o.employee_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters?.status) {
      query += ' AND o.status = ?'
      params.push(filters.status)
    }
    if (filters?.dateFrom) {
      query += ' AND o.created_at >= ?'
      params.push(filters.dateFrom)
    }
    if (filters?.dateTo) {
      query += ' AND o.created_at <= ?'
      params.push(filters.dateTo)
    }
    if (filters?.employeeId) {
      query += ' AND o.employee_id = ?'
      params.push(filters.employeeId)
    }

    query += ' ORDER BY o.created_at DESC'

    if (filters?.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }

    return db.prepare(query).all(...params)
  })

  ipcMain.handle('orders:get-by-id', (_event, id: number) => {
    const order = db.prepare(`
      SELECT o.*, u.name as employee_name
      FROM orders o
      LEFT JOIN users u ON o.employee_id = u.id
      WHERE o.id = ?
    `).get(id) as any

    if (order) {
      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id)
    }

    return order
  })

  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending: ['preparing', 'completed', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed', 'cancelled'],
    completed: ['cancelled'],
    cancelled: [],
  }

  ipcMain.handle('orders:update-status', (_event, id: number, status: string) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const VALID_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled']
    if (!VALID_STATUSES.includes(status)) throw new Error('Estado inválido')

    const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(id) as any
    if (!order) throw new Error('Orden no encontrada')

    const allowed = ALLOWED_TRANSITIONS[order.status]
    if (!allowed || !allowed.includes(status)) {
      throw new Error(`Transición no permitida: ${order.status} → ${status}`)
    }

    const items = db.prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?").all(id) as any[]
    const changeStock = db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ? AND stock >= 0`)

    if (order.status === 'completed' && status !== 'completed') {
      for (const item of items) { changeStock.run(item.quantity, item.product_id) }
    } else if (order.status !== 'completed' && status === 'completed') {
      for (const item of items) { changeStock.run(-item.quantity, item.product_id) }
    }

    if (status === 'completed') {
      db.prepare("UPDATE order_items SET item_status = 'entregado', ready_at = COALESCE(ready_at, datetime('now','localtime')) WHERE order_id = ? AND item_status != 'cancelado'").run(id)
    }
    if (status === 'ready') {
      db.prepare("UPDATE order_items SET item_status = 'listo', ready_at = COALESCE(ready_at, datetime('now','localtime')) WHERE order_id = ? AND item_status NOT IN ('listo','entregado','cancelado')").run(id)
    }
    if (status === 'preparing') {
      db.prepare("UPDATE order_items SET item_status = CASE WHEN category_name IN ('Bebidas') THEN 'en_barra' ELSE 'en_cocina' END WHERE order_id = ? AND item_status = 'pendiente'").run(id)
    }

    const completedAt = status === 'completed' ? new Date().toISOString() : null
    db.prepare('UPDATE orders SET status = ?, completed_at = COALESCE(?, completed_at) WHERE id = ?').run(status, completedAt, id)
    return { updated: true }
  })

  ipcMain.handle('orders:cancel', (_event, id: number, reason?: string) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(id) as any
    if (!order) throw new Error('Orden no encontrada')

    const allowed = ALLOWED_TRANSITIONS[order.status]
    if (!allowed || !allowed.includes('cancelled')) {
      throw new Error(`No se puede cancelar una orden en estado ${order.status}`)
    }

    db.transaction(() => {
      const items = db.prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?").all(id) as any[]
      const restoreStock = db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ? AND stock >= 0`)
      for (const item of items) {
        restoreStock.run(item.quantity, item.product_id)
      }
      db.prepare("UPDATE order_items SET item_status = 'cancelado', cancel_reason = ? WHERE order_id = ? AND item_status NOT IN ('cancelado','entregado')").run(reason || null, id)
      db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(id)
    })()
    const session = sessionStore.get()
    logAudit(db, { userId: session?.id, action: 'order_cancelled', entityType: 'order', entityId: id, details: { previousStatus: order.status, reason } })
    return { cancelled: true }
  })

  ipcMain.handle('orders:today-sales', () => {
    const result = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM orders
      WHERE date(created_at) = date('now', 'localtime') AND status != 'cancelled'
    `).get() as any
    return result.total
  })

  ipcMain.handle('orders:today-orders', () => {
    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE date(created_at) = date('now', 'localtime') AND status != 'cancelled'
    `).get() as any
    return result.count
  })

  ipcMain.handle('orders:hourly-sales', (_event, period?: string) => {
    let dateFilter = "date(created_at) = date('now', 'localtime')"
    if (period === 'week') dateFilter = "created_at >= datetime('now', '-7 days', 'localtime')"
    else if (period === 'month') dateFilter = "created_at >= datetime('now', '-30 days', 'localtime')"

    return db.prepare(`
      SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COALESCE(SUM(total), 0) as total
      FROM orders
      WHERE ${dateFilter} AND status != 'cancelled'
      GROUP BY strftime('%H', created_at)
      ORDER BY hour
    `).all()
  })

  ipcMain.handle('orders:stats', (_event, period?: string) => {
    let dateFilter = "date(created_at) = date('now', 'localtime')"
    if (period === 'week') dateFilter = "created_at >= datetime('now', '-7 days', 'localtime')"
    else if (period === 'month') dateFilter = "created_at >= datetime('now', '-30 days', 'localtime')"
    else if (period === 'year') dateFilter = "created_at >= datetime('now', '-1 year', 'localtime')"

    return db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as total_sales,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN 1 ELSE 0 END), 0) as total_orders,
        COALESCE(ROUND(AVG(CASE WHEN status != 'cancelled' THEN total ELSE NULL END), 2), 0) as avg_ticket,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_orders,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_orders
      FROM orders
      WHERE ${dateFilter}
    `).get()
  })

  ipcMain.handle('orders:top-products', (_event, period?: string) => {
    let dateFilter = "date(o.created_at) = date('now', 'localtime')"
    if (period === 'week') dateFilter = "o.created_at >= datetime('now', '-7 days', 'localtime')"
    else if (period === 'month') dateFilter = "o.created_at >= datetime('now', '-30 days', 'localtime')"

    return db.prepare(`
      SELECT oi.product_name, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE ${dateFilter} AND o.status != 'cancelled'
      GROUP BY oi.product_name
      ORDER BY total_sales DESC
      LIMIT 10
    `).all()
  })

  ipcMain.handle('orders:category-sales', (_event, period?: string) => {
    let dateFilter = "date(o.created_at) = date('now', 'localtime')"
    if (period === 'week') dateFilter = "o.created_at >= datetime('now', '-7 days', 'localtime')"
    else if (period === 'month') dateFilter = "o.created_at >= datetime('now', '-30 days', 'localtime')"

    return db.prepare(`
      SELECT c.name, c.color, COALESCE(SUM(oi.subtotal), 0) as total
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      RIGHT JOIN categories c ON p.category_id = c.id
      WHERE ${dateFilter} AND o.status != 'cancelled'
      GROUP BY c.id
      ORDER BY total DESC
    `).all()
  })

  ipcMain.handle('orders:payment-method-dist', (_event, period?: string) => {
    let dateFilter = "date(created_at) = date('now', 'localtime')"
    if (period === 'week') dateFilter = "created_at >= datetime('now', '-7 days', 'localtime')"
    else if (period === 'month') dateFilter = "created_at >= datetime('now', '-30 days', 'localtime')"

    return db.prepare(`
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM orders
      WHERE ${dateFilter} AND status != 'cancelled' AND payment_method IS NOT NULL
      GROUP BY payment_method
      ORDER BY count DESC
    `).all()
  })

  ipcMain.handle('orders:employee-sales', (_event, period?: string) => {
    let dateFilter = "date(o.created_at) = date('now', 'localtime')"
    if (period === 'week') dateFilter = "o.created_at >= datetime('now', '-7 days', 'localtime')"
    else if (period === 'month') dateFilter = "o.created_at >= datetime('now', '-30 days', 'localtime')"

    return db.prepare(`
      SELECT u.name, u.id, COUNT(*) as order_count, COALESCE(SUM(o.total), 0) as total_sales
      FROM orders o
      JOIN users u ON o.employee_id = u.id
      WHERE ${dateFilter} AND o.status != 'cancelled'
      GROUP BY u.id
      ORDER BY total_sales DESC
    `).all()
  })

  ipcMain.handle('orders:export-csv', (_event, filters?: any) => {
    let query = `
      SELECT o.order_number, o.customer_name, o.customer_nit, o.service_type,
             o.total, o.payment_method, o.status, o.created_at, u.name as employee_name
      FROM orders o
      LEFT JOIN users u ON o.employee_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    if (filters?.dateFrom) { query += ' AND o.created_at >= ?'; params.push(filters.dateFrom) }
    if (filters?.dateTo) { query += ' AND o.created_at <= ?'; params.push(filters.dateTo) }
    if (filters?.status) { query += ' AND o.status = ?'; params.push(filters.status) }
    query += ' ORDER BY o.created_at DESC'

    const rows = db.prepare(query).all(...params) as any[]
    const header = 'N° Orden,Cliente,NIT,Tipo Servicio,Total,Método Pago,Estado,Fecha,Empleado'
    const csv = [header, ...rows.map((r: any) =>
      `"${r.order_number}","${r.customer_name}","${r.customer_nit || ''}","${r.service_type}",${r.total},"${r.payment_method}","${r.status}","${r.created_at}","${r.employee_name}"`
    )].join('\n')
    return csv
  })

  ipcMain.handle('orders:weekly-sales', () => {
    return db.prepare(`
      SELECT date(created_at) as date, COALESCE(SUM(total), 0) as total
      FROM orders
      WHERE created_at >= datetime('now', '-7 days', 'localtime') AND status != 'cancelled'
      GROUP BY date(created_at)
      ORDER BY date(created_at)
    `).all()
  })

  ipcMain.handle('orders:purge-count', (_event, beforeDate: string) => {
    return (db.prepare(`SELECT COUNT(*) as count FROM orders WHERE date(created_at) < ?`).get(beforeDate) as any)?.count || 0
  })

  ipcMain.handle('orders:purge', (_event, beforeDate: string) => {
    const orderIds = db.prepare(`SELECT id FROM orders WHERE date(created_at) < ?`).all(beforeDate) as any[]
    const ids = orderIds.map((r: any) => r.id)
    if (ids.length === 0) return { deleted: 0 }
    const placeholders = ids.map(() => '?').join(',')
    db.prepare(`DELETE FROM order_items WHERE order_id IN (${placeholders})`).run(...ids)
    const info = db.prepare(`DELETE FROM orders WHERE id IN (${placeholders})`).run(...ids)
    return { deleted: info.changes }
  })
  ipcMain.handle('orders:customer-history', (_event, customerName: string) => {
    const result = db.prepare(`
      SELECT COUNT(*) as visit_count, MAX(created_at) as last_visit
      FROM orders WHERE customer_name = ? AND status != 'cancelled'
    `).get(customerName) as any
    return result
  })

  ipcMain.handle('orders:export-sin', async (_event, filters?: { dateFrom?: string; dateTo?: string }) => {
    let query = `
      SELECT o.*, u.name as employee_name
      FROM orders o
      LEFT JOIN users u ON o.employee_id = u.id
      WHERE o.status != 'cancelled'
    `
    const params: any[] = []
    if (filters?.dateFrom) { query += ' AND o.created_at >= ?'; params.push(filters.dateFrom) }
    if (filters?.dateTo) { query += ' AND o.created_at <= ?'; params.push(filters.dateTo) }
    query += ' ORDER BY o.created_at DESC'
    const orders = db.prepare(query).all(...params) as any[]

    for (const order of orders) {
      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
    }

    const dir = path.join(app.getPath('documents'), 'QuickBite POS')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const zipPath = path.join(dir, `exportacion-sin-${timestamp}.zip`)

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Ventas')
    ws.columns = [
      { header: 'N° Orden', key: 'order_number', width: 16 },
      { header: 'Cliente', key: 'customer_name', width: 24 },
      { header: 'NIT/CI', key: 'customer_nit', width: 16 },
      { header: 'Productos', key: 'products', width: 40 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Descuento', key: 'discount', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Método Pago', key: 'payment_method', width: 14 },
      { header: 'Empleado', key: 'employee_name', width: 20 },
      { header: 'Fecha', key: 'created_at', width: 20 },
    ]
    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true }

    let txtLines: string[] = []

    for (const order of orders) {
      const products = (order.items || []).map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ')
      ws.addRow({
        order_number: order.order_number,
        customer_name: order.customer_name || 'Consumidor Final',
        customer_nit: order.customer_nit || 'CF',
        products,
        subtotal: order.subtotal,
        discount: order.discount || 0,
        total: order.total,
        payment_method: order.payment_method || '',
        employee_name: order.employee_name || '',
        created_at: order.created_at,
      })
      txtLines.push(`${order.customer_nit || 'CF'}|${order.order_number}|${order.total.toFixed(2)}|${order.created_at}`)
    }

    const xlsxPath = path.join(dir, `ventas-${timestamp}.xlsx`)
    await wb.xlsx.writeFile(xlsxPath)

    const txtPath = path.join(dir, `sin-${timestamp}.txt`)
    fs.writeFileSync(txtPath, txtLines.join('\n'), 'utf-8')

    const zip = new AdmZip()
    zip.addLocalFile(xlsxPath)
    zip.addLocalFile(txtPath)
    zip.writeZip(zipPath)

    fs.unlinkSync(xlsxPath)
    fs.unlinkSync(txtPath)

    return { path: zipPath, count: orders.length }
  })

  ipcMain.handle('orders:create-draft', (_event, data: {
    serviceType: string
    tableNumber?: number
    customerName?: string
    employeeId: number
  }) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const orderNumber = generateOrderNumber(db)
    const result = db.prepare(`
      INSERT INTO orders (order_number, customer_name, service_type, table_number, employee_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(orderNumber, data.customerName || 'Mesa ' + (data.tableNumber || ''), data.serviceType, data.tableNumber || null, data.employeeId)
    return { id: result.lastInsertRowid as number, orderNumber }
  })

  ipcMain.handle('orders:add-items', (_event, orderId: number, items: Array<{
    productId: number
    productName: string
    productPrice: number
    categoryName?: string
    quantity: number
    notes?: string
  }>) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const order = db.prepare("SELECT id, status FROM orders WHERE id = ?").get(orderId) as any
    if (!order) throw new Error('Orden no encontrada')
    if (order.status !== 'pending') throw new Error('Solo se pueden agregar items a ordenes abiertas')

    db.transaction(() => {
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal, notes, category_name, item_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
      `)
      const deductStock = db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= 0`)
      for (const item of items) {
        const subtotal = item.productPrice * item.quantity
        insertItem.run(orderId, item.productId, item.productName, item.productPrice, item.quantity, subtotal, item.notes || null, item.categoryName || '')
        deductStock.run(item.quantity, item.productId)
      }
    })()
    return { added: items.length }
  })

  ipcMain.handle('orders:remove-item', (_event, itemId: number) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const item = db.prepare(`
      SELECT oi.id, oi.product_id, oi.quantity, oi.order_id, o.status
      FROM order_items oi JOIN orders o ON oi.order_id = o.id
      WHERE oi.id = ?
    `).get(itemId) as any
    if (!item) throw new Error('Item no encontrado')
    if (item.status !== 'pending') throw new Error('Solo se pueden quitar items de ordenes abiertas')
    db.transaction(() => {
      db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ? AND stock >= 0`).run(item.quantity, item.product_id)
      db.prepare("DELETE FROM order_items WHERE id = ?").run(itemId)
    })()
    return { removed: true }
  })

  ipcMain.handle('orders:open-tables', () => {
    return db.prepare(`
      SELECT o.*, u.name as employee_name,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id AND oi.item_status NOT IN ('cancelado','entregado')) as active_items,
        (SELECT COALESCE(SUM(oi.subtotal), 0) FROM order_items oi WHERE oi.order_id = o.id AND oi.item_status NOT IN ('cancelado')) as current_total
      FROM orders o
      LEFT JOIN users u ON o.employee_id = u.id
      WHERE o.status IN ('pending', 'preparing', 'ready') AND o.service_type = 'mesa'
      ORDER BY o.created_at ASC
    `).all()
  })

  ipcMain.handle('orders:close-table', (_event, id: number, data: {
    paymentMethod: string
    amountPaid?: number
    discount?: number
    customerNIT?: string
  }) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND status = 'pending'").get(id) as any
    if (!order) throw new Error('Orden no encontrada o ya cerrada')

    const items = db.prepare("SELECT subtotal, product_id, quantity, category_name FROM order_items WHERE order_id = ? AND item_status != 'cancelado'").all(id) as any[]
    const subtotal = items.reduce((sum: number, i: any) => sum + i.subtotal, 0)
    let discount = data.discount || 0
    const activeRules = getActiveHappyHourRules(db)
    if (activeRules.length > 0) {
      const prodIds = db.prepare("SELECT id, category_id FROM products WHERE id IN (" + items.map(() => '?').join(',') + ")").all(...items.map((i: any) => i.product_id)) as any[]
      const catMap = new Map(prodIds.map((p: any) => [p.id, p.category_id]))
      const hhDiscount = items.reduce((sum: number, item: any) => {
        const { discount: d } = applyHappyHourToItem(db, item.product_id, catMap.get(item.product_id) || null, item.subtotal / item.quantity, item.quantity)
        return sum + d
      }, 0)
      if (hhDiscount > 0) discount = hhDiscount
    }
    const total = subtotal - discount
    const amountPaid = data.amountPaid || total

    db.transaction(() => {
      db.prepare(`
        UPDATE orders SET status = 'completed', subtotal = ?, discount = ?, total = ?, payment_method = ?, amount_paid = ?, "change" = ?, customer_nit = ?, completed_at = datetime('now','localtime')
        WHERE id = ?
      `).run(subtotal, discount, total, data.paymentMethod, amountPaid, Math.max(0, amountPaid - total), data.customerNIT || null, id)
      db.prepare("UPDATE order_items SET item_status = 'entregado', ready_at = datetime('now','localtime') WHERE order_id = ? AND item_status NOT IN ('cancelado','entregado')").run(id)
    })()
    return { closed: true, total }
  })

  ipcMain.handle('orders:split-bill', (_event, sourceOrderId: number, splits: Array<{
    itemIds: number[]
    customerName?: string
  }>) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const source = db.prepare("SELECT * FROM orders WHERE id = ? AND status = 'pending'").get(sourceOrderId) as any
    if (!source) throw new Error('Orden origen no encontrada o ya cerrada')

    const results: any[] = []
    db.transaction(() => {
      for (const split of splits) {
        if (split.itemIds.length === 0) continue
        const items = db.prepare(`SELECT * FROM order_items WHERE id IN (${split.itemIds.map(() => '?').join(',')}) AND order_id = ?`).all(...split.itemIds, sourceOrderId) as any[]
        if (items.length === 0) continue

        const subtotal = items.reduce((s: number, i: any) => s + i.subtotal, 0)
        const orderNumber = generateOrderNumber(db)
        const result = db.prepare(`
          INSERT INTO orders (order_number, customer_name, service_type, table_number, subtotal, total, employee_id, status, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now','localtime'))
        `).run(orderNumber, split.customerName || source.customer_name, source.service_type, source.table_number, subtotal, subtotal, source.employee_id)
        const newOrderId = result.lastInsertRowid as number

        for (const item of items) {
          db.prepare("UPDATE order_items SET order_id = ?, item_status = 'entregado', ready_at = datetime('now','localtime') WHERE id = ?").run(newOrderId, item.id)
        }
        results.push({ id: newOrderId, orderNumber, total: subtotal })
      }
    })()
    return { splits: results }
  })

  ipcMain.handle('orders:merge-tables', (_event, sourceOrderId: number, targetOrderId: number) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const source = db.prepare("SELECT id, status FROM orders WHERE id = ?").get(sourceOrderId) as any
    const target = db.prepare("SELECT id, status FROM orders WHERE id = ?").get(targetOrderId) as any
    if (!source || !target) throw new Error('Orden no encontrada')
    if (source.status !== 'pending' || target.status !== 'pending') throw new Error('Solo se pueden unir ordenes abiertas')

    db.transaction(() => {
      db.prepare("UPDATE order_items SET order_id = ?, item_status = 'pendiente', started_at = NULL, ready_at = NULL WHERE order_id = ? AND item_status NOT IN ('cancelado','entregado')").run(targetOrderId, sourceOrderId)
      db.prepare("UPDATE orders SET status = 'cancelled', customer_name = customer_name || ' (unida)' WHERE id = ?").run(sourceOrderId)
    })()
    return { merged: true, targetOrderId }
  })

  function generateOrderNumber(db: Database.Database): string {
    const year = new Date().getFullYear()
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE strftime('%Y', created_at) = ?
    `).get(String(year)) as any
    const seq = (result.count + 1).toString().padStart(3, '0')
    return `QB-${year}-${seq}`
  }
}
