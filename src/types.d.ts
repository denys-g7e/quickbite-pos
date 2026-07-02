interface AuthAPI {
  login: (creds: { email: string; password: string }) => Promise<{ id: number; name: string; email: string; role: string }>
  logout: () => Promise<boolean>
  createUser: (data: { name: string; email: string; password: string; role: string; pin?: string }) => Promise<{ id: number }>
  verifyPin: (pin: string) => Promise<{ id: number; name: string; email: string; role: string }>
  isLoggedIn: () => Promise<boolean>
}

interface ProductsAPI {
  list: (filters?: { categoryId?: number; search?: string; activeOnly?: boolean }) => Promise<any[]>
  create: (data: any) => Promise<{ id: number }>
  update: (id: number, data: any) => Promise<any>
  delete: (id: number) => Promise<any>
  getLowStock: () => Promise<any[]>
  uploadImage: () => Promise<string | null>
}

interface CategoriesAPI {
  list: () => Promise<any[]>
  create: (data: any) => Promise<{ id: number }>
  update: (id: number, data: any) => Promise<any>
  delete: (id: number) => Promise<any>
}

interface OrdersAPI {
  create: (data: any) => Promise<{ id: number; orderNumber: string }>
  list: (filters?: any) => Promise<any[]>
  getById: (id: number) => Promise<any>
  updateStatus: (id: number, status: string) => Promise<any>
  cancel: (id: number) => Promise<any>
  getStats: (period?: string) => Promise<any>
  getTodaySales: () => Promise<number>
  getTodayOrders: () => Promise<number>
  getHourlySales: (period?: string) => Promise<any[]>
  getTopProducts: (period?: string) => Promise<any[]>
  getCategorySales: (period?: string) => Promise<any[]>
  getPaymentMethodDistribution: (period?: string) => Promise<any[]>
  getEmployeeSales: (period?: string) => Promise<any[]>
  exportCsv: (filters?: any) => Promise<string>
  exportSin: (filters?: { dateFrom?: string; dateTo?: string }) => Promise<{ path: string; count: number }>
  getPurgeCount: (beforeDate: string) => Promise<number>
  purge: (beforeDate: string) => Promise<{ deleted: number }>
  getCustomerHistory: (customerName: string) => Promise<{ visit_count: number; last_visit: string }>
}

interface UsersAPI {
  list: () => Promise<any[]>
  create: (data: any) => Promise<any>
  update: (id: number, data: any) => Promise<any>
  toggleActive: (id: number) => Promise<any>
  resetPassword: (id: number, password: string) => Promise<any>
  delete: (id: number) => Promise<any>
  updateAdmin: (id: number, data: any) => Promise<any>
}

interface PrinterAPI {
  printTicket: (orderData: any) => Promise<any>
  printCombined: (orderData: any) => Promise<any>
  getPrinters: () => Promise<any[]>
  test: () => Promise<any>
}

interface AIAPI {
  ask: (message: string) => Promise<string>
}

interface SettingsAPI {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<void>
  getAll: () => Promise<Record<string, string>>
}

interface ShiftsAPI {
  open: (data: { employeeId: number; openingAmount: number; notes?: string }) => Promise<any>
  close: (data: { id: number; closingAmount: number; notes?: string }) => Promise<any>
  current: () => Promise<any>
  list: (dateFilter?: string) => Promise<any[]>
  check: () => Promise<boolean>
}

interface AppAPI {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  exportDB: () => Promise<boolean>
  importDB: () => Promise<boolean>
  selectLogo: () => Promise<string | null>
  readFileBase64: (filePath: string) => Promise<string | null>
  deleteAllData: (options?: { orders?: boolean; products?: boolean; categories?: boolean }) => Promise<boolean>
  checkActivation: () => Promise<boolean>
  activate: (key: string) => Promise<boolean>
  notifyNoShift: () => Promise<boolean>
}

interface Window {
  api: {
    auth: AuthAPI
    products: ProductsAPI
    categories: CategoriesAPI
    orders: OrdersAPI
    users: UsersAPI
    printer: PrinterAPI
    ai: AIAPI
    settings: SettingsAPI
    shifts: ShiftsAPI
    app: AppAPI
  }
}
