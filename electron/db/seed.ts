import Database from 'better-sqlite3'
import crypto from 'crypto'

function hashPwd(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function seedDatabase(db: Database.Database) {
  const adminPassword = hashPwd('admin123')

  const existingAdmin = db.prepare("SELECT id FROM users WHERE email = 'admin@quickbite.com'").get()
  if (!existingAdmin) {
    db.prepare(
      'INSERT INTO users (name, email, password, role, pin, must_change_password) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('Administrador', 'admin@quickbite.com', adminPassword, 'admin', null, 1)
  }

  const catStmt = db.prepare(
    'INSERT OR IGNORE INTO categories (name, icon, color, "order") VALUES (?, ?, ?, ?)'
  )
  const categories = [
    { name: 'Hamburguesas', icon: 'Beef', color: '#FF6B35', order: 1 },
    { name: 'Pizzas', icon: 'Pizza', color: '#E91E63', order: 2 },
    { name: 'Bebidas', icon: 'Coffee', color: '#2196F3', order: 3 },
    { name: 'Postres', icon: 'Cookie', color: '#9C27B0', order: 4 },
    { name: 'Ensaladas', icon: 'Salad', color: '#4CAF50', order: 5 },
    { name: 'Papas y Acompañantes', icon: 'CookingPot', color: '#FF9800', order: 6 },
  ]
  for (const cat of categories) {
    catStmt.run(cat.name, cat.icon, cat.color, cat.order)
  }

  const prodStmt = db.prepare(
    'INSERT OR IGNORE INTO products (name, description, price, category_id, stock, sku) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const products = [
    { name: 'Combo Clásico', description: 'Hamburguesa con queso, papas y gaseosa', price: 35.00, category: 1, stock: 50, sku: 'COM-001' },
    { name: 'Doble Carne', description: 'Doble hamburguesa con queso, tocino y papas', price: 45.00, category: 1, stock: 40, sku: 'COM-002' },
    { name: 'Hamburguesa BBQ', description: 'Hamburguesa con salsa BBQ, aros de cebolla', price: 42.00, category: 1, stock: 35, sku: 'COM-003' },
    { name: 'Pizza Personal', description: 'Pizza personal de mozzarella', price: 30.00, category: 2, stock: 25, sku: 'PIZ-001' },
    { name: 'Pizza Familiar', description: 'Pizza grande de mozzarella y pepperoni', price: 65.00, category: 2, stock: 20, sku: 'PIZ-002' },
    { name: 'Pizza Suprema', description: 'Pizza grande con ingredientes variados', price: 75.00, category: 2, stock: 15, sku: 'PIZ-003' },
    { name: 'Coca Cola 500ml', description: 'Gaseosa Coca Cola personal', price: 8.00, category: 3, stock: 100, sku: 'BEB-001' },
    { name: 'Jugo Natural', description: 'Jugo natural de naranja o papaya', price: 12.00, category: 3, stock: 30, sku: 'BEB-002' },
    { name: 'Batido de Fresa', description: 'Batido cremoso de fresa', price: 18.00, category: 3, stock: 25, sku: 'BEB-003' },
    { name: 'Brownie con Helado', description: 'Brownie de chocolate con helado vainilla', price: 15.00, category: 4, stock: 20, sku: 'POS-001' },
    { name: 'Pastel de Chocolate', description: 'Porción de pastel de chocolate', price: 18.00, category: 4, stock: 15, sku: 'POS-002' },
    { name: 'Helado 3 Sabores', description: 'Helado artesanal 3 sabores', price: 12.00, category: 4, stock: 40, sku: 'POS-003' },
    { name: 'Ensalada César', description: 'Ensalada César con pollo', price: 28.00, category: 5, stock: 20, sku: 'ENS-001' },
    { name: 'Ensalada Mix', description: 'Ensalada mixta de la casa', price: 22.00, category: 5, stock: 20, sku: 'ENS-002' },
    { name: 'Papas Fritas Grandes', description: 'Porción grande de papas fritas crujientes', price: 15.00, category: 6, stock: 80, sku: 'ACO-001' },
    { name: 'Aros de Cebolla', description: 'Porción de aros de cebolla empanizados', price: 18.00, category: 6, stock: 40, sku: 'ACO-002' },
  ]
  for (const prod of products) {
    prodStmt.run(prod.name, prod.description, prod.price, prod.category, prod.stock, prod.sku)
  }

  const settingsStmt = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  )
  const settings: Record<string, string> = {
    business_name: 'QuickBite S.R.L.',
    nit_empresa: '123456789',
    address: 'Av. Principal 1234',
    city: 'La Paz, Bolivia',
    phone: '2-1234567',
    currency_symbol: 'Bs.',

    logo_path: '',
    qr_image: '',
    qr_enabled: 'false',
    app_name: 'QuickBite POS',
    theme_color: '#2563eb',
    print_mode: 'both',
    session_timeout: '5',
    selected_printer: '',
  }
  for (const [key, value] of Object.entries(settings)) {
    settingsStmt.run(key, value)
  }
}
