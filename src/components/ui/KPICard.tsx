import React from 'react'
import { Card } from './Card'

interface KPICardProps {
  title: string
  value: string
  delta?: string
  deltaLabel?: string
  icon?: React.ReactNode
  positive?: boolean
}

export function KPICard({ title, value, delta, deltaLabel, icon, positive = true }: KPICardProps) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-caption text-text-muted font-medium">{title}</p>
          <p className="text-h3 font-bold text-text-primary">{value}</p>
          {delta && (
            <div className="flex items-center gap-1">
              <span className={`text-label font-medium ${positive ? 'text-status-success' : 'text-status-error'}`}>
                {positive ? '+' : ''}{delta}
              </span>
              {deltaLabel && <span className="text-label text-text-muted">{deltaLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center text-accent">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
