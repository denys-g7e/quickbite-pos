import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-label font-medium text-text-secondary mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</div>
        )}
        <input
          className={`w-full bg-bg-tertiary border ${error ? 'border-status-error/50' : 'border-border-light'} rounded-lg px-3 py-2.5 text-body-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-label text-status-error">{error}</p>}
    </div>
  )
}
