import Database from 'better-sqlite3'

export function logAudit(db: Database.Database, data: {
  userId?: number | null
  action: string
  entityType?: string
  entityId?: number | null
  details?: Record<string, any>
}) {
  try {
    db.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      data.userId ?? null,
      data.action,
      data.entityType || null,
      data.entityId ?? null,
      data.details ? JSON.stringify(data.details) : null,
    )
  } catch (err) {
    console.error('[audit] Failed to log:', err)
  }
}

export function registerAuditHandlers(ipcMain: any, db: Database.Database) {
  ipcMain.handle('audit:list', (_event: any, filters?: { action?: string; dateFrom?: string; dateTo?: string; limit?: number }) => {
    let query = 'SELECT al.*, u.name as user_name FROM audit_log al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1'
    const params: any[] = []
    if (filters?.action) { query += ' AND al.action = ?'; params.push(filters.action) }
    if (filters?.dateFrom) { query += ' AND al.created_at >= ?'; params.push(filters.dateFrom) }
    if (filters?.dateTo) { query += ' AND al.created_at <= ?'; params.push(filters.dateTo) }
    query += ' ORDER BY al.created_at DESC'
    if (filters?.limit) { query += ' LIMIT ?'; params.push(filters.limit) }
    return db.prepare(query).all(...params)
  })
}