'use client';

import { useState } from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/store/cart';

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export default function CartDrawer() {
  const { items, isOpen, close, removeItem, updateQuantity, totalAmount } = useCart();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function irACheckout() {
    close();
    window.location.href = '/checkout';
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <aside className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-tierra-claro">
          <h2 className="font-titulo text-lg">Tu carrito</h2>
          <button onClick={close} aria-label="Cerrar carrito"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 && <p className="text-sm text-gray-500">Tu carrito está vacío.</p>}
          {items.map((item) => (
            <div key={item.productId} className="flex gap-3 items-center">
              <div className="w-16 h-16 bg-verde-claro rounded overflow-hidden shrink-0">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-sm text-verde">{clp.format(item.price)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1 border rounded"><Minus size={14} /></button>
                  <span className="text-sm w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1 border rounded"><Plus size={14} /></button>
                  <button onClick={() => removeItem(item.productId)} className="ml-auto text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-tierra-claro space-y-3">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{clp.format(totalAmount())}</span>
          </div>
          <button
            disabled={items.length === 0 || loading}
            onClick={irACheckout}
            className="w-full bg-verde text-white py-3 rounded-lg font-semibold disabled:opacity-50 transicion-suave hover:bg-verde/90"
          >
            Ir a pagar
          </button>
        </div>
      </aside>
    </div>
  );
}