import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = { sm: 'p-3', md: 'p-4', lg: 'p-6' }
  return (
    <div className={`bg-bg-tertiary rounded-xl border border-border-subtle ${paddings[padding]} ${className}`}>
      {children}
    </div>
  )
}
