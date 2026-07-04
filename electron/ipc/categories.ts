import { IpcMain } from 'electron'
import Database from 'better-sqlite3'
import { sessionStore } from '../session'

export function registerCategoryHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('categories:list', () => {
    return db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) as product_count
      FROM categories c
      WHERE c.is_active = 1
      ORDER BY c."order" ASC, c.name ASC
    `).all()
  })

  ipcMain.handle('categories:create', (_event, data: {
    name: string
    icon: string
    color?: string
    order?: number
  }) => {
    sessionStore.requireActive(db, 'admin')
    console.log('categories:create called with data:', JSON.stringify(data))
    try {
      const result = db.prepare(
        'INSERT INTO categories (name, icon, color, "order") VALUES (?, ?, ?, ?)'
      ).run(data.name, data.icon, data.color || '#FF6B35', data.order || 0)
      console.log('categories:create success, id:', result.lastInsertRowid)
      return { id: result.lastInsertRowid }
    } catch (err) {
      console.error('categories:create ERROR:', err)
      throw err
    }
  })

  ipcMain.handle('categories:update', (_event, id: number, data: {
    name?: string
    icon?: string
    color?: string
    order?: number
    isActive?: boolean
  }) => {
    sessionStore.requireActive(db, 'admin')
    const fields: string[] = []
    const params: any[] = []

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name) }
    if (data.icon !== undefined) { fields.push('icon = ?'); params.push(data.icon) }
    if (data.color !== undefined) { fields.push('color = ?'); params.push(data.color) }
    if (data.order !== undefined) { fields.push('"order" = ?'); params.push(data.order) }
    if (data.isActive !== undefined) { fields.push('is_active = ?'); params.push(data.isActive ? 1 : 0) }

    if (fields.length === 0) return { updated: false }
    params.push(id)
    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return { updated: true }
  })

  ipcMain.handle('categories:delete', (_event, id: number) => {
    sessionStore.requireActive(db, 'admin')
    const productCount = (db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id) as any).count
    if (productCount > 0) {
      db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(id)
      return { deactivated: true, message: 'Categoría desactivada porque tiene productos asociados' }
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    return { deleted: true }
  })
}