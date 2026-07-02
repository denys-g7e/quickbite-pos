import React from 'react'
import { Zap, Minus, Square, X } from 'lucide-react'

export function TitleBar() {
  return (
    <div className="flex items-center h-10 bg-bg-secondary border-b border-border-subtle px-4 select-none" style={{ WebkitAppRegion: 'drag' as any }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <span className="text-sm text-text-primary font-medium">QuickBite POS</span>
      </div>
      <div className="ml-auto flex gap-1" style={{ WebkitAppRegion: 'no-drag' as any }}>
        <button
          onClick={() => window.api.app.minimize()}
          className="w-8 h-8 hover:bg-white/10 rounded flex items-center justify-center transition-colors"
        >
          <Minus size={14} className="text-text-muted" />
        </button>
        <button
          onClick={() => window.api.app.maximize()}
          className="w-8 h-8 hover:bg-white/10 rounded flex items-center justify-center transition-colors"
        >
          <Square size={12} className="text-text-muted" />
        </button>
        <button
          onClick={() => window.api.app.close()}
          className="w-8 h-8 hover:bg-red-500/20 rounded flex items-center justify-center transition-colors"
        >
          <X size={14} className="text-text-muted hover:text-red-400" />
        </button>
      </div>
    </div>
  )
}
