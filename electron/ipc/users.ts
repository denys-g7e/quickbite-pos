import { IpcMain } from 'electron'
import Database from 'better-sqlite3'
import bcrypt from 'bcrypt'
import { sessionStore } from '../session'
import { logAudit } from './audit'

const BCRYPT_ROUNDS = 12

function hashPwd(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS)
}

export function registerUserHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('users:list', () => {
    return db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.pin,
             (SELECT COUNT(*) FROM orders o WHERE o.employee_id = u.id AND o.status != 'cancelled') as order_count,
             (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.employee_id = u.id AND o.status != 'cancelled') as total_sales,
             (SELECT MAX(o.created_at) FROM orders o WHERE o.employee_id = u.id) as last_order
      FROM users u
      ORDER BY u.name ASC
    `).all()
  })

  ipcMain.handle('users:create', async (_event, data: {
    name: string
    email: string
    password: string
    role?: string
    pin?: string
    createdBy?: number
  }) => {
    sessionStore.requireActive(db, 'admin')
    const hashedPassword = hashPwd(data.password)
    let hashedPin: string | null = null
    if (data.pin) {
      hashedPin = hashPwd(data.pin)
    }
    const result = db.prepare(
      'INSERT INTO users (name, email, password, role, pin, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(data.name, data.email, hashedPassword, data.role || 'employee', hashedPin, data.createdBy || null)
    const session = sessionStore.get()
    logAudit(db, { userId: session?.id, action: 'user_created', entityType: 'user', entityId: result.lastInsertRowid as number, details: { email: data.email, role: data.role || 'employee' } })
    return { id: result.lastInsertRowid }
  })

  ipcMain.handle('users:update', async (_event, id: number, data: {
    name?: string
    email?: string
    role?: string
    isActive?: boolean
}) => {
    sessionStore.requireActive(db, 'admin')
    const fields: string[] = []
    const params: any[] = []

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name) }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email) }
    if (data.role !== undefined) { fields.push('role = ?'); params.push(data.role) }
    if (data.isActive !== undefined) { fields.push('is_active = ?'); params.push(data.isActive ? 1 : 0) }

    if (fields.length === 0) return { updated: false }
    if (data.role !== undefined) {
      const s = sessionStore.get()
      logAudit(db, { userId: s?.id, action: 'role_changed', entityType: 'user', entityId: id, details: { newRole: data.role } })
    }
    params.push(id)
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return { updated: true }
  })

ipcMain.handle('users:toggle-active', (_event, id: number) => {
    sessionStore.requireActive(db, 'admin')
    const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(id) as any
    if (!user) throw new Error('Usuario no encontrado')
    const newState = user.is_active ? 0 : 1
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newState, id)
    return { isActive: !!newState }
  })

  ipcMain.handle('users:reset-password', (_event, id: number, password: string) => {
    sessionStore.requireActive(db, 'admin')
    const hashed = hashPwd(password)
    db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?').run(hashed, id)
    return { updated: true }
  })

  ipcMain.handle('users:delete', (_event, id: number) => {
    sessionStore.requireActive(db, 'admin')
    db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(id, 'employee')
    return { deleted: true }
  })

  ipcMain.handle('users:update-admin', (_event, id: number, data: { name?: string; email?: string; password?: string }) => {
    const fields: string[] = []
    const params: any[] = []
    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name) }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email) }
    if (data.password !== undefined) {
      const hashed = hashPwd(data.password)
      fields.push('password = ?')
      params.push(hashed)
      fields.push('must_change_password = 0')
    }
    if (fields.length === 0) return { updated: false }
    params.push(id)
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return { updated: true }
  })
}
