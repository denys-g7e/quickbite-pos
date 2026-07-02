import { create } from 'zustand'

interface CartItem {
  productId: number
  productName: string
  productPrice: number
  categoryName: string
  quantity: number
  subtotal: number
  notes?: string
}

interface CartState {
  items: CartItem[]
  customerName: string
  customerPhone: string
  customerNIT: string
  serviceType: 'mesa' | 'para_llevar' | 'delivery'
  tableNumber: number | null
  notes: string
  paymentMethod: 'efectivo' | 'tarjeta' | 'qr' | 'transferencia'
  amountPaid: number
  discount: number

  addItem: (product: { id: number; name: string; price: number; categoryName?: string }) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  updateNotes: (productId: number, notes: string) => void
  clearCart: () => void

  setCustomerName: (name: string) => void
  setCustomerPhone: (phone: string) => void
  setCustomerNIT: (nit: string) => void
  setServiceType: (type: 'mesa' | 'para_llevar' | 'delivery') => void
  setTableNumber: (num: number | null) => void
  setNotes: (notes: string) => void
  setPaymentMethod: (method: 'efectivo' | 'tarjeta' | 'qr' | 'transferencia') => void
  setAmountPaid: (amount: number) => void
  setDiscount: (discount: number) => void

  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  customerPhone: '',
  customerNIT: '',
  serviceType: 'mesa',
  tableNumber: null,
  notes: '',
  paymentMethod: 'efectivo',
  amountPaid: 0,
  discount: 0,

  addItem: (product) => {
    const { items } = get()
    const existing = items.find((i) => i.productId === product.id)
    if (existing) {
      set({
        items: items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.productPrice }
            : i
        ),
      })
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            productName: product.name,
            productPrice: product.price,
            categoryName: product.categoryName || '',
            quantity: 1,
            subtotal: product.price,
          },
        ],
      })
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) })
  },

  updateQuantity: (productId, quantity) => {
    if (quantity < 1) {
      get().removeItem(productId)
      return
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId
          ? { ...i, quantity, subtotal: quantity * i.productPrice }
          : i
      ),
    })
  },

  updateNotes: (productId, notes) => {
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, notes } : i
      ),
    })
  },

  clearCart: () => set({
    items: [],
    customerName: '',
    customerPhone: '',
    customerNIT: '',
    serviceType: 'mesa',
    tableNumber: null,
    notes: '',
    paymentMethod: 'efectivo',
    amountPaid: 0,
    discount: 0,
  }),

  setCustomerName: (name) => set({ customerName: name }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setCustomerNIT: (nit) => set({ customerNIT: nit }),
  setServiceType: (type) => set({ serviceType: type }),
  setTableNumber: (num) => set({ tableNumber: num }),
  setNotes: (notes) => set({ notes }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setAmountPaid: (amount) => set({ amountPaid: amount }),
  setDiscount: (discount) => set({ discount }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
  getTotal: () => {
    const subtotal = get().items.reduce((sum, i) => sum + i.subtotal, 0)
    return subtotal - get().discount
  },
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}))
