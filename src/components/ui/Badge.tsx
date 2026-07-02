import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-bg-tertiary text-text-secondary border-border-light',
    success: 'bg-status-success/15 text-status-success border-status-success/25',
    warning: 'bg-status-warning/15 text-status-warning border-status-warning/25',
    error: 'bg-status-error/15 text-status-error border-status-error/25',
    info: 'bg-status-info/15 text-status-info border-status-info/25',
    accent: 'bg-accent-muted text-accent border-accent-border',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-label',
    md: 'px-2.5 py-1 text-caption',
  }

  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}
