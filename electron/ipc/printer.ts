import { IpcMain, app, BrowserWindow } from 'electron'
import Database from 'better-sqlite3'
import * as path from 'path'
import * as fs from 'fs'

export function registerPrinterHandlers(ipcMain: IpcMain, db: Database.Database, mainWindow?: BrowserWindow | null) {
  ipcMain.handle('printer:list', async () => {
    try {
      const { getPrinters } = require('electron-pos-printer')
      const printers = await getPrinters()
      return printers.map((p: any) => ({
        name: p.name,
        isDefault: p.isDefault,
      }))
    } catch {
      return [{ name: 'PDF (guardar como archivo)', isDefault: true }]
    }
  })

  ipcMain.handle('printer:ticket', async (_event, orderData: any) => {
    const businessName = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || 'QuickBite POS'
    const address = (db.prepare("SELECT value FROM settings WHERE key = 'address'").get() as any)?.value || ''
    const phone = (db.prepare("SELECT value FROM settings WHERE key = 'phone'").get() as any)?.value || ''
    const thankYou = (db.prepare("SELECT value FROM settings WHERE key = 'thank_you_message'").get() as any)?.value || 'Gracias por su visita!'

    const ticketLines = [
      '='.repeat(32),
      businessName.toUpperCase().padStart((32 + businessName.length) / 2),
      address,
      `Tel: ${phone}`,
      '='.repeat(32),
      `Orden: ${orderData.orderNumber}${orderData.tableNumber ? `    Mesa: ${orderData.tableNumber}` : ''}`,
      `Cliente: ${orderData.customerName || 'Consumidor Final'}`,
      new Date().toLocaleString('es-BO'),
      '-'.repeat(32),
      'ITEM               CANT    PRECIO',
      '-'.repeat(32),
      ...orderData.items.map((item: any) =>
        `${item.productName.padEnd(18)} x${item.quantity}   Bs. ${item.subtotal.toFixed(2)}`
      ),
      '-'.repeat(32),
      `SUBTOTAL${' '.repeat(18)} Bs. ${orderData.subtotal.toFixed(2)}`,
      `DESCUENTO${' '.repeat(17)} Bs. ${(orderData.discount || 0).toFixed(2)}`,
      '-'.repeat(32),
      `TOTAL${' '.repeat(21)} Bs. ${orderData.total.toFixed(2)}`,
      '='.repeat(32),
      `PAGO: ${orderData.paymentMethod?.toUpperCase() || 'EFECTIVO'}`,
      `RECIBIDO:${' '.repeat(17)} Bs. ${(orderData.amountPaid || orderData.total).toFixed(2)}`,
      `CAMBIO:${' '.repeat(19)} Bs. ${(orderData.change || 0).toFixed(2)}`,
      '='.repeat(32),
      `    ${thankYou}`.padStart(26),
      '='.repeat(32),
    ]

    const ticketText = ticketLines.join('\n')

    const ticketHtml = `<pre style="font-family: monospace; font-size: 12px; text-align: center;">${ticketText}</pre>`

    try {
      const printerName = await getTargetPrinter(db)
      if (printerName) {
        const { print } = require('electron-pos-printer')
        await print({ printerName, html: ticketHtml, options: { copies: 1 } })
        return { printed: true, method: 'thermal' }
      }
    } catch {}

    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const printWin = new BrowserWindow({ show: false, webPreferences: { contextIsolation: false, nodeIntegration: false } })
        await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html><html><body style="margin:0;padding:16px;font-family:monospace;font-size:12px">${ticketHtml}</body></html>`)}`)
        printWithTimeout(printWin, 10000, () => saveAsPdf(orderData, ticketText, 'ticket'))
        return { printed: true, method: 'native' }
      }
    } catch {}

    saveAsPdf(orderData, ticketText, 'ticket')
    return { printed: true, method: 'pdf' }
  })

  ipcMain.handle('printer:combined', async (_event, orderData: any) => {
    const businessName = (db.prepare("SELECT value FROM settings WHERE key = 'business_name'").get() as any)?.value || 'QuickBite POS'
    const address = (db.prepare("SELECT value FROM settings WHERE key = 'address'").get() as any)?.value || ''
    const phone = (db.prepare("SELECT value FROM settings WHERE key = 'phone'").get() as any)?.value || ''
    const currencySymbol = (db.prepare("SELECT value FROM settings WHERE key = 'currency_symbol'").get() as any)?.value || 'Bs.'
    const printMode = (db.prepare("SELECT value FROM settings WHERE key = 'print_mode'").get() as any)?.value || 'both'
    const appName = (db.prepare("SELECT value FROM settings WHERE key = 'app_name'").get() as any)?.value || 'QuickBite POS'
    const thankYou = (db.prepare("SELECT value FROM settings WHERE key = 'thank_you_message'").get() as any)?.value || 'Gracias por su visita!'

    let html = '<div style="font-family: monospace; font-size: 12px; width: 80mm; padding: 8px;">'

    const showCustomerTicket = (printMode === 'both' || printMode === 'customer_only')
    const showKitchenTicket = (printMode === 'both' || printMode === 'kitchen_only')

    if (showCustomerTicket) {
      html += `
        <div style="text-align:center;">
          <div style="font-weight:bold; font-size:14px; margin-bottom:4px;">${businessName}</div>
          <div style="font-size:10px;">${address}</div>
          <div style="font-size:10px; margin-bottom:8px;">Tel: ${phone}</div>
        </div>
        <div style="text-align:center; border-top:1px solid #000; border-bottom:1px solid #000; padding:4px 0; margin-bottom:8px;">
          <div style="font-size:11px;">Orden: ${orderData.orderNumber}${orderData.tableNumber ? ` | Mesa: ${orderData.tableNumber}` : ''}</div>
          <div style="font-size:10px;">Cliente: ${orderData.customerName || 'Consumidor Final'}</div>
          <div style="font-size:10px;">${new Date().toLocaleString('es-BO')}</div>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:11px;">
          <tr style="border-bottom:1px solid #000;"><th style="text-align:left;">Item</th><th style="text-align:center;">Cant</th><th style="text-align:right;">Precio</th></tr>
          ${orderData.items.map((item: any) => `
            <tr><td>${item.productName}</td><td style="text-align:center;">${item.quantity}</td><td style="text-align:right;">${currencySymbol} ${item.subtotal.toFixed(2)}</td></tr>
          `).join('')}
        </table>
        <div style="border-top:1px solid #000; margin-top:4px; padding-top:4px; font-size:11px;">
          <div style="display:flex; justify-content:space-between;"><span>SUBTOTAL</span><span>${currencySymbol} ${orderData.subtotal.toFixed(2)}</span></div>
          ${orderData.discount > 0 ? `<div style="display:flex; justify-content:space-between;"><span>DESCUENTO</span><span>-${currencySymbol} ${orderData.discount.toFixed(2)}</span></div>` : ''}
          <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:13px;"><span>TOTAL</span><span>${currencySymbol} ${orderData.total.toFixed(2)}</span></div>
        </div>
        <div style="border-top:1px solid #000; margin-top:4px; padding-top:4px; font-size:10px;">
          <div>PAGO: ${orderData.paymentMethod?.toUpperCase() || 'EFECTIVO'}</div>
          <div>RECIBIDO: ${currencySymbol} ${(orderData.amountPaid || orderData.total).toFixed(2)}</div>
          <div>CAMBIO: ${currencySymbol} ${(orderData.change || 0).toFixed(2)}</div>
        </div>
        <div style="text-align:center; margin-top:8px; font-size:10px;">${thankYou}</div>`

      if (showKitchenTicket) {
        html += `<div style="text-align:center; margin: 16px 0; font-size: 11px; letter-spacing: 2px;">
          - - - - - - - - - - CORTE AQUI - - - - - - - - - -
        </div>`
      }
    }

    if (showKitchenTicket) {
      const cocinaCategories = ['Hamburguesas', 'Pizzas', 'Postres', 'Ensaladas', 'Papas y Acompañantes']
      const barraCategories = ['Bebidas']

      const cocinaItems = orderData.items.filter((i: any) => cocinaCategories.includes(i.categoryName))
      const barraItems = orderData.items.filter((i: any) => barraCategories.includes(i.categoryName))

      const renderStationSection = (stationName: string, stationColor: string, items: any[]) => {
        if (items.length === 0) return ''
        return `
          <div style="margin-bottom: 8px;">
            <div style="background: ${stationColor}; color: white; padding: 4px 8px; font-weight: bold; font-size: 14px; text-align: center;">
              ${stationName}
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              ${items.map((item: any) => `
                <tr><td style="text-align:left; padding: 2px 4px;">${item.quantity}x ${item.productName}</td></tr>
              `).join('')}
            </table>
          </div>`
      }

      html += `
        <div style="text-align:center; border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px;">
          <div style="border: 2px solid black; padding: 8px; margin-bottom: 8px;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">
              ${orderData.tableNumber ? `MESA ${orderData.tableNumber}` : 'PARA LLEVAR'}
            </div>
            <div style="font-size: 14px; margin-bottom: 4px;">
              ORDEN: ${orderData.orderNumber}
            </div>
            <div style="font-size: 12px;">
              ${orderData.customerName || 'Consumidor Final'}
            </div>
          </div>
          ${renderStationSection('COCINA', '#E65100', cocinaItems)}
          ${renderStationSection('BARRA', '#1565C0', barraItems)}
          <div style="font-size: 10px; color: #666; margin-top: 4px;">
            ${appName} - ${new Date().toLocaleString('es-BO')}
          </div>
        </div>`
    }

    html += '</div>'

    try {
      const printerName = await getTargetPrinter(db)
      if (printerName) {
        const { print } = require('electron-pos-printer')
        await print({ printerName, html, options: { copies: 1 } })
        return { printed: true, method: 'thermal' }
      }
    } catch {}

    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const printWin = new BrowserWindow({ show: false, webPreferences: { contextIsolation: false, nodeIntegration: false } })
        await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html><html><body style="margin:0;padding:0">${html}</body></html>`)}`)
        printWithTimeout(printWin, 10000, () => {
          const text = html.replace(/<[^>]*>/g, '').split('\n').filter(l => l.trim()).join('\n')
          saveAsPdf(orderData, text, 'comprobante')
        })
        return { printed: true, method: 'native' }
      }
    } catch {}

    const text = html.replace(/<[^>]*>/g, '').split('\n').filter(l => l.trim()).join('\n')
    saveAsPdf(orderData, text, 'comprobante')
    return { printed: true, method: 'pdf' }
  })

  ipcMain.handle('printer:test', async () => {
    try {
      const { getPrinters, print } = require('electron-pos-printer')
      const printers = await getPrinters()
      if (printers.length === 0) throw new Error('No printers found')
      const printer = printers[0]
      await print({
        printerName: printer.name,
        html: '<pre style="font-family: monospace; font-size: 14px; text-align: center;">\n\nQuickBite POS\nPrueba de impresin\n\nSi ves esto, la impresora funciona!\n\n</pre>',
        options: { copies: 1 },
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}

function saveAsPdf(orderData: any, text: string, prefix: string) {
  const dir = path.join(app.getPath('documents'), 'QuickBite POS')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const filename = `${prefix}-${orderData.orderNumber || Date.now()}.txt`
  fs.writeFileSync(path.join(dir, filename), text, 'utf-8')
}

function printWithTimeout(printWin: BrowserWindow, timeoutMs: number, onFail: () => void) {
  const timer = setTimeout(() => {
    if (!printWin.isDestroyed()) {
      onFail()
      printWin.close()
    }
  }, timeoutMs)

  printWin.webContents.print({ silent: true }, (success: boolean) => {
    clearTimeout(timer)
    if (!success) onFail()
    if (!printWin.isDestroyed()) printWin.close()
  })
}

async function getTargetPrinter(db: Database.Database): Promise<string | null> {
  try {
    const { getPrinters } = require('electron-pos-printer')
    const printers = await getPrinters()
    if (!printers.length) return null

    const selected = (db.prepare("SELECT value FROM settings WHERE key = 'selected_printer'").get() as any)?.value
    if (selected) {
      const match = printers.find((p: any) => p.name === selected)
      if (match) return match.name
    }

    const thermal = printers.find((p: any) => {
      const n = p.name.toLowerCase()
      return ['thermal', 'pos', 'epson', 'bixolon', 'star', 'tm-', 'rp-', 'xp-', 'citizen'].some(k => n.includes(k))
    })
    return thermal?.name || printers[0]?.name || null
  } catch { return null }
}


