import React from 'react'
import { formatCurrency } from '../../lib/formatters'

interface TicketProps {
  orderNumber: string
  customerName: string
  customerNIT?: string | null
  tableNumber?: number | null
  items: Array<{ productName: string; quantity: number; subtotal: number }>
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  amountPaid: number
  change: number
}

export function Ticket({ orderNumber, customerName, customerNIT, tableNumber, items, subtotal, discount, total, paymentMethod, amountPaid, change }: TicketProps) {
  return (
    <div className="bg-white text-black p-4 font-mono text-xs max-w-[280px] mx-auto">
      <div className="text-center border-b border-black pb-2 mb-2">
        <p className="text-sm font-bold">QUICKBITE POS</p>
        <p>Av. Camacho 1234, La Paz</p>
        <p>Tel: 2-1234567</p>
      </div>
      <div className="mb-2 text-center">
        <p className="font-bold">Orden: {orderNumber}</p>
        <p>Cliente: {customerName}</p>
        {tableNumber && <p>Mesa: {tableNumber}</p>}
      </div>
      <div className="border-t border-b border-black py-1 mb-2">
        <div className="flex justify-between font-bold">
          <span>ITEM</span>
          <span>CANT PRECIO</span>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="flex-1 truncate">{item.productName}</span>
            <span>x{item.quantity} {formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-0.5">
        <div className="flex justify-between"><span>SUBTOTAL</span><span>{formatCurrency(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between"><span>DESCUENTO</span><span>-{formatCurrency(discount)}</span></div>}
        <div className="flex justify-between font-bold text-base border-t border-black pt-1"><span>TOTAL</span><span>{formatCurrency(total)}</span></div>
      </div>
      <div className="border-t border-black mt-2 pt-1">
        <p>PAGO: {paymentMethod.toUpperCase()}</p>
        <div className="flex justify-between"><span>RECIBIDO</span><span>{formatCurrency(amountPaid)}</span></div>
        <div className="flex justify-between"><span>CAMBIO</span><span>{formatCurrency(change)}</span></div>
      </div>
      <div className="text-center mt-3">
        <p>¡Gracias por su visita!</p>
      </div>
    </div>
  )
}
