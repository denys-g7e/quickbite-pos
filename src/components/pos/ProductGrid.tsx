import React, { useState, useEffect } from 'react'
import { Search, Plus } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { useUIStore } from '../../store/uiStore'

export function ProductGrid() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)
  const [stockThreshold, setStockThreshold] = useState(10)
  const { addItem } = useCartStore()
  const { selectedCategory, setSelectedCategory, searchQuery, setSearchQuery } = useUIStore()

  useEffect(() => {
    window.api.settings.get('demo_mode').then((v) => setDemoMode(v === 'true')).catch(() => {})
    window.api.settings.get('stock_alert_threshold').then((v) => setStockThreshold(parseInt(v || '10', 10))).catch(() => {})
  }, [])

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [selectedCategory, searchQuery])

  const loadCategories = async () => {
    try {
      const cats = await window.api.categories.list()
      setCategories(cats)
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const prods = await window.api.products.list({
        categoryId: selectedCategory || undefined,
        search: searchQuery || undefined,
        activeOnly: true,
      })
      setProducts(prods)
    } catch (err) {
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {demoMode && (
        <div className="px-4 py-2 bg-status-warning/20 border-b border-status-warning/30 text-center text-caption font-semibold text-status-warning tracking-wider">
          ⚡ MODO DEMO ⚡
        </div>
      )}
      <div className="p-4 border-b border-border-subtle">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full bg-bg-tertiary border border-border-light rounded-lg pl-9 pr-4 py-2.5 text-body-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border-subtle">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap text-caption font-medium transition-all ${
            selectedCategory === null
              ? 'bg-accent text-white'
              : 'bg-bg-tertiary text-text-secondary hover:bg-white/10'
          }`}
        >
          Todos
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-caption font-medium transition-all flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-accent text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-white/10'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <p className="text-body">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {products.map((product: any) => (
              <button
                key={product.id}
                onClick={() => addItem({ id: product.id, name: product.name, price: product.price, categoryName: product.category_name })}
                className="bg-bg-tertiary border border-border-subtle rounded-xl p-4 text-left hover:border-accent/50 hover:bg-accent-muted/50 transition-all group"
              >
                <div className="w-full aspect-video bg-bg-secondary rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {product.image_path ? (
                    <img src={product.image_path} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg opacity-50"
                      style={{ backgroundColor: product.category_color || '#FF6B35' }}
                    />
                  )}
                </div>
                <div className="flex items-start justify-between mb-1">
                  <p className="text-body-sm font-medium text-text-primary line-clamp-2 flex-1">{product.name}</p>
                  {product.stock >= 0 && product.stock <= stockThreshold && (
                    <span className="ml-2 text-label px-1.5 py-0.5 rounded-full bg-status-warning/20 text-status-warning whitespace-nowrap">
                      Stock: {product.stock}
                    </span>
                  )}
                </div>
                <p className="text-caption text-text-muted mb-2">{product.category_name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-body font-bold text-accent">Bs. {product.price.toFixed(2)}</span>
                  <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent transition-colors">
                    <Plus size={14} className="text-accent group-hover:text-white transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
