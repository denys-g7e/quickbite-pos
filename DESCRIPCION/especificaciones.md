# QuickBite POS v2.0.0 — Especificaciones Técnicas Completas

## 📁 Estructura del Proyecto

```
C:\Users\dell\quickbite-pos\
├── .gitignore
├── build.bat
├── index.html
├── LICENSE.txt
├── package.json
├── package-lock.json
├── postcss.config.js
├── start.bat
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── DEMO/
│   └── index.html
├── DESCRIPCION/
│   ├── index.html
│   └── especificaciones.md
├── Instalacion/
│   ├── QuickBite POS-Setup-2.0.0.exe
│   └── QuickBite POS-Portable-2.0.0.exe
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   ├── tsconfig.json
│   ├── db/
│   │   ├── schema.ts
│   │   └── seed.ts
│   └── ipc/
│       ├── ai.ts
│       ├── auth.ts
│       ├── categories.ts
│       ├── orders.ts
│       ├── printer.ts
│       ├── products.ts
│       ├── reports.ts
│       ├── settings.ts
│       ├── shifts.ts
│       └── users.ts
├── resources/
│   ├── generate-icon.ps1
│   └── icon.svg
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── types.d.ts
    ├── components/
    │   ├── ai/
    │   │   └── AIChat.tsx
    │   ├── layout/
    │   │   ├── AdminLayout.tsx
    │   │   └── POSLayout.tsx
    │   ├── pos/
    │   │   ├── CartPanel.tsx
    │   │   ├── OrderModal.tsx
    │   │   ├── PaymentModal.tsx
    │   │   └── ProductGrid.tsx
    │   ├── print/
    │   │   └── Ticket.tsx
    │   └── ui/
    │       ├── Badge.tsx
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Input.tsx
    │       ├── KPICard.tsx
    │       ├── Modal.tsx
    │       └── TitleBar.tsx
    ├── hooks/
    │   └── useInactivityTimeout.ts
    ├── lib/
    │   ├── formatters.ts
    │   └── utils.ts
    ├── pages/
    │   ├── Login.tsx
    │   ├── admin/
    │   │   ├── AIAssistant.tsx
    │   │   ├── Categories.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Orders.tsx
    │   │   ├── Products.tsx
    │   │   ├── Settings.tsx
    │   │   ├── Shifts.tsx
    │   │   ├── Statistics.tsx
    │   │   └── Users.tsx
    │   └── employee/
    │       ├── MyOrders.tsx
    │       ├── POS.tsx
    │       └── Profile.tsx
    └── store/
        ├── authStore.ts
        ├── cartStore.ts
        └── uiStore.ts
```

---

## 1. RAÍZ — ARCHIVOS DE CONFIGURACIÓN

### 1.1 `.gitignore` (11 líneas)
Excluye del control de versiones: `node_modules/`, `dist/`, `electron/dist/`, `.vite/`, `release/`, `*.log`, `.DS_Store`, `Thumbs.db`, `Instalacion/`, `*.exe`.

### 1.2 `build.bat` (45 líneas)
Script batch para Windows que automatiza el build completo:
1. `npm install` — instala dependencias
2. `npm run build` — compila Vite + TypeScript
3. Ejecuta `electron-builder` para generar portable (`.exe`)
4. Opcionalmente ejecuta `electron-builder` para generar instalador NSIS

### 1.3 `index.html` (16 líneas)
Entry point HTML de la app. Incluye:
- Meta charset UTF-8 y viewport responsive
- Content Security Policy básica
- Google Fonts (Inter: 400,500,600,700)
- Tema oscuro `background: #0F1117`
- `<div id="root">` para React

### 1.4 `LICENSE.txt` (17 líneas)
Licencia MIT. Copyright 2026 QuickBite Systems. Permiso para usar, copiar, modificar y distribuir.

### 1.5 `package.json` (104 líneas)
Manifest del proyecto:

**Scripts:**
- `dev` — vite dev
- `build` — vite build + tsc electron
- `preview` — vite preview
- `dist:portable` — electron-builder portable
- `dist:setup` — electron-builder NSIS
- `dist:all` — ambos instaladores
- `lint` — eslint src electron
- `typecheck` — tsc --noEmit src && tsc -p electron/tsconfig.json

**Dependencias principales:**
- `react` + `react-dom` (UI)
- `react-router-dom` (rutas)
- `zustand` (estado global)
- `recharts` (gráficos)
- `lucide-react` (iconos)
- `better-sqlite3` (base de datos SQLite)
- `clsx` (clases condicionales)
- `xlsx` + `archiver` (exportación SIN)
- `@electron/remote` (comunicación IPC)

**DevDependencias:**
- `electron` + `electron-builder`
- `typescript`, `vite`, `@vitejs/plugin-react`
- `tailwindcss`, `postcss`, `autoprefixer`
- `eslint` + plugins

**Electron Builder:**
- App ID: `com.quickbite.pos`
- Target: NSIS + portable (Windows x64)
- Icono: `resources/icon.png`
- NSIS: one-click installer, no carpeta de inicio, desktop shortcut automático
- Portable: ejecutable autónomo

### 1.6 `postcss.config.js` (6 líneas)
Configura Tailwind CSS y Autoprefixer.

