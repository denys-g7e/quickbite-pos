import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  showOrderModal: boolean
  showPaymentModal: boolean
  selectedCategory: number | null
  searchQuery: string

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setShowOrderModal: (show: boolean) => void
  setShowPaymentModal: (show: boolean) => void
  setSelectedCategory: (id: number | null) => void
  setSearchQuery: (query: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  showOrderModal: false,
  showPaymentModal: false,
  selectedCategory: null,
  searchQuery: '',

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setShowOrderModal: (show) => set({ showOrderModal: show }),
  setShowPaymentModal: (show) => set({ showPaymentModal: show }),
  setSelectedCategory: (id) => set({ selectedCategory: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
