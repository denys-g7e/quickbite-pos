import React, { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Plus, Edit2, Trash2, Grid3X3 } from 'lucide-react'

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', icon: 'Package', color: '#FF6B35' })

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    try {
      const cats = await window.api.categories.list()
      setCategories(cats)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', icon: 'Package', color: '#FF6B35' })
    setShowModal(true)
  }

  const openEdit = (cat: any) => {
    setEditing(cat)
    setForm({ name: cat.name, icon: cat.icon, color: cat.color })
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await window.api.categories.update(editing.id, form)
      } else {
        await window.api.categories.create(form)
      }
      setShowModal(false)
      loadCategories()
    } catch (err) {
      console.error('Error al guardar categoría:', err)
      alert('Error: ' + (err as any).message)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      await window.api.categories.delete(id)
      loadCategories()
    }
  }

  const testSave = async () => {
    const testName = 'TEST_' + Date.now()
    try {
      const result = await window.api.categories.create({ name: testName, icon: 'Package', color: '#FF0000' })
      alert('Creado ID: ' + result.id + '\nAhora consultando lista...')
      const all = await window.api.categories.list()
      alert('Total categorías ahora: ' + all.length + '\nIncluye TEST? ' + all.some((c: any) => c.name === testName))
      loadCategories()
    } catch (err: any) {
      alert('ERROR: ' + err.message)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-text-primary">Categorías</h1>
            <p className="text-body-sm text-text-muted">{categories.length} categorías</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={testSave} style={{fontSize:11}}>Test</Button>
            <Button onClick={openCreate}><Plus size={16} className="mr-1.5" />Nueva categoría</Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 text-center py-12 text-text-muted">Cargando...</div>
          ) : categories.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-text-muted">Sin categorías</div>
          ) : categories.map((cat) => (
            <Card key={cat.id} className="hover:border-border-light transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <Grid3X3 size={18} style={{ color: cat.color }} />
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">{cat.name}</p>
                    <p className="text-caption text-text-muted">{cat.product_count || 0} productos</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-status-error/10 text-text-muted hover:text-status-error">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-label text-text-muted">{cat.color}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar categoría' : 'Nueva categoría'} size="sm">
        <div className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Ícono (Lucide)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <div>
            <label className="block text-label font-medium text-text-secondary mb-1.5">Color</label>
            <div className="flex gap-3 items-center">
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-border-light" />
              <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1 bg-bg-tertiary border border-border-light rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-accent" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} className="flex-1">Guardar</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
