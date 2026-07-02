import { IpcMain } from 'electron'
import Database from 'better-sqlite3'
import crypto from 'crypto'

function detectPwd(password: string, stored: string): boolean {
  if (stored.includes(':')) {
    const [salt, hash] = stored.split(':')
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return hash === computed
  }
  const [salt, hash] = stored.split(':')
  const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return hash === computed
}

interface UserRow {
  id: number
  name: string
  email: string
  password: string
  role: string
  pin: string | null
  is_active: number
}

export function registerAuthHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle('auth:login', (_event, creds: { email: string; password: string }) => {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(creds.email) as UserRow | undefined
    if (!user) throw new Error('Credenciales inválidas')

    const valid = detectPwd(creds.password, user.password)
    if (!valid) throw new Error('Credenciales inválidas')

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  })

  ipcMain.handle('auth:verify-pin', (_event, pin: string) => {
    const users = db.prepare('SELECT * FROM users WHERE pin IS NOT NULL AND is_active = 1').all() as UserRow[]
    const match = users.find((u) => u.pin && detectPwd(pin, u.pin))
    if (!match) throw new Error('PIN inválido')
    return {
      id: match.id,
      name: match.name,
      email: match.email,
      role: match.role,
    }
  })

  ipcMain.handle('auth:logout', () => {
    return true
  })

  ipcMain.handle('auth:is-logged-in', () => {
    return false
  })
}
