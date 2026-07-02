import React, { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Search, Plus, Edit2, Trash2, Package, Image, X } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', price: 0, categoryId: 0,
    isActive: true, availableForDelivery: true, stock: -1, sku: '', imagePath: '',
  })

  useEffect(() => { loadData() }, [search])

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        window.api.products.list({ search: search || undefined }),
        window.api.categories.list(),
      ])
      setProducts(prods)
      setCategories(cats)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setImagePreview(null)
    setForm({ name: '', description: '', price: 0, categoryId: categories[0]?.id || 0, isActive: true, availableForDelivery: true, stock: -1, sku: '', imagePath: '' })
    setShowModal(true)
  }

  const openEdit = (product: any) => {
    setEditing(product)
    setImagePreview(product.image_path || null)
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      categoryId: product.category_id || 0,
      isActive: !!product.is_active,
      availableForDelivery: !!product.available_for_delivery,
      stock: product.stock,
      sku: product.sku || '',
      imagePath: product.image_path || '',
    })
    setShowModal(true)
  }

  const handleSelectImage = async () => {
    const path = await window.api.products.uploadImage()
    if (path) {
      setForm({ ...form, imagePath: path })
      setImagePreview(path)
    }
  }

  const handleSave = async () => {
    try {
      const data = { ...form }
      if (editing) {
        await window.api.products.update(editing.id, data)
      } else {
        await window.api.products.create(data)
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      console.error('Error al guardar producto:', err)
      alert('Error: ' + (err as any).message)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      await window.api.products.delete(id)
      loadData()
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-text-primary">Productos</h1>
            <p className="text-body-sm text-text-muted">{products.length} productos registrados</p>
          </div>
          <Button onClick={openCreate}><Plus size={16} className="mr-1.5" />Nuevo producto</Button>
        </div>

        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text" placeholder="Buscar productos..."
              className="w-full bg-bg-tertiary border border-border-light rounded-lg pl-9 pr-4 py-2.5 text-body-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left p-3 text-label text-text-muted font-medium">Producto</th>
                  <th className="text-left p-3 text-label text-text-muted font-medium">Categoría</th>
                  <th className="text-right p-3 text-label text-text-muted font-medium">Precio</th>
                  <th className="text-right p-3 text-label text-text-muted font-medium">Stock</th>
                  <th className="text-center p-3 text-label text-text-muted font-medium">Estado</th>
                  <th className="text-right p-3 text-label text-text-muted font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-text-muted">Cargando...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-text-muted">Sin productos</td></tr>
                ) : products.map((p) => (
                  <tr key={p.id} className="border-b border-border-subtle hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {p.image_path ? (
                          <img src={p.image_path} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center">
                            <Package size={14} className="text-text-muted" />
                          </div>
                        )}
                        <div>
                          <p className="text-body-sm font-medium text-text-primary">{p.name}</p>
                          {p.sku && <p className="text-label text-text-muted">SKU: {p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3"><span className="text-caption text-text-secondary">{p.category_name}</span></td>
                    <td className="p-3 text-right"><span className="text-body-sm font-medium text-accent">Bs. {p.price.toFixed(2)}</span></td>
                    <td className="p-3 text-right">
                      <span className={`text-body-sm font-medium ${p.stock >= 0 && p.stock <= 5 ? 'text-status-error' : 'text-text-primary'}`}>
                        {p.stock === -1 ? '∞' : p.stock}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={p.is_active ? 'success' : 'error'} size="sm">
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-status-error/10 text-text-muted hover:text-status-error transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar producto' : 'Nuevo producto'} size="md">
        <div className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="block text-label font-medium text-text-secondary mb-1.5">Imagen (opcional)</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-bg-secondary border border-border-subtle overflow-hidden flex items-center justify-center flex-shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <Image size={20} className="text-text-muted" />
                )}
              </div>
              <Button variant="secondary" onClick={handleSelectImage}>
                {imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
              </Button>
              {imagePreview && (
                <button
                  onClick={() => { setForm({ ...form, imagePath: '' }); setImagePreview(null) }}
                  className="p-1.5 rounded-lg hover:bg-status-error/10 text-text-muted hover:text-status-error transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-label font-medium text-text-secondary mb-1.5">Descripción</label>
            <textarea
              className="w-full bg-bg-tertiary border border-border-light rounded-lg px-3 py-2.5 text-body-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent"
              rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio (Bs.)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            <div>
              <label className="block text-label font-medium text-text-secondary mb-1.5">Categoría</label>
              <select
                className="w-full bg-bg-tertiary border border-border-light rounded-lg px-3 py-2.5 text-body-sm text-text-primary focus:outline-none focus:border-accent"
                value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: parseInt(e.target.value) })}
              >
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock (-1 = ilimitado)" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || -1 })} />
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-border-light bg-bg-tertiary text-accent focus:ring-accent" />
              <span className="text-caption text-text-secondary">Activo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.availableForDelivery} onChange={(e) => setForm({ ...form, availableForDelivery: e.target.checked })} className="rounded border-border-light bg-bg-tertiary text-accent focus:ring-accent" />
              <span className="text-caption text-text-secondary">Disponible delivery</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Descartar</Button>
            <Button onClick={handleSave} className="flex-1">Guardar</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
