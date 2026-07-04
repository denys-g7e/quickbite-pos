import { ipcMain, IpcMainInvokeEvent, safeStorage } from 'electron'
import Database from 'better-sqlite3'
import crypto from 'crypto'
import { sessionStore } from '../session'
import { logAudit } from './audit'

const FALLBACK_KEY = crypto.scryptSync('quickbite-pos-fallback-key-2026', 'salt', 32)

function encryptValue(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(value)
    return 'enc:' + encrypted.toString('base64')
  }
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', FALLBACK_KEY, iv)
  let enc = cipher.update(value, 'utf8', 'hex')
  enc += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  return 'aes:' + iv.toString('hex') + ':' + tag + ':' + enc
}

function decryptValue(value: string): string {
  if (value.startsWith('enc:') && safeStorage.isEncryptionAvailable()) {
    try {
      const buf = Buffer.from(value.slice(4), 'base64')
      return safeStorage.decryptString(buf)
    } catch { return value }
  }
  if (value.startsWith('aes:')) {
    try {
      const parts = value.slice(4).split(':')
      const iv = Buffer.from(parts[0], 'hex')
      const tag = Buffer.from(parts[1], 'hex')
      const enc = parts[2]
      const decipher = crypto.createDecipheriv('aes-256-gcm', FALLBACK_KEY, iv)
      decipher.setAuthTag(tag)
      let dec = decipher.update(enc, 'hex', 'utf8')
      dec += decipher.final('utf8')
      return dec
    } catch {
      console.error('[settings] Fallback decryption failed')
      return value
    }
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
    sessionStore.requireActive(db, 'admin')
    const s = sessionStore.get()
    logAudit(db, { userId: s?.id, action: 'settings_changed', entityType: 'settings', details: { key } })
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
