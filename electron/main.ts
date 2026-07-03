import { app, BrowserWindow, ipcMain, Menu, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import Database from 'better-sqlite3'
import { registerAuthHandlers } from './ipc/auth'
import { registerProductHandlers } from './ipc/products'
import { registerCategoryHandlers } from './ipc/categories'
import { registerOrderHandlers } from './ipc/orders'
import { registerUserHandlers } from './ipc/users'
import { registerReportHandlers } from './ipc/reports'
import { registerAIHandlers } from './ipc/ai'
import { registerPrinterHandlers } from './ipc/printer'
import { registerSettingsHandlers } from './ipc/settings'
import { registerShiftHandlers } from './ipc/shifts'
import { seedDatabase } from './db/seed'
import { initializeDatabase } from './db/schema'

let mainWindow: BrowserWindow | null = null
let db: Database.Database | null = null

function getDbPath(): string {
  return path.join(app.getPath('userData'), 'quickbite.db')
}

function createWindow() {
  const iconPath = path.join(__dirname, '../../resources/icon.ico')
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    backgroundColor: '#0F1117',
  })

  Menu.setApplicationMenu(null)

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
}

function registerAppHandlers() {
  ipcMain.handle('app:minimize', () => mainWindow?.minimize())
  ipcMain.handle('app:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('app:close', () => mainWindow?.close())
}

function registerDbHandlers() {
  if (!db) return

  registerAuthHandlers(ipcMain, db)
  registerProductHandlers(ipcMain, db)
  registerCategoryHandlers(ipcMain, db)
  registerOrderHandlers(ipcMain, db)
  registerUserHandlers(ipcMain, db)
  registerReportHandlers(ipcMain, db)
  registerAIHandlers(ipcMain, db)
  registerPrinterHandlers(ipcMain, db, mainWindow)
  registerSettingsHandlers(ipcMain, db)
  registerShiftHandlers(ipcMain, db)

  ipcMain.handle('app:export-db', async () => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: `quickbite-backup-${Date.now()}.db`,
      filters: [{ name: 'Database', extensions: ['db'] }],
    })
    if (!result.canceled && result.filePath) {
      fs.copyFileSync(getDbPath(), result.filePath)
      return true
    }
    return false
  })
  ipcMain.handle('app:read-file-base64', async (_event, filePath: string) => {
    try {
      const data = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase().replace('.', '')
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
      return `data:${mime};base64,${data.toString('base64')}`
    } catch { return null }
  })
  ipcMain.handle('app:notify-no-shift', async () => {
    if (!db) return false
    const email = db.prepare("SELECT value FROM settings WHERE key = 'notification_email'").get() as any
    const to = email?.value || 'admin@quickbite.com'
    const subject = encodeURIComponent('QuickBite POS - Venta sin turno abierto')
    const body = encodeURIComponent(`Se realizó una venta sin tener un turno de caja abierto.\n\nFecha: ${new Date().toLocaleString('es-BO')}\n\nPor favor, abre un turno de caja desde el panel de administración.`)
    const mailto = `mailto:${to}?subject=${subject}&body=${body}`
    shell.openExternal(mailto).catch(() => {})
    return true
  })

  ipcMain.handle('app:delete-all-data', async (_event, options?: { orders?: boolean; products?: boolean; categories?: boolean }) => {
    if (!db) return false
    if (!options || options.orders) {
      db.prepare('DELETE FROM order_items').run()
      db.prepare('DELETE FROM orders').run()
    }
    if (!options || options.products) {
      db.prepare('DELETE FROM products').run()
    }
    if (!options || options.categories) {
      db.prepare('DELETE FROM products').run()
      db.prepare('DELETE FROM categories').run()
    }
    if (!options) {
      seedDatabase(db)
    }
    return true
  })
  ipcMain.handle('app:select-logo', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile'],
    })
    if (!result.canceled && result.filePaths[0]) {
      const ext = path.extname(result.filePaths[0])
      const dest = path.join(app.getPath('userData'), `logo${ext}`)
      fs.copyFileSync(result.filePaths[0], dest)
      return dest
    }
    return null
  })
  ipcMain.handle('app:import-db', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      filters: [{ name: 'Database', extensions: ['db'] }],
      properties: ['openFile'],
    })
    if (!result.canceled && result.filePaths[0]) {
      fs.copyFileSync(result.filePaths[0], getDbPath())
      return true
    }
    return false
  })
  ipcMain.handle('app:check-activation', () => {
    if (!db) return false
    const row = db.prepare("SELECT value FROM settings WHERE key = 'app_activation'").get() as any
    return row?.value === 'activated'
  })
  const ACTIVATION_HASH = '895470d0d142c8c98c48e112cbc7bf9dc1d99df1b82915787cc57d7edb2cac8c'

  ipcMain.handle('app:activate', (_event, key: string) => {
    if (!db) return false
    const hash = require('crypto').createHash('sha256').update(key).digest('hex')
    if (hash === ACTIVATION_HASH) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('app_activation', 'activated')").run()
      return true
    }
    return false
  })
  ipcMain.handle('products:upload-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile'],
    })
    if (!result.canceled && result.filePaths[0]) {
      const imgDir = path.join(app.getPath('userData'), 'product-images')
      if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true })
      const ext = path.extname(result.filePaths[0])
      const filename = `prod-${Date.now()}${ext}`
      const dest = path.join(imgDir, filename)
      fs.copyFileSync(result.filePaths[0], dest)
      return dest
    }
    return null
  })
}

