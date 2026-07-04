interface StoredSession {
  id: number
  name: string
  email: string
  role: string
  lastActivity: number
}

class SessionStore {
  private user: StoredSession | null = null

  set(user: { id: number; name: string; email: string; role: string }) {
    this.user = { ...user, lastActivity: Date.now() }
  }

  get(): StoredSession | null {
    return this.user ? { ...this.user } : null
  }

  touch() {
    if (this.user) this.user.lastActivity = Date.now()
  }

  clear() {
    this.user = null
  }

  getLastActivity(): number {
    return this.user?.lastActivity || 0
  }

  requireRole(...roles: string[]): StoredSession {
    if (!this.user) throw new Error('No autenticado')
    if (!roles.includes(this.user.role)) throw new Error('Acceso denegado: rol insuficiente')
    return this.user
  }

  requireActive(db: any, ...roles: string[]): StoredSession {
    const user = this.requireRole(...roles)
    if (!this.checkTimeout(db)) {
      this.clear()
      throw new Error('Sesion expirada por inactividad')
    }
    return user
  }

  checkTimeout(db: any): boolean {
    if (!this.user) return false
    const timeoutMins = parseInt((db.prepare("SELECT value FROM settings WHERE key = 'session_timeout'").get() as any)?.value || '0', 10)
    if (timeoutMins <= 0) return true
    const elapsed = Date.now() - this.user.lastActivity
    if (elapsed > timeoutMins * 60 * 1000) {
      return false
    }
    return true
  }
}

export const sessionStore = new SessionStore()
export type { StoredSession }