### 1.7 `start.bat` (17 líneas)
Script para lanzar el portable desde la línea de comandos. Busca `QuickBite POS-Portable-*.exe` en la misma carpeta y lo ejecuta.

### 1.8 `tailwind.config.js` (53 líneas)
Configuración completa de Tailwind:

**Paleta de colores personalizada (tema oscuro):**
- `bg-primary`: `#0F1117` (fondo principal)
- `bg-secondary`: `#13161F` (fondos secundarios)
- `bg-tertiary`: `#1A1D27` (elementos elevados)
- `accent`: `#FF6B35` (naranja principal)
- `accent-hover`: `#E85E2A`
- `accent-muted`: `rgba(255,107,53,0.12)`
- `text-primary`, `text-secondary`, `text-muted`, `text-hint`
- `border-subtle`, `border-light`
- `status-success`, `status-warning`, `status-error`, `status-info`

**Tipografía:**
- `h1`: 28px, `h2`: 22px, `title`: 16px, `body`: 14px, `body-sm`: 13px, `label`: 12px, `caption`: 11px

### 1.9 `tsconfig.json` (25 líneas)
Config TypeScript para React:
- Target: ES2020
- Module: ESNext (bundler)
- JSX: react-jsx
- Strict: true
- Path alias: `@/*` → `./src/*`
- Skip lib check

### 1.10 `tsconfig.node.json` (10 líneas)
Config TypeScript para vite.config.ts. Composite: true.

### 1.11 `vite.config.ts` (20 líneas)
Configuración de Vite:
- Plugin: `@vitejs/plugin-react`
- Resolve alias: `@` → `./src`
- Base: `./` (rutas relativas para Electron)
- Server port: 5173
- Build output: `dist/`

---

## 2. `DEMO/` — DEMOSTRACIÓN HTML

### 2.1 `DEMO/index.html` (732 líneas)
Demo interactiva autónoma en un solo archivo HTML. No requiere servidor.

**Login:**
- Email y contraseña
- Usuarios hardcodeados: admin@quickbite.com/admin123 (admin), carlos@quickbite.com/1234 (employee)
- Determina rol y muestra la interfaz correspondiente

**Interfaz Admin:**
- Sidebar colapsable con navegación: Dashboard, Estadísticas, Órdenes, Productos, Categorías, Empleados, IA, Turnos, Configuración
- Dashboard: tarjetas KPI, gráfico de ventas por hora, top productos, stock bajo, estado del sistema
- POS empleado completo con productos, carrito, descuento, 4 métodos de pago, cálculo de cambio, ticket

**Interfaz Empleado:**
- Sidebar vertical con íconos: POS, Órdenes, Perfil
- POS: búsqueda, filtro por categoría, grid de productos, carrito lateral
- Payment modal: efectivo/tarjeta/QR/transferencia
- Perfil: editar nombre/email, cambiar contraseña

**Datos simulados:**
- 14 productos, 4 categorías, 2 usuarios
- Respuestas de IA hardcodeadas
- Turno de caja togglable
- Órdenes guardadas en memoria

---

## 3. `DESCRIPCION/` — PÁGINA DE DESCRIPCIÓN

### 3.1 `DESCRIPCION/index.html` (294 líneas)
Página de presentación con:
- Hero section con nombre y caption
- 3 tarjetas de features principales: POS en tiempo real, Dashboard analítico, Control de turnos
- Sección de beneficios (4 tarjetas)
- Sección de cómo funciona (3 pasos)
- Footer con copyright
- Diseño responsive con gradientes

---

## 4. `electron/` — BACKEND (NODE.JS)

### 4.1 `electron/main.ts` (230 líneas)
Proceso principal de Electron.

**Configuración de ventana:**
- Frameless (sin bordes del sistema)
- Tamaño: 1200×800
- Min: 900×600
- Icono: `resources/icon.png`
- webPreferences: contextIsolation, nodeIntegration: false, preload

**Inicialización:**
1. Obtiene `userData` path
2. Conecta SQLite con `better-sqlite3` y `PRAGMA foreign_keys = ON`
3. Ejecuta migración: agrega columna `category_name` a `order_items` si no existe
4. Ejecuta seed si la DB está vacía
5. Crea acceso directo en escritorio (solo portable)
6. Registra todos los IPC handlers
7. Carga la app (producción desde `dist/`, dev desde `http://localhost:5173`)

**IPC Handlers (directos en main.ts):**
- `app:notify-no-shift` — abre `mailto:` con aviso al administrador
- `app:delete-all-data` — borra orders/products/categories según opciones, reseeds si es completo
- `app:select-logo` — diálogo para seleccionar imagen de logo
- `app:read-file-base64` — lee archivo y devuelve base64
- `app:check-activation` / `app:activate` — sistema de activación con clave `denys123`
- `app:export-db` / `app:import-db` — copia/restaura archivo SQLite
- `app:minimize` / `app:maximize` / `app:close` — control de ventana
- `products:upload-image` — copia imagen a `userData/product-images/`

### 4.2 `electron/preload.ts` (92 líneas)
Expone `window.api` al frontend mediante `contextBridge`. API completa:

**auth:**
- `login(creds)` — login con email+password
- `logout()` — cerrar sesión
- `createUser(data)` — crear usuario
- `verifyPin(pin)` — verificar PIN
- `isLoggedIn()` — verificar sesión activa

