import { IpcMain } from 'electron'
import Database from 'better-sqlite3'
import { sessionStore } from '../session'
import { logAudit } from './audit'

interface ProductRow {
  id: number
  name: string
  description: string | null
  price: number
  category_id: number | null
  image_path: string | null
  is_active: number
  available_for_delivery: number
  stock: number
  sku: string | null
  created_at: string
}

export function registerProductHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('products:list', (_event, filters?: { categoryId?: number; search?: string; activeOnly?: boolean }) => {
    let query = `
      SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters?.categoryId) {
      query += ' AND p.category_id = ?'
      params.push(filters.categoryId)
    }
    if (filters?.search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)'
      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }
    if (filters?.activeOnly) {
      query += ' AND p.is_active = 1'
    }

    query += ' ORDER BY p.name ASC'
    return db.prepare(query).all(...params)
  })

  ipcMain.handle('products:create', (_event, data: {
    name: string
    description?: string
    price: number
    categoryId?: number
    imagePath?: string
    isActive?: boolean
    availableForDelivery?: boolean
    stock?: number
    sku?: string
  }) => {
    sessionStore.requireActive(db, 'admin')
    console.log('products:create called with data:', JSON.stringify(data))
    try {
      const result = db.prepare(`
        INSERT INTO products (name, description, price, category_id, image_path, is_active, available_for_delivery, stock, sku)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.name,
        data.description || null,
        data.price,
        data.categoryId || null,
        data.imagePath || null,
        data.isActive !== false ? 1 : 0,
        data.availableForDelivery !== false ? 1 : 0,
        data.stock ?? -1,
        data.sku || null
      )
      console.log('products:create success, id:', result.lastInsertRowid)
      return { id: result.lastInsertRowid }
    } catch (err) {
      console.error('products:create ERROR:', err)
      throw err
    }
  })

  ipcMain.handle('products:update', (_event, id: number, data: {
    name?: string
    description?: string
    price?: number
    categoryId?: number
    imagePath?: string
    isActive?: boolean
    availableForDelivery?: boolean
    stock?: number
    sku?: string
  }) => {
    sessionStore.requireActive(db, 'admin')
    const fields: string[] = []
    const params: any[] = []

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name) }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description) }
    if (data.price !== undefined) { fields.push('price = ?'); params.push(data.price) }
    if (data.categoryId !== undefined) { fields.push('category_id = ?'); params.push(data.categoryId) }
    if (data.imagePath !== undefined) { fields.push('image_path = ?'); params.push(data.imagePath) }
    if (data.isActive !== undefined) { fields.push('is_active = ?'); params.push(data.isActive ? 1 : 0) }
    if (data.availableForDelivery !== undefined) { fields.push('available_for_delivery = ?'); params.push(data.availableForDelivery ? 1 : 0) }
    if (data.stock !== undefined) { fields.push('stock = ?'); params.push(data.stock) }
    if (data.sku !== undefined) { fields.push('sku = ?'); params.push(data.sku) }

    if (fields.length === 0) return { updated: false }

    const changed: string[] = []
    if (data.price !== undefined) changed.push('price')
    if (data.stock !== undefined) changed.push('stock')
    if (changed.length > 0) {
      const session = sessionStore.get()
      logAudit(db, { userId: session?.id, action: 'product_updated', entityType: 'product', entityId: id, details: { changedFields: changed, newPrice: data.price, newStock: data.stock } })
    }

    params.push(id)
    db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return { updated: true }
  })

  ipcMain.handle('products:delete', (_event, id: number) => {
    sessionStore.requireActive(db, 'admin')
    db.prepare('DELETE FROM products WHERE id = ?').run(id)
    return { deleted: true }
  })

  ipcMain.handle('products:low-stock', () => {
    return db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock >= 0 AND p.stock <= 5 AND p.is_active = 1
      ORDER BY p.stock ASC
    `).all()
  })
}