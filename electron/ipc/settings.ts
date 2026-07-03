import { ipcMain, IpcMainInvokeEvent, safeStorage } from 'electron'
import Database from 'better-sqlite3'

function encryptValue(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(value)
    return 'enc:' + encrypted.toString('base64')
  }
  return value
}

function decryptValue(value: string): string {
  if (value.startsWith('enc:') && safeStorage.isEncryptionAvailable()) {
    try {
      const buf = Buffer.from(value.slice(4), 'base64')
      return safeStorage.decryptString(buf)
    } catch { return value }
  }
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[settings] safeStorage no disponible — valores sensibles en texto plano')
  }
  return value
}

export function registerSettingsHandlers(ipcMain: Electron.IpcMain, db: Database.Database) {
  ipcMain.handle('settings:get', (_event: IpcMainInvokeEvent, key: string) => {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as any
    const val = row?.value || null
    if (val && (key === 'ai_api_key' || key.endsWith('_secret') || key.endsWith('_key'))) {
      return decryptValue(val)
    }
    return val
  })

  ipcMain.handle('settings:set', (_event: IpcMainInvokeEvent, key: string, value: string) => {
    let stored = value
    if (key === 'ai_api_key' || key.endsWith('_secret') || key.endsWith('_key')) {
      stored = encryptValue(value)
    }
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, stored)
    return true
  })

  ipcMain.handle('settings:get-all', () => {
    const rows = db.prepare("SELECT key, value FROM settings").all() as any[]
    const result: Record<string, string> = {}
    for (const row of rows) {
      let val = row.value
      if (row.key === 'ai_api_key' || row.key.endsWith('_secret') || row.key.endsWith('_key')) {
        val = decryptValue(val)
      }
      result[row.key] = val
    }
    return result
  })
}
