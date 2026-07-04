# ⚡ QuickBite POS

**Sistema de Punto de Venta para restaurantes de comida rápida**

Desktop app construida con Electron 33 + React 19 + TypeScript + SQLite. 100% offline (excepto asistente IA).

---

## 🚀 Características

### POS (Punto de Venta)
- Catálogo de productos con búsqueda y filtro por categorías
- Carrito de compras con ajuste de cantidades
- Happy Hour automático por reglas (porcentaje, fijo, 2x1)
- Múltiples métodos de pago: Efectivo, Tarjeta, QR, Transferencia
- Cálculo de cambio automático
- Ticket digital con detalle de la compra

### KDS (Kitchen Display System)
- Pantalla de cocina en tiempo real con polling cada 3s
- Filtro por estación: Cocina / Barra
- Estados de items: Pendiente → Cocina/Barra → Listo → Entregado
- Ventana independiente para monitor secundario
- Modo pantalla completa

### Gestión de Mesas
- Comandas abiertas con estado Pendiente
- Asignación de mesas
- Split bill (dividir cuenta)
- Merge de mesas
- Cierre de mesa con cobro

### Dashboard & Estadísticas
- Resumen de ventas del día/semana/mes
- Top productos más vendidos
- Ventas por hora (gráfico de barras)
- Distribución de métodos de pago
- Alertas de stock bajo

### Administración
- **Productos**: CRUD completo con imágenes
- **Categorías**: Organización por colores
- **Empleados**: Gestión de usuarios con roles
- **Turnos de caja**: Apertura y cierre con montos
- **Happy Hour**: Reglas programables por producto/categoría, horario y días

### Asistente IA (Groq)
- Preguntas en lenguaje natural sobre ventas, productos, empleados
- 8 funciones SQL que el asistente puede ejecutar
- Respuestas contextuales basadas en datos reales

### Seguridad
- Autenticación con bcrypt + sesiones
- Roles: Admin / Empleado
- Inactividad con timeout automático
- Cancelación de órdenes con motivo
- Log de auditoría (cambios de precio, stock, roles)
- safeStorage + fallback AES-256-GCM

---

## 📦 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS + Lucide React |
| Estado | Zustand |
| Backend | Electron 33 (main process) |
| Base de datos | SQLite (better-sqlite3) |
| Seguridad | bcrypt, safeStorage, AES-256-GCM |
| Impresión | EscPOS (USB / Network) |
| IA | Groq API (function calling) |
| Distribución | electron-builder (NSIS + Portable) |

---

## 🛠️ Instalación y Desarrollo

```bash
# Clonar
git clone https://github.com/denys-g7e/quickbite-pos.git
cd quickbite-pos

# Instalar dependencias
npm install

# Desarrollo (hot reload + electron)
npm run dev

# Build producción
npm run build

# Generar EXEs
npm run dist:all
```

### EXEs generados en `release/`
- `QuickBite POS-Setup-2.0.0.exe` — Instalador NSIS
- `QuickBite POS-Portable-2.0.0.exe` — Versión portable

---

## 🔐 Credenciales Demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@quickbite.com | admin123 |
| Empleado | carlos@quickbite.com | 1234 |

---

## 📁 Estructura del Proyecto

```
quickbite-pos/
├── electron/              # Main process (backend)
│   ├── main.ts           # Entry point, IPC handlers
│   ├── preload.ts        # Context bridge API
│   ├── session.ts        # Sesión y validación
│   ├── db/
│   │   ├── schema.ts     # Esquema SQLite
│   │   ├── seed.ts       # Datos iniciales
│   │   └── connection.ts # Conexión a DB
│   └── ipc/              # Handlers IPC
│       ├── auth.ts       # Autenticación
│       ├── orders.ts     # Órdenes
│       ├── products.ts   # Productos
│       ├── categories.ts # Categorías
│       ├── users.ts      # Usuarios
│       ├── settings.ts   # Configuración
│       ├── shifts.ts     # Turnos
│       ├── kds.ts        # Kitchen Display
│       ├── happy-hour.ts # Reglas Happy Hour
│       ├── ai.ts         # Asistente IA (Groq)
│       └── audit.ts      # Log de auditoría
├── src/                  # Renderer (frontend React)
│   ├── App.tsx           # Router principal
│   ├── components/       # Componentes reutilizables
│   │   ├── ui/           # Botones, inputs, modales, cards
│   │   ├── pos/          # POS (ProductGrid, Cart, Payment)
│   │   └── layout/       # Sidebars, layouts
│   ├── pages/            # Páginas
│   │   ├── pos/          # POS (productos, carrito)
│   │   ├── admin/        # Dashboard, Stats, Orders, Products...
│   │   └── kds/          # Kitchen Display System
│   ├── store/            # Zustand stores
│   └── lib/              # Utilidades
├── DEMO/                 # Demo HTML interactiva
├── DESCRIPCION/          # Landing page descriptiva
└── release/              # Builds distribubles
```

---

## 📸 Capturas

> Demo interactiva disponible en [`DEMO/`](./DEMO/DEMO%20QUICKBITE.html)

| Pantalla | Descripción |
|----------|-------------|
| Login | Dos columnas con selector de rol (Admin/Empleado) |
| POS | Grid de productos, carrito lateral, filtros |
| Dashboard | KPIs, ventas por hora, top productos |
| KDS | Órdenes en cocina con estados y avance |
| Mesas | Grid de mesas con detalle de comanda |
| IA | Chat con asistente Groq + function calling |
| Configuración | Datos del negocio, notificaciones, stock |

---

## 📄 Licencia

MIT © QuickBite Systems
