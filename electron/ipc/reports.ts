import { IpcMain } from 'electron'
import Database from 'better-sqlite3'

export function registerReportHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('orders:daily-sales-30', () => {
    const results = db.prepare(`
      SELECT date(created_at) as date, COALESCE(SUM(total), 0) as total, COUNT(*) as orders
      FROM orders
      WHERE created_at >= date('now', '-30 days') AND status != 'cancelled'
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all() as any[]

    const allDates: any[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const found = results.find((r: any) => r.date === dateStr)
      allDates.push({
        date: dateStr,
        total: found ? found.total : 0,
        orders: found ? found.orders : 0,
      })
    }
    return allDates
  })

  ipcMain.handle('orders:avg-ticket-trend', () => {
    return db.prepare(`
      SELECT date(created_at) as date, ROUND(AVG(total), 2) as avg_ticket
      FROM orders
      WHERE created_at >= date('now', '-30 days') AND status != 'cancelled'
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all()
  })

  ipcMain.handle('orders:peak-hours', () => {
    return db.prepare(`
      SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as count
      FROM orders
      WHERE created_at >= date('now', '-7 days') AND status != 'cancelled'
      GROUP BY strftime('%H', created_at)
      ORDER BY count DESC
      LIMIT 5
    `).all()
  })
}
