export function formatCurrency(amount: number, symbol: string = 'Bs.'): string {
  return `${symbol} ${amount.toFixed(2)}`
}

export function formatNumber(num: number): string {
  return num.toLocaleString('es-BO')
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export function validateNIT(nit: string): { valid: boolean; error?: string } {
  const trimmed = nit.trim()
  if (!trimmed || trimmed === '0') return { valid: true }

  const digits = trimmed.replace(/\D/g, '')
  const withHyphen = /^\d{1,2}-\d{6,7}$/.test(trimmed)
  const digitsOnly = /^\d{7,15}$/.test(trimmed)

  if (!withHyphen && !digitsOnly) {
    return { valid: false, error: 'Formato inválido. Use 1234567-1 o 12345678 (8 dígitos)' }
  }
  if (digits.length < 7 || digits.length > 15) {
    return { valid: false, error: 'El NIT debe tener entre 7 y 15 dígitos' }
  }
  return { valid: true }
}

export function getServiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    mesa: 'Mesa',
    para_llevar: 'Para llevar',
    delivery: 'Delivery',
  }
  return labels[type] || type
}

export function getServiceTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    mesa: '🪑',
    para_llevar: '🛍',
    delivery: '🛵',
  }
  return icons[type] || ''
}