**products:**
- `list(filters)` — listar productos
- `create(data)`, `update(id, data)`, `delete(id)` — CRUD
- `getLowStock()` — productos con stock bajo
- `uploadImage()` — subir imagen

**categories:** CRUD completo

**orders:**
- `create(data)` — crear orden
- `list(filters)`, `getById(id)`, `updateStatus(id, status)`, `cancel(id)`
- `getStats(period)`, `getTodaySales()`, `getTodayOrders()`
- `getHourlySales(period)`, `getTopProducts(period)`
- `getCategorySales(period)`, `getPaymentMethodDistribution(period)`
- `getEmployeeSales(period)`
- `exportCsv(filters)`, `exportSin(filters)`
- `getPurgeCount(beforeDate)`, `purge(beforeDate)`
- `getCustomerHistory(customerName)`

**users:**
- `list()`, `create(data)`, `update(id, data)`
- `toggleActive(id)`, `resetPassword(id, password)`, `delete(id)`
- `updateAdmin(id, data)`

**printer:**
- `printTicket(orderData)`, `printCombined(orderData)`
- `getPrinters()`, `test()`

**ai:** `ask(message)` — consulta al asistente IA

**settings:**
- `get(key)`, `set(key, value)`, `getAll()`

**shifts:**
- `open(data)`, `close(data)`, `current()`, `list(dateFilter)`, `check()`

**app:**
- `minimize()`, `maximize()`, `close()`
- `exportDB()`, `importDB()`, `selectLogo()`
- `readFileBase64(filePath)`
- `deleteAllData(options?)`
- `checkActivation()`, `activate(key)`
- `notifyNoShift()`

### 4.3 `electron/tsconfig.json` (18 líneas)
Target ES2020, CommonJS, output a `./dist`, source maps.

---

## 5. `electron/db/` — BASE DE DATOS

### 5.1 `electron/db/schema.ts` (80 líneas)
Define el esquema SQLite con 7 tablas:

**users:**
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL
- `email` TEXT UNIQUE NOT NULL
- `password` TEXT NOT NULL (PBKDF2 hash:salt)
- `pin` TEXT (4 dígitos, opcional)
- `role` TEXT CHECK(admin/employee) DEFAULT 'employee'
- `is_active` INTEGER DEFAULT 1
- `created_at` TEXT DEFAULT datetime('now')

**categories:**
- `id`, `name`, `icon` (emoji), `color` (hex), `is_active`, `created_at`

**products:**
- `id`, `name`, `description`, `price` REAL, `cost` REAL, `category_id` INTEGER REFERENCES categories(id)
- `image_url`, `sku`, `stock` INTEGER DEFAULT 0, `is_active`, `is_delivery`, `created_at`

**orders:**
- `id`, `order_number` TEXT UNIQUE, `customer_name`, `customer_phone`, `customer_nit`
- `service_type` TEXT CHECK(mesa/para_llevar/delivery), `table_number` TEXT
- `subtotal` REAL, `discount` REAL DEFAULT 0, `total` REAL
- `payment_method` TEXT CHECK(efectivo/tarjeta/qr/transferencia)
- `status` TEXT CHECK(pending/preparing/ready/completed/cancelled) DEFAULT 'pending'
- `employee_id` INTEGER REFERENCES users(id), `notes`
- `created_at`, `updated_at`

**order_items:**
- `id`, `order_id` INTEGER REFERENCES orders(id) ON DELETE CASCADE
- `product_id` INTEGER, `product_name` TEXT, `category_name` TEXT
- `quantity` INTEGER, `unit_price` REAL, `subtotal` REAL

**settings:**
- `key` TEXT PRIMARY KEY, `value` TEXT

**cash_shifts:**
- `id`, `employee_id` INTEGER REFERENCES users(id)
- `opening_amount` REAL, `closing_amount` REAL
- `opened_at` TEXT DEFAULT datetime('now'), `closed_at` TEXT
- `notes`, `status` TEXT CHECK(open/closed) DEFAULT 'open'

### 5.2 `electron/db/seed.ts` (76 líneas)
Poblado inicial de la DB:

**Usuario admin:**
- admin@quickbite.com / admin123 (PBKDF2)
- PIN: 1234
- Rol: admin

