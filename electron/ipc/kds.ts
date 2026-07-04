import { IpcMain } from 'electron'
import Database from 'better-sqlite3'
import { sessionStore } from '../session'
import { logAudit } from './audit'

const COCINA_CATEGORIES = ['Hamburguesas', 'Pizzas', 'Postres', 'Ensaladas', 'Papas y Acompañantes']
const BARRA_CATEGORIES = ['Bebidas']

function getStation(categoryName: string): string {
  if (COCINA_CATEGORIES.includes(categoryName)) return 'cocina'
  if (BARRA_CATEGORIES.includes(categoryName)) return 'barra'
  return 'cocina'
}

export function registerKdsHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('kds:get-active-orders', () => {
    const orders = db.prepare(`
      SELECT o.id, o.order_number, o.customer_name, o.service_type, o.table_number, o.status, o.created_at,
             u.name as employee_name
      FROM orders o
      LEFT JOIN users u ON o.employee_id = u.id
      WHERE o.status IN ('pending', 'preparing', 'ready') AND o.status != 'cancelled'
      ORDER BY o.created_at ASC
    `).all() as any[]

    for (const order of orders) {
      order.items = db.prepare(`
        SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC
      `).all(order.id)
    }

    return orders
  })

  ipcMain.handle('kds:set-item-status', (_event, itemId: number, status: string) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const VALID = ['pendiente', 'en_cocina', 'en_barra', 'listo', 'entregado', 'cancelado']
    if (!VALID.includes(status)) throw new Error('Estado invalido')

    const item = db.prepare("SELECT id, order_id, item_status FROM order_items WHERE id = ?").get(itemId) as any
    if (!item) throw new Error('Item no encontrado')

    if (item.item_status === 'cancelado' || item.item_status === 'entregado') {
      throw new Error(`Item ya esta ${item.item_status}`)
    }

    const now = new Date().toISOString()
    const updates: string[] = ["item_status = ?"]
    const params: any[] = [status]

    if (status === 'en_cocina' || status === 'en_barra') {
      updates.push("started_at = COALESCE(started_at, ?)")
      params.push(now)
    }
    if (status === 'listo') {
      updates.push("ready_at = COALESCE(ready_at, ?)")
      params.push(now)
    }

    params.push(itemId)
    db.prepare(`UPDATE order_items SET ${updates.join(', ')} WHERE id = ?`).run(...params)

    const allItems = db.prepare("SELECT item_status FROM order_items WHERE order_id = ?").all(item.order_id) as any[]
    const allDone = allItems.every((i: any) => i.item_status === 'listo' || i.item_status === 'entregado')
    if (allDone && status === 'listo') {
      db.prepare("UPDATE orders SET status = 'ready', completed_at = ? WHERE id = ? AND status != 'completed'").run(now, item.order_id)
    }

    const session = sessionStore.get()
    logAudit(db, { userId: session?.id, action: 'item_status_changed', entityType: 'order_item', entityId: itemId, details: { orderId: item.order_id, fromStatus: item.item_status, toStatus: status } })
    return { updated: true }
  })

  ipcMain.handle('kds:get-by-order', (_event, orderId: number) => {
    const order = db.prepare(`
      SELECT o.*, u.name as employee_name
      FROM orders o LEFT JOIN users u ON o.employee_id = u.id WHERE o.id = ?
    `).get(orderId) as any
    if (!order) throw new Error('Orden no encontrada')
    order.items = db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC").all(orderId)
    return order
  })

  ipcMain.handle('kds:cancel-item', (_event, itemId: number, reason: string) => {
    sessionStore.requireActive(db, 'admin', 'employee')
    const item = db.prepare("SELECT id, order_id, item_status, product_name FROM order_items WHERE id = ?").get(itemId) as any
    if (!item) throw new Error('Item no encontrado')
    if (item.item_status === 'entregado' || item.item_status === 'cancelado') {
      throw new Error('Item ya no puede cancelarse')
    }

    db.prepare("UPDATE order_items SET item_status = 'cancelado', cancel_reason = ? WHERE id = ?").run(reason, itemId)

    const session = sessionStore.get()
    logAudit(db, { userId: session?.id, action: 'item_cancelled', entityType: 'order_item', entityId: itemId, details: { orderId: item.order_id, productName: item.product_name, reason } })
    return { cancelled: true }
  })
}