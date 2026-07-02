import { IpcMain } from 'electron'
import Database from 'better-sqlite3'

export function registerShiftHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('shifts:open', (_event, data: { employeeId: number; openingAmount: number; notes?: string }) => {
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(data.employeeId) as any
    if (!user || user.role !== 'admin') throw new Error('Solo el administrador puede abrir turno')
    const existing = db.prepare("SELECT id FROM cash_shifts WHERE status = 'open'").get() as any
    if (existing) throw new Error('Ya hay un turno abierto')
    const result = db.prepare(
      "INSERT INTO cash_shifts (employee_id, opening_amount, notes) VALUES (?, ?, ?)"
    ).run(data.employeeId, data.openingAmount, data.notes || null)
    return db.prepare("SELECT * FROM cash_shifts WHERE id = ?").get(result.lastInsertRowid)
  })

  ipcMain.handle('shifts:check', () => {
    const shift = db.prepare("SELECT id FROM cash_shifts WHERE status = 'open'").get()
    return !!shift
  })

  ipcMain.handle('shifts:close', (_event, data: { id: number; closingAmount: number; notes?: string }) => {
    const shift = db.prepare("SELECT * FROM cash_shifts WHERE id = ? AND status = 'open'").get(data.id) as any
    if (!shift) throw new Error('Turno no encontrado o ya cerrado')
    db.prepare(
      "UPDATE cash_shifts SET closing_amount = ?, closed_at = datetime('now', 'localtime'), status = 'closed', notes = COALESCE(?, notes) WHERE id = ?"
    ).run(data.closingAmount, data.notes || null, data.id)
    return db.prepare("SELECT * FROM cash_shifts WHERE id = ?").get(data.id)
  })

  ipcMain.handle('shifts:current', () => {
    return db.prepare(`
      SELECT cs.*, u.name as employee_name
      FROM cash_shifts cs
      LEFT JOIN users u ON cs.employee_id = u.id
      WHERE cs.status = 'open'
      ORDER BY cs.opened_at DESC LIMIT 1
    `).get() || null
  })

  ipcMain.handle('shifts:list', (_event, dateFilter?: string) => {
    let query = `
      SELECT cs.*, u.name as employee_name
      FROM cash_shifts cs
      LEFT JOIN users u ON cs.employee_id = u.id
    `
    const params: any[] = []
    if (dateFilter) {
      query += " WHERE date(cs.opened_at) = ?"
      params.push(dateFilter)
    }
    query += ' ORDER BY cs.opened_at DESC'
    return db.prepare(query).all(...params)
  })
}