**6 Categorías:**
1. Hamburguesas (#f44336)
2. Bebidas (#2196F3)
3. Extras (#FF9800)
4. Postres (#E91E63)
5. Pollo (#4CAF50)
6. Desayunos (#9C27B0)

**16 Productos** (ejemplos):
- Hamburguesa Clásica (Bs. 25), BBQ (Bs. 30), Pollo (Bs. 28), Doble Carne (Bs. 35)
- Coca Cola (Bs. 8), Fanta (Bs. 8), Agua Vital (Bs. 6), Paceña (Bs. 15)
- Papas Fritas (Bs. 12), Aros de Cebolla (Bs. 14), Nuggets (Bs. 18)
- Helado Sundae (Bs. 12), Brownie (Bs. 15), Flan (Bs. 10)
- Alitas BBQ (Bs. 22), Sandwich Mixto (Bs. 18)

**18 Settings** con valores por defecto:
- restaurant_name, restaurant_nit, restaurant_address, restaurant_city, restaurant_phone
- currency_symbol, thank_you_message, low_stock_threshold
- session_timeout, demo_mode, print_mode, paper_width
- happy_hour_enabled, happy_hour_start, happy_hour_end, happy_hour_discount
- ai_provider, ai_api_key

---

## 6. `electron/ipc/` — MANEJADORES IPC

### 6.1 `ai.ts` (99 líneas)
Manejador `ai:ask`. Recibe un mensaje, construye un prompt con:
- Ventas del día, total órdenes, ticket promedio
- Top 5 productos más vendidos
- Productos con stock bajo
- Horas pico y ventas por hora
- Datos de la última semana

Envía a Groq API (llama-3.3-70b-versatile) con temperatura 0.7 y devuelve la respuesta.

### 6.2 `auth.ts` (53 líneas)
**Login:** Busca usuario por email, compara password usando PBKDF2 (100k iteraciones, SHA-512), devuelve datos del usuario.
**Logout:** No hace nada (el estado lo maneja el frontend).
**Verify PIN:** Busca usuario por rol employee y compara PIN en texto plano.
**isLoggedIn:** Devuelve false (el frontend maneja sesión con Zustand).

### 6.3 `categories.ts` (58 líneas)
CRUD de categorías:
- `list` — SELECT con subquery de count de productos activos
- `create` — INSERT
- `update` — UPDATE por id
- `delete` — Si tiene productos, desactiva (`is_active = 0`) en lugar de borrar

### 6.4 `orders.ts` (359 líneas)
El handler más complejo. Funcionalidades:

**Crear orden:**
1. Genera número de orden (`QB-YYYY-NNN`)
2. Valida stock (verifica cantidad disponible)
3. Descuenta stock de productos
4. Inserta orden y order_items en transacción
5. Retorna orden creada

**Listar órdenes:** JOIN con users para nombre de empleado, filtros por fechas/empleado/estado, ordenado por fecha descendente, límite 100.

**Actualizar estado:**
- Al completar: descuenta stock si no se descontó antes
- Al cancelar: restaura stock

**Estadísticas:**
- `orders:stats` — ventas totales, órdenes, ticket promedio, método de pago (por período)
- `orders:today-sales` — suma de totales del día
- `orders:today-orders` — conteo del día
- `orders:hourly-sales` — agrupado por hora (0-23)
- `orders:top-products` — top 10 por cantidad vendida
- `orders:category-sales` — ventas agrupadas por categoría
- `orders:payment-method-dist` — distribución por método de pago
- `orders:employee-sales` — ventas por empleado

**Exportaciones:**
- `orders:export-csv` — genera CSV con columnes: Número, Cliente, Tipo, Empleado, Items, Subtotal, Descuento, Total, Método, Estado, Fecha
- `orders:export-sin` — genera ZIP con:
  - `factura.xlsx` (columnas: N° Factura, Razón Social, NIT, Monto Total, ICU, etc.)
  - `exportacion.txt` (resumen en texto plano)

**Purga:**
- `orders:purge-count` — cuenta órdenes anteriores a una fecha
- `orders:purge` — borra órdenes anteriores a una fecha (con CASCADE a order_items)

**Historial cliente:**
- `orders:customer-history` — busca por nombre, devuelve visitas, gasto total, última visita

### 6.5 `printer.ts` (235 líneas)
Módulo de impresión térmica:

**Listar impresoras:** usa `electron-printer` para detectar impresoras del sistema.

**Imprimir ticket:**
1. Construye texto formateado con anchos de 32 o 48 caracteres
2. Incluye: encabezado del negocio, número de orden, items, totales, método de pago, mensaje
3. Opción 1: envía texto plano a impresora térmica
4. Opción 2 (fallback): genera PDF con `PDFDocument` y envía a imprimir

**Imprimir combinado (cocina + ticket):**
1. Filtra items por estación: `COCINA` (hamburguesas, pollo, extras) y `BARRA` (bebidas, postres)
2. Imprime dos tickets separados (cocina y barra) más el ticket del cliente (opcional)

**Test de impresora:** envía página de prueba.

### 6.6 `products.ts` (113 líneas)
CRUD de productos:
- `list` — JOIN con categorías, filtros por categoría/búsqueda/solo activos
- `create` — INSERT incluyendo image_url
- `update` — UPDATE por id
- `delete` — DELETE (con verificación de que no tenga órdenes pendientes)
- `low-stock` — SELECT con stock <= threshold configurado

### 6.7 `reports.ts` (46 líneas)
Reportes avanzados:
- 30-day daily sales trend (ventas diarias últimos 30 días)
- Average ticket trend (ticket promedio diario)
- Peak hours (horas con más órdenes)

### 6.8 `settings.ts` (48 líneas)
Manejo de configuraciones:
- `get` — SELECT por key, decodifica Base64 si contiene `base64:`
- `set` — INSERT OR REPLACE, codifica a Base64 si el valor contiene caracteres sensibles
- `get-all` — SELECT * FROM settings, devuelve como objeto

### 6.9 `shifts.ts` (49 líneas)
Manejo de turnos de caja:
- `open` — Verifica que el usuario sea admin, crea turno con monto de apertura, cierra turno previo si existe
- `close` — Actualiza turno con monto de cierre y timestamp
- `current` — SELECT turno abierto con datos del empleado
- `list` — Historial de turnos (opcional por fecha)
- `check` — Verifica si hay turno abierto (booleano)

### 6.10 `users.ts` (85 líneas)
CRUD de usuarios:
- `list` — SELECT con LEFT JOIN para order_count, total_sales, last_order
- `create` — INSERT con password hasheado (PBKDF2), PIN opcional
- `update` — UPDATE name, email, role, is_active
- `toggle-active` — Intercambia is_active (0↔1)
- `reset-password` — Hashea y actualiza password
- `delete` — DELETE WHERE role = 'employee'
- `update-admin` — Actualiza admin name, email, password

---

## 7. `src/` — FRONTEND (REACT + TYPESCRIPT)

### 7.1 `src/App.tsx` (122 líneas)
Componente raíz de React.

**HashRouter** con rutas:
- `/login` — pantalla de login
- `/admin/dashboard` — dashboard admin
- `/admin/products` — productos
- `/admin/categories` — categorías
- `/admin/users` — empleados
- `/admin/orders` — órdenes
- `/admin/statistics` — estadísticas
- `/admin/ai-assistant` — asistente IA
- `/admin/shifts` — turnos
- `/admin/settings` — configuración
- `/pos` — POS empleado
- `/employee/orders` — mis órdenes
- `/employee/profile` — perfil empleado

**ProtectedRoute:** wrapper que verifica autenticación y rol. Redirige a login si no autenticado, a dashboard/pos según rol.

**ActivationScreen:** Modal de activación con clave `denys123`. Se muestra hasta que el usuario active el sistema.

**Lazy loading:** Todas las páginas se cargan con `React.lazy()` + `Suspense`.

### 7.2 `src/main.tsx` (5 líneas)
Punto de entrada: `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`

### 7.3 `src/index.css` (52 líneas)
Estilos globales:
- Directivas Tailwind (`@tailwind base/components/utilities`)
- Body con altura completa, overflow hidden, fondo `--bg`
- Scrollbar personalizada (oscura, 6px)
- Animación `fadeIn` para transiciones
- Ocultar spinners de inputs numéricos

### 7.4 `src/types.d.ts` (98 líneas)
Declaraciones de tipos para `window.api` completo. Define interfaces:
- `AuthAPI`, `ProductsAPI`, `CategoriesAPI`, `OrdersAPI`
- `UsersAPI`, `PrinterAPI`, `AiAPI`, `SettingsAPI`, `ShiftsAPI`, `AppAPI`
- Interfaz `Window` con `api` property

---

## 8. `src/store/` — ESTADO GLOBAL (ZUSTAND)

### 8.1 `authStore.ts` (19 líneas)
Store de autenticación:
- `user`: `{ id, name, email, role } | null`
- `isAuthenticated`: boolean
- `login(user)`: establece usuario y autenticado
- `logout()`: limpia estado

### 8.2 `cartStore.ts` (128 líneas)
Store del carrito de compras:
- `items`: array de `{ product, quantity, subtotal }`
- `customerName`, `customerPhone`, `customerNit`
- `serviceType`: 'mesa' | 'para_llevar' | 'delivery'
- `tableNumber`: string
- `paymentMethod`: string
- `discount`: number
- Acciones: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `setCustomerInfo`, etc.
- Getters computados: `subtotal`, `total`, `itemCount`

### 8.3 `uiStore.ts` (27 líneas)
Store de UI:
- `sidebarCollapsed`: boolean
- `showOrderModal`, `showPaymentModal`: boolean
- `selectedCategory`: number | null
- `searchQuery`: string
- Acciones: toggle sidebar, abrir/cerrar modales, filtrar

---

## 9. `src/lib/` y `src/hooks/` — UTILIDADES

### 9.1 `src/lib/formatters.ts` (40 líneas)
- `formatCurrency(value)` — "Bs. 25.00"
- `formatNumber(value)` — "1,234"
- `formatPercentage(value)` — "12.5%"
- `validateNit(nit)` — valida NIT boliviano (7-15 dígitos)
- `getServiceTypeLabel(type)` — "Mesa", "Para llevar", "Delivery"
- `getServiceTypeIcon(type)` — icono correspondiente

### 9.2 `src/lib/utils.ts` (52 líneas)
- `cn(...inputs)` — merge de clases con clsx
- `formatDate(date)` — "02/07/2026, 14:30"
- `formatDateShort(date)` — "02/07/2026"
- `getStatusColor(status)` — color según estado de orden
- `getStatusLabel(status)` — "Pendiente", "Preparando", etc.
- `debounce(fn, delay)` — debounce genérico
- Tipos exportados: `OrderStatus`, `ServiceType`, `PaymentMethod`

### 9.3 `src/hooks/useInactivityTimeout.ts` (61 líneas)
Hook personalizado que monitorea inactividad:
- Escucha: mousemove, mousedown, keydown, touchstart, wheel, scroll
- Timeout configurable (default 5 min)
- Muestra advertencia 30s antes de cerrar sesión
- Función `dismissWarning()` para reiniciar contador
- Se limpia automáticamente al desmontar

---

## 10. `src/components/` — COMPONENTES REACT

### 10.1 `components/ai/AIChat.tsx` (83 líneas)
Widget de chat con IA:
- Mensajes alternados (usuario a la derecha, bot a la izquierda)
- Typing indicator mientras "piensa"
- Input con botón de envío
- Scroll automático al último mensaje

### 10.2 `components/layout/AdminLayout.tsx` (182 líneas)
Layout para páginas de administración:
- Sidebar con navegación: Dashboard, Estadísticas, Órdenes, Productos, Categorías, Empleados, IA, Turnos, Configuración
- Colapsable (íconos solos o con texto)
- Resalta página activa
- Avatar con inicial + nombre en la parte inferior
- Botón de cerrar sesión
- Inactividad: timeout configurable, warning modal a los 30s
- TitleBar personalizado

### 10.3 `components/layout/POSLayout.tsx` (92 líneas)
Layout para páginas de empleado:
- Sidebar vertical (64px) con navegación:
  - POS (carrito)
  - Mis órdenes (clipboard)
  - Mi perfil (usuario)
- En la parte inferior: avatar con inicial, nombre, botón logout
- TitleBar personalizado
- Inactividad: timeout + warning modal

### 10.4 `components/pos/CartPanel.tsx` (102 líneas)
Panel lateral del carrito:
- Header con título y contador de items
- Estado vacío (ícono + mensaje)
- Lista de items: nombre, precio unitario, cantidad (+/−/eliminar), subtotal
- Footer:
  - Input de descuento (Bs.)
  - Subtotal, descuento, total
  - Botón "Proceder al cobro" con monto total

### 10.5 `components/pos/OrderModal.tsx` (124 líneas)
Modal de datos de orden:
- Nombre del cliente (obligatorio)
- Teléfono
- NIT (validado)
- Tipo de servicio: Mesa / Para llevar / Delivery
- Número de mesa (si aplica)
- Detección de cliente frecuente (busca historial por nombre)
- Botones: Cancelar / Continuar al cobro

### 10.6 `components/pos/PaymentModal.tsx` (266 líneas)
Modal de cobro:
- Muestra total a cobrar (grande)
- Selección de método de pago:
  - **Efectivo:** input de monto recibido, calcula cambio automático
  - **Tarjeta:** confirmación directa
  - **QR:** muestra código QR generado
  - **Transferencia:** confirmación directa
- **Happy Hour:** detecta automáticamente si es horario de descuento (configurable) y aplica descuento
- Verifica turno de caja abierto antes de cobrar (notifica si no hay turno pero no bloquea)
- Confirma cobro:
  1. Si hay turno cerrado, envía `notifyNoShift` (abre mailto:)
  2. Crea orden via API
  3. Imprime ticket combinado
  4. Muestra pantalla de éxito con resumen del ticket
- Botón "Nueva orden" para reiniciar

### 10.7 `components/pos/ProductGrid.tsx` (137 líneas)
Grid de productos para POS:
- Barra de búsqueda con ícono
- Pestañas de categorías (scroll horizontal)
- Grid responsive (3 columnas → 2 → 1)
- Cada producto: emoji/imagen, nombre, categoría, precio, botón +
- Alerta de stock bajo si corresponde
- Estado vacío cuando no hay resultados

### 10.8 `components/print/Ticket.tsx` (56 líneas)
Componente de ticket imprimible:
- Estilo monospace, fondo blanco, texto negro
- Encabezado del negocio (nombre, NIT, dirección)
- Número de orden, cliente, tipo de servicio
- Items: cantidad, nombre, precio unitario, subtotal
- Línea separadora
- Subtotal, descuento, total (destacado)
- Método de pago, fecha
- Mensaje de agradecimiento

### 10.9 `components/ui/Badge.tsx` (26 líneas)
Badge reutilizable:
- Variants: default (gris), success (verde), warning (naranja), error (rojo), info (azul), accent (naranja principal)
- Sizes: sm (8px padding), md (10px)

### 10.10 `components/ui/Button.tsx` (43 líneas)
Botón reutilizable:
- Variants: primary (naranja), secondary (gris con borde), ghost (transparente), danger (rojo)
- Sizes: sm (1.5px padding), md (4px), lg (6px)
- Estado loading: spinner SVG animado

### 10.11 `components/ui/Card.tsx` (14 líneas)
Contenedor Card:
- Fondo `bg-tertiary`, borde sutil, border-radius 12px
- Padding: sm (12px), md (16px), lg (24px)

### 10.12 `components/ui/Input.tsx` (25 líneas)
Input reutilizable:
- Label opcional arriba
- Icono opcional a la izquierda
- Error message abajo (rojo)
- Estilo oscuro consistente
- Todas las props de HTML input

### 10.13 `components/ui/KPICard.tsx` (35 líneas)
Tarjeta de indicador KPI:
- Título pequeño (gris)
- Valor grande (blanco)
- Delta opcional (verde/subida, rojo/bajada)
- Icono decorativo a la derecha

### 10.14 `components/ui/Modal.tsx` (37 líneas)
Modal reutilizable:
- Overlay oscuro semi-transparente
- Cierra al hacer clic fuera (opcional)
- Título con botón de cerrar
- Sizes: sm (400px), md (500px), lg (600px), xl (700px)
- Animación de entrada suave

### 10.15 `components/ui/TitleBar.tsx` (34 líneas)
Barra de título personalizada (Electron frameless):
- QuickBite POS + versión
- Botones: minimizar (−), maximizar (□), cerrar (✕)
- Hover en cerrar: fondo rojo
- Llama a `window.api.app.minimize/maximize/close`

---

## 11. `src/pages/` — PÁGINAS

### 11.1 `src/pages/Login.tsx` (241 líneas)
Pantalla de inicio de sesión:

**Diseño:** Split screen
- Izquierda: formulario de login (centrado)
- Derecha: feature showcase (versión desktop) o encima (versión mobile)

**Selector de rol:**
- Admin (icono escudo) o Empleado (icono usuario)
- Determina qué método de login se muestra

**Formulario Admin:**
- Email + contraseña
- Botón "Iniciar sesión"

**Formulario Empleado:**
- PIN de 4 dígitos (con teclado numérico visual)
- Protección: 3 intentos máximos, bloqueo de 30 segundos
- Alternativamente: email + contraseña

**Feature showcase:**
- POS en tiempo real
- Dashboard analítico
- Control de inventario
- Gestión de empleados
- Turno de caja
- Asistente IA

### 11.2 `pages/admin/Dashboard.tsx` (272 líneas)
Dashboard principal:

**KPIs** (según período: hoy/semana/mes):
- Ventas totales (Bs.)
- Órdenes completadas
- Ticket promedio
- Órdenes totales
- Cada KPI incluye ícono y variación porcentual

**Gráfico de ventas por hora:**
- Chart de barras (Recharts)
- Eje X: horas (08-22)
- Tooltip con monto exacto

**Últimas órdenes:**
- Lista de las 5 órdenes más recientes
- Nombre cliente, items (truncado), total, estado

**Top 5 productos:**
- Ranking con emoji, nombre, monto vendido

**Estado del sistema:**
- Impresora, BD, stock bajo, modo

**Alertas de stock bajo:**
- Productos con stock <= threshold configurado

**Asistente IA:**
- Mini widget para preguntar al asistente

### 11.3 `pages/admin/Products.tsx` (237 líneas)
Gestión de productos:

**Tabla:**
- Búsqueda en vivo
- Columnas: Imagen, Nombre, SKU, Precio, Costo, Stock, Categoría, Estado, Acciones
- Scroll horizontal

**Modal de crear/editar:**
- Nombre, descripción
- Precio, costo
- Categoría (select)
- Stock, SKU
- Subir imagen (file dialog)
- Toggles: Activo, Delivery
- Delete con confirmación

### 11.4 `pages/admin/Categories.tsx` (133 líneas)
Gestión de categorías:

**Grid de tarjetas:**
- Ícono (emoji), nombre, color, conteo de productos

**Modal:**
- Nombre, ícono (selector de emoji), color (picker)
- Delete: desactiva si tiene productos

### 11.5 `pages/admin/Users.tsx` (214 líneas)
Gestión de empleados:

**Tabla:**
- Nombre con avatar (inicial), email, rol (badge), ventas totales, órdenes, estado activo
- Acciones: toggle activo, reset password, delete

**Modal crear empleado:**
- Nombre, email, contraseña (mín 4 caracteres), PIN opcional
- Validación de campos

**Modal reset password:**
- Nueva contraseña para empleado seleccionado

**Modal configuración admin:**
- Nombre del administrador, email, nueva contraseña

### 11.6 `pages/admin/Orders.tsx` (163 líneas)
Listado de órdenes:

**Tabla:**
- Número de orden, cliente, tipo servicio, empleado, items (truncado), total, método pago, estado, fecha
- Badge de estado con color

**Modal detalle:**
- Información completa de la orden
- Lista de items con cantidades y subtotales

**Exportaciones:**
- "Exportar CSV" — descarga CSV con filtros actuales
- "Exportar SIN" — genera ZIP con XLSX + TXT para facturación

### 11.7 `pages/admin/Statistics.tsx` (160 líneas)
Estadísticas avanzadas:

**KPIs:** Ventas, órdenes, ticket promedio, total

**Gráficos:**
- Ventas por categoría (barras horizontales)
- Métodos de pago (pastel/donut)
- Top 10 productos (barras)
- Ranking empleados (barras)

**Periodos:** Hoy, Semana, Mes, Año

**Exportar CSV**

### 11.8 `pages/admin/AIAssistant.tsx` (167 líneas)
Asistente IA administrativo:

**Chat:**
- Mensajes de bienvenida del bot
- Input de texto + botón enviar
- Botones de preguntas rápidas:
  - "¿Cuál es el mejor día?"
  - "¿Qué producto promocionar?"
  - "¿Horas pico?"
  - "¿Análisis de stock?"

**API Key:** Si no está configurada, muestra advertencia

### 11.9 `pages/admin/Settings.tsx` (474 líneas)
Configuración general. Secciones colapsables:

**Datos del negocio:** Nombre, NIT, dirección, ciudad, teléfono, moneda

**General:** Mensaje de agradecimiento, umbral stock bajo, correo notificación turno, timeout sesión

**Logo:** Preview + upload

**Personalización:** Nombre app, color tema

**Happy Hour:** Activar/desactivar, hora inicio, hora fin, descuento (%)

**Modo Demo:** Activar/desactivar

**Print:** Modo (ticket/PDF), ancho papel, selector impresora

**QR:** Activar/desactivar pago QR

**Groq AI:** Configurar API key, test

**Respaldos:** Exportar DB (.db), Importar DB

**Purgar datos:** Seleccionar fecha, contar órdenes a purgar, ejecutar purga

**Borrar todo:** Confirmación con email admin + contraseña, opciones (órdenes/productos/categorías), ejecutar

### 11.10 `pages/admin/Shifts.tsx` (168 líneas)
Gestión de turnos de caja:

**Estado actual:**
- Si hay turno abierto: monto apertura, empleado, fecha, botón cerrar
- Si no: botón abrir turno

**Modal abrir turno:**
- Monto de apertura (obligatorio)

**Modal cerrar turno:**
- Monto de cierre (obligatorio), notas opcionales

**Historial:**
- Lista de turnos: empleado, apertura, cierre, estado

### 11.11 `pages/employee/POS.tsx` (56 líneas)
Página principal del POS empleado:

**Componentes:**
- Banner de turno (amarillo si no hay turno abierto)
- Header: "Nueva orden", badge de turno (activo/sin turno), reloj, fecha, contador carrito
- ProductGrid + CartPanel

**Comportamiento:**
- Consulta estado del turno cada 30 segundos
- Muestra "Sin turno" badge + warning banner si no hay turno
- Abre OrderModal → PaymentModal secuencialmente

### 11.12 `pages/employee/MyOrders.tsx` (69 líneas)
Historial de órdenes del empleado:
- Lista de órdenes con número, cliente, fecha, total
- Filtrado por empleado actual

### 11.13 `pages/employee/Profile.tsx` (174 líneas)
Perfil del empleado:

**Información personal:**
- Nombre (editable)
- Email (editable)
- Botón guardar con feedback de éxito
- Muestra rol e ID

**Cambiar contraseña:**
- Contraseña actual, nueva, confirmar
- Validación: mínimo 4 caracteres, coincidencia, verifica contraseña actual con `auth:login`
- Feedback de éxito

---

## 12. `resources/` — RECURSOS

### 12.1 `resources/generate-icon.ps1` (14 líneas)
Script PowerShell que usa ImageMagick para convertir un PNG 256×256 a archivo `.ico`.

### 12.2 `resources/icon.svg` (7 líneas)
SVG del ícono de la aplicación: cuadrado naranja con "QB" blanco y badge verde "$".

---

## 13. DISTRIBUCIÓN — `Instalacion/`

### 13.1 `QuickBite POS-Setup-2.0.0.exe` (~87 MB)
Instalador NSIS one-click para Windows x64. Crea acceso directo en escritorio.

### 13.2 `QuickBite POS-Portable-2.0.0.exe` (~87 MB)
Ejecutable portable autónomo. Crea acceso directo en escritorio automáticamente al primer inicio.

---

## 14. TECNOLOGÍAS UTILIZADAS

| Tecnología | Propósito |
|------------|-----------|
| **Electron 33** | Framework de escritorio multiplataforma |
| **React 19** | UI declarativa basada en componentes |
| **TypeScript** | Tipado estático |
| **Vite 5** | Build tool rápido |
| **Tailwind CSS** | Estilos utility-first |
| **Zustand** | Estado global liviano |
| **better-sqlite3** | Base de datos local embebida |
| **Recharts** | Gráficos responsivos |
| **Lucide React** | Iconos SVG |
| **electron-builder** | Empaquetado NSIS + portable |
| **Groq API** | Asistente IA (llama-3.3-70b) |
| **xlsx + archiver** | Exportación SIN (Excel + ZIP) |
| **pdfkit** | Generación de PDF para impresión |
| **PBKDF2** | Hash de contraseñas (100k iteraciones) |

---

## 15. SEGURIDAD

- **Contraseñas:** hasheadas con PBKDF2 (SHA-512, 100k iteraciones)
- **API Keys:** almacenadas en Base64 en settings
- **Context Isolation:** Electron con contextBridge, no `nodeIntegration`
- **Protección PIN:** bloqueo de 30 segundos tras 3 intentos fallidos
- **Roles:** Admin y Employee con rutas protegidas
- **Activación:** clave única `denys123` por dispositivo

---

## 16. FUNCIONALIDADES CLAVE

1. **POS Rápido:** búsqueda, categorías, carrito, descuentos, 4 métodos de pago
2. **Turno de Caja:** apertura con monto, cierre, historial, notificación email si no hay turno
3. **Dashboard:** KPIs, gráfico ventas por hora, top productos, stock bajo
4. **Estadísticas:** ventas por categoría, métodos de pago, ranking empleados, exportación CSV
5. **Gestión:** productos, categorías, empleados, órdenes con CRUD completo
6. **Impresión Térmica:** tickets cliente + comandas cocina/barra separadas
7. **Asistente IA:** análisis de ventas con Groq LLM
8. **Exportación SIN:** Excel + TXT en ZIP para contabilidad boliviana
9. **Configuración:** Happy Hour, logo, demo mode, purga, respaldo DB
10. **Perfil Empleado:** editar nombre/email, cambiar contraseña
11. **Demo Interactiva:** DEMO/index.html funcional en navegador
12. **Sistema de Activación:** clave única por dispositivo
13. **Offline:** 100% local, no requiere internet (excepto IA)
14. **Photos:** carga opcional de imágenes para productos
15. **Frequent Customer:** detección automática de clientes recurrentes
