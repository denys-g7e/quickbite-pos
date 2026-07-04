import { IpcMain } from 'electron'
import Database from 'better-sqlite3'
import bcrypt from 'bcrypt'
import { sessionStore } from '../session'
import { logAudit } from './audit'

const crypto = require('crypto')
const BCRYPT_ROUNDS = 12

function detectPwd(password: string, stored: string): boolean {
  if (stored.includes(':')) {
    const [salt, hash] = stored.split(':')
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return hash === computed
  }
  try {
    return bcrypt.compareSync(password, stored)
  } catch {
    return false
  }
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
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(creds.email) as any
    if (!user) throw new Error('Credenciales inválidas')

    const valid = detectPwd(creds.password, user.password)
    if (!valid) throw new Error('Credenciales inválidas')

    if (user.password.includes(':')) {
      const newHash = bcrypt.hashSync(creds.password, BCRYPT_ROUNDS)
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newHash, user.id)
    }

    sessionStore.set({ id: user.id, name: user.name, email: user.email, role: user.role })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.must_change_password === 1,
    }
  })

  ipcMain.handle('auth:verify-pin', (_event, pin: string, userId?: number) => {
    const MAX_ATTEMPTS = 3
    const BLOCK_MINUTES = 30

    if (userId) {
      const user = db.prepare('SELECT pin, is_active FROM users WHERE id = ?').get(userId) as any
      if (!user || !user.pin) throw new Error('PIN inválido')
      if (user.pin_attempts >= MAX_ATTEMPTS && user.pin_blocked_until) {
        const blocked = new Date(user.pin_blocked_until)
        if (new Date() < blocked) {
          const remain = Math.ceil((blocked.getTime() - Date.now()) / 60000)
          throw new Error(`PIN bloqueado. Intenta de nuevo en ${remain} minuto(s)`)
        }
        db.prepare('UPDATE users SET pin_attempts = 0, pin_blocked_until = NULL WHERE id = ?').run(userId)
      }
      const valid = detectPwd(pin, user.pin)
      if (!valid) {
        const attempts = (user.pin_attempts || 0) + 1
        logAudit(db, { userId, action: 'pin_failed', entityType: 'user', entityId: userId, details: { attempt: attempts, maxAttempts: MAX_ATTEMPTS } })
        if (attempts >= MAX_ATTEMPTS) {
          const blockedUntil = new Date(Date.now() + BLOCK_MINUTES * 60000).toISOString()
          db.prepare('UPDATE users SET pin_attempts = ?, pin_blocked_until = ? WHERE id = ?').run(attempts, blockedUntil, userId)
          throw new Error(`PIN bloqueado por ${BLOCK_MINUTES} minutos`)
        }
        db.prepare('UPDATE users SET pin_attempts = ? WHERE id = ?').run(attempts, userId)
        throw new Error(`PIN inválido (intento ${attempts}/${MAX_ATTEMPTS})`)
      }
      db.prepare('UPDATE users SET pin_attempts = 0, pin_blocked_until = NULL WHERE id = ?').run(userId)
      sessionStore.set({ id: user.id, name: user.name, email: user.email, role: user.role })
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }

    const users = db.prepare('SELECT * FROM users WHERE pin IS NOT NULL AND is_active = 1').all() as UserRow[]
    const match = users.find((u) => u.pin && detectPwd(pin, u.pin))
    if (!match) throw new Error('PIN inválido')
    sessionStore.set({ id: match.id, name: match.name, email: match.email, role: match.role as string })
    return {
      id: match.id,
      name: match.name,
      email: match.email,
      role: match.role,
    }
  })

  ipcMain.handle('auth:logout', () => {
    sessionStore.clear()
    return true
  })

  ipcMain.handle('auth:is-logged-in', () => {
    return false
  })
}
