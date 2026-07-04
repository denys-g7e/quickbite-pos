import { IpcMain } from 'electron'
import Database from 'better-sqlite3'
import { sessionStore } from '../session'
import { logAudit } from './audit'

export interface HappyHourRule {
  id: number
  name: string
  enabled: number
  days: string
  time_start: string
  time_end: string
  discount_type: 'percentage' | 'fixed' | '2x1'
  discount_value: number
  category_id: number | null
  product_id: number | null
  min_quantity: number
  priority: number
  created_at: string
}

export function getActiveHappyHourRules(db: Database.Database): HappyHourRule[] {
  const now = new Date()
  const currentDow = now.getDay()
  const currentMin = now.getHours() * 60 + now.getMinutes()

  const allRules = db.prepare(
    "SELECT * FROM happy_hour_rules WHERE enabled = 1 ORDER BY priority DESC"
  ).all() as HappyHourRule[]

  return allRules.filter((rule) => {
    let days: number[]
    try { days = JSON.parse(rule.days) } catch { days = [1,2,3,4,5,6,0] }
    if (!days.includes(currentDow)) return false

    const startParts = rule.time_start.split(':').map(Number)
    const endParts = rule.time_end.split(':').map(Number)
    const start = startParts[0] * 60 + (startParts[1] || 0)
    const end = endParts[0] * 60 + (endParts[1] || 0)

    if (start <= end) {
      return currentMin >= start && currentMin < end
    }
    return currentMin >= start || currentMin < end
  })
}

export function getApplicableRules(db: Database.Database, productId: number, categoryId: number | null): HappyHourRule[] {
  const rules = getActiveHappyHourRules(db)
  return rules.filter((rule) => {
    if (rule.product_id !== null && rule.product_id !== productId) return false
    if (rule.product_id === null && rule.category_id !== null && rule.category_id !== categoryId) return false
    return true
  })
}

export function applyHappyHourToItem(
  db: Database.Database,
  productId: number,
  categoryId: number | null,
  price: number,
  quantity: number
): { discount: number; discountLabel: string | null } {
  const rules = getApplicableRules(db, productId, categoryId)
  if (rules.length === 0) return { discount: 0, discountLabel: null }

  const rule = rules[0]

  if (rule.discount_type === '2x1') {
    if (quantity >= rule.min_quantity) {
      const freeItems = Math.floor(quantity / (rule.min_quantity + 1))
      return { discount: freeItems * price, discountLabel: `${rule.min_quantity}x1` }
    }
    return { discount: 0, discountLabel: null }
  }

  if (rule.discount_type === 'percentage') {
    const discount = Math.round(price * quantity * rule.discount_value) / 100
    return { discount, discountLabel: `${rule.discount_value}%` }
  }

  if (rule.discount_type === 'fixed') {
    return { discount: rule.discount_value * quantity, discountLabel: `-Bs${rule.discount_value}` }
  }

  return { discount: 0, discountLabel: null }
}

export function registerHappyHourHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('happy-hour:list-rules', () => {
    return db.prepare("SELECT * FROM happy_hour_rules ORDER BY priority DESC").all()
  })

  ipcMain.handle('happy-hour:create-rule', (_event, data: {
    name: string
    days: number[]
    timeStart: string
    timeEnd: string
    discountType: string
    discountValue: number
    categoryId?: number | null
    productId?: number | null
    minQuantity?: number
    priority?: number
  }) => {
    sessionStore.requireActive(db, 'admin')
    const result = db.prepare(`
      INSERT INTO happy_hour_rules (name, days, time_start, time_end, discount_type, discount_value, category_id, product_id, min_quantity, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name,
      JSON.stringify(data.days),
      data.timeStart,
      data.timeEnd,
      data.discountType,
      data.discountValue,
      data.categoryId || null,
      data.productId || null,
      data.minQuantity || 1,
      data.priority || 0
    )
    logAudit(db, { userId: 0, action: 'happy_hour_rule_created', entityType: 'happy_hour', details: data })
    return { id: result.lastInsertRowid as number }
  })

  ipcMain.handle('happy-hour:update-rule', (_event, id: number, data: Partial<{
    name: string
    enabled: number
    days: number[]
    timeStart: string
    timeEnd: string
    discountType: string
    discountValue: number
    categoryId: number | null
    productId: number | null
    minQuantity: number
    priority: number
  }>) => {
    sessionStore.requireActive(db, 'admin')
    const updates: string[] = []
    const params: any[] = []

    if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name) }
    if (data.enabled !== undefined) { updates.push('enabled = ?'); params.push(data.enabled) }
    if (data.days !== undefined) { updates.push('days = ?'); params.push(JSON.stringify(data.days)) }
    if (data.timeStart !== undefined) { updates.push('time_start = ?'); params.push(data.timeStart) }
    if (data.timeEnd !== undefined) { updates.push('time_end = ?'); params.push(data.timeEnd) }
    if (data.discountType !== undefined) { updates.push('discount_type = ?'); params.push(data.discountType) }
    if (data.discountValue !== undefined) { updates.push('discount_value = ?'); params.push(data.discountValue) }
    if (data.categoryId !== undefined) { updates.push('category_id = ?'); params.push(data.categoryId) }
    if (data.productId !== undefined) { updates.push('product_id = ?'); params.push(data.productId) }
    if (data.minQuantity !== undefined) { updates.push('min_quantity = ?'); params.push(data.minQuantity) }
    if (data.priority !== undefined) { updates.push('priority = ?'); params.push(data.priority) }

    if (updates.length === 0) return { updated: false }
    params.push(id)
    db.prepare(`UPDATE happy_hour_rules SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    logAudit(db, { userId: 0, action: 'happy_hour_rule_updated', entityType: 'happy_hour', entityId: id, details: data })
    return { updated: true }
  })

  ipcMain.handle('happy-hour:delete-rule', (_event, id: number) => {
    sessionStore.requireActive(db, 'admin')
    db.prepare("DELETE FROM happy_hour_rules WHERE id = ?").run(id)
    logAudit(db, { userId: 0, action: 'happy_hour_rule_deleted', entityType: 'happy_hour', entityId: id })
    return { deleted: true }
  })

  ipcMain.handle('happy-hour:active-rules', () => {
    return getActiveHappyHourRules(db)
  })

  ipcMain.handle('happy-hour:product-discount', (_event, productId: number, categoryId: number | null, price: number, quantity: number) => {
    return applyHappyHourToItem(db, productId, categoryId, price, quantity)
  })
}
