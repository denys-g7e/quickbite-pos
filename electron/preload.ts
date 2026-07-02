import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (creds: { email: string; password: string }) =>
      ipcRenderer.invoke('auth:login', creds),
    logout: () => ipcRenderer.invoke('auth:logout'),
    createUser: (data: { name: string; email: string; password: string; role: string; pin?: string }) =>
      ipcRenderer.invoke('auth:create-user', data),
    verifyPin: (pin: string) => ipcRenderer.invoke('auth:verify-pin', pin),
    isLoggedIn: () => ipcRenderer.invoke('auth:is-logged-in'),
  },
  products: {
    list: (filters?: any) => ipcRenderer.invoke('products:list', filters),
    create: (data: any) => ipcRenderer.invoke('products:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('products:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('products:delete', id),
    getLowStock: () => ipcRenderer.invoke('products:low-stock'),
    uploadImage: () => ipcRenderer.invoke('products:upload-image'),
  },
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    create: (data: any) => ipcRenderer.invoke('categories:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('categories:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('categories:delete', id),
  },
  orders: {
    create: (data: any) => ipcRenderer.invoke('orders:create', data),
    list: (filters?: any) => ipcRenderer.invoke('orders:list', filters),
    getById: (id: number) => ipcRenderer.invoke('orders:get-by-id', id),
    updateStatus: (id: number, status: string) =>
      ipcRenderer.invoke('orders:update-status', id, status),
    cancel: (id: number) => ipcRenderer.invoke('orders:cancel', id),
    getStats: (period?: string) => ipcRenderer.invoke('orders:stats', period),
    getTodaySales: () => ipcRenderer.invoke('orders:today-sales'),
    getTodayOrders: () => ipcRenderer.invoke('orders:today-orders'),
    getHourlySales: (period?: string) => ipcRenderer.invoke('orders:hourly-sales', period),
    getTopProducts: (period?: string) => ipcRenderer.invoke('orders:top-products', period),
    getCategorySales: (period?: string) => ipcRenderer.invoke('orders:category-sales', period),
    getPaymentMethodDistribution: (period?: string) =>
      ipcRenderer.invoke('orders:payment-method-dist', period),
    getEmployeeSales: (period?: string) => ipcRenderer.invoke('orders:employee-sales', period),
    exportCsv: (filters?: any) => ipcRenderer.invoke('orders:export-csv', filters),
    exportSin: (filters?: any) => ipcRenderer.invoke('orders:export-sin', filters),
    getPurgeCount: (beforeDate: string) => ipcRenderer.invoke('orders:purge-count', beforeDate),
    purge: (beforeDate: string) => ipcRenderer.invoke('orders:purge', beforeDate),
    getCustomerHistory: (customerName: string) => ipcRenderer.invoke('orders:customer-history', customerName),
  },
  users: {
    list: () => ipcRenderer.invoke('users:list'),
    create: (data: any) => ipcRenderer.invoke('users:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('users:update', id, data),
    toggleActive: (id: number) => ipcRenderer.invoke('users:toggle-active', id),
    resetPassword: (id: number, password: string) =>
      ipcRenderer.invoke('users:reset-password', id, password),
    delete: (id: number) => ipcRenderer.invoke('users:delete', id),
    updateAdmin: (id: number, data: any) => ipcRenderer.invoke('users:update-admin', id, data),
  },
  printer: {
    printTicket: (orderData: any) => ipcRenderer.invoke('printer:ticket', orderData),
    printCombined: (orderData: any) => ipcRenderer.invoke('printer:combined', orderData),
    getPrinters: () => ipcRenderer.invoke('printer:list'),
    test: () => ipcRenderer.invoke('printer:test'),
  },
  ai: {
    ask: (message: string) => ipcRenderer.invoke('ai:ask', message),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:get-all'),
  },
  shifts: {
    open: (data: { employeeId: number; openingAmount: number; notes?: string }) => ipcRenderer.invoke('shifts:open', data),
    close: (data: { id: number; closingAmount: number; notes?: string }) => ipcRenderer.invoke('shifts:close', data),
    current: () => ipcRenderer.invoke('shifts:current'),
    list: (dateFilter?: string) => ipcRenderer.invoke('shifts:list', dateFilter),
    check: () => ipcRenderer.invoke('shifts:check'),
  },
  app: {
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close'),
    exportDB: () => ipcRenderer.invoke('app:export-db'),
    importDB: () => ipcRenderer.invoke('app:import-db'),
    selectLogo: () => ipcRenderer.invoke('app:select-logo'),
    readFileBase64: (filePath: string) => ipcRenderer.invoke('app:read-file-base64', filePath),
    deleteAllData: (options?: any) => ipcRenderer.invoke('app:delete-all-data', options),
    checkActivation: () => ipcRenderer.invoke('app:check-activation'),
    activate: (key: string) => ipcRenderer.invoke('app:activate', key),
    notifyNoShift: () => ipcRenderer.invoke('app:notify-no-shift'),
  },
})
