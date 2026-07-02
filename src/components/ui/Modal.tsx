import React from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`w-full ${sizes[size]} bg-bg-secondary rounded-2xl border border-border-light shadow-2xl transition-all ${isOpen ? 'scale-100' : 'scale-95'}`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
            <h3 className="text-title font-semibold text-text-primary">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