function runMigrations() {
  if (!db) return
  const cols = db.prepare("PRAGMA table_info(order_items)").all() as any[]
  const hasCategoryName = cols.some((c: any) => c.name === 'category_name')
  if (!hasCategoryName) {
    db.exec("ALTER TABLE order_items ADD COLUMN category_name TEXT DEFAULT ''")
  }

  const userCols = db.prepare("PRAGMA table_info(users)").all() as any[]
  if (!userCols.some((c: any) => c.name === 'pin_attempts')) {
    db.exec("ALTER TABLE users ADD COLUMN pin_attempts INTEGER DEFAULT 0")
    db.exec("ALTER TABLE users ADD COLUMN pin_blocked_until TEXT")
    db.exec("ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0")
  }
}

function initDatabase() {
  const dbPath = getDbPath()
  const isFirstRun = !fs.existsSync(dbPath)

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initializeDatabase(db)

  if (isFirstRun) {
    seedDatabase(db)
  }

  runMigrations()
  registerDbHandlers()
}

function ensureDesktopShortcut() {
  try {
    const shortcutCreated = db?.prepare("SELECT value FROM settings WHERE key = 'shortcut_created'").get() as any
    if (shortcutCreated?.value === '1') return

    const desktopPath = path.join(app.getPath('desktop'), 'QuickBite POS.lnk')
    const ps = `
      $ws = New-Object -ComObject WScript.Shell
      $s = $ws.CreateShortcut('${desktopPath.replace(/'/g, "''")}')
      $s.TargetPath = '${process.execPath.replace(/'/g, "''")}'
      $s.WorkingDirectory = '${process.cwd().replace(/'/g, "''")}'
      $s.Description = 'QuickBite POS - Sistema de Punto de Venta'
      $s.IconLocation = '${process.execPath.replace(/'/g, "''")}, 0'
      $s.Save()
    `
    execSync(`powershell -Command "${ps.replace(/"/g, '\\"')}"`, { timeout: 10000 })
    db?.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('shortcut_created', '1')").run()
  } catch {}
}

app.whenReady().then(() => {
  registerAppHandlers()
  createWindow()
  initDatabase()
  ensureDesktopShortcut()
})

app.on('window-all-closed', () => {
  if (db) db.close()
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
