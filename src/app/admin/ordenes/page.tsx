'use client';

import { useEffect, useState } from 'react';
import { useAdminSession } from '@/lib/useAdminSession';

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const estados = ['PENDING', 'PAID', 'SHIPPED', 'CANCELLED', 'FAILED'];

interface Orden {
  id: string; buyOrder: string; customerName: string; totalAmount: number; status: string;
  items: { quantity: number; product: { name: string } }[];
}

export default function AdminOrdenesPage() {
  const { csrfToken } = useAdminSession();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [filtro, setFiltro] = useState('');

  async function cargar() {
    const res = await fetch(`/api/admin/orders${filtro ? `?status=${filtro}` : ''}`);
    const data = await res.json();
    setOrdenes(data.items || []);
  }

  useEffect(() => { cargar(); }, [filtro]);

  async function cambiarEstado(id: string, status: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
      body: JSON.stringify({ status }),
    });
    cargar();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-titulo text-2xl text-tierra-oscuro mb-6">Órdenes</h1>

      <div className="flex gap-2 mb-4 text-sm">
        <button onClick={() => setFiltro('')} className={`px-3 py-1 rounded-full border ${!filtro ? 'bg-verde text-white' : ''}`}>Todas</button>
        {estados.map((e) => (
          <button key={e} onClick={() => setFiltro(e)} className={`px-3 py-1 rounded-full border ${filtro === e ? 'bg-verde text-white' : ''}`}>{e}</button>
        ))}
      </div>

      <div className="space-y-3">
        {ordenes.map((o) => (
          <div key={o.id} className="bg-white border border-tierra-claro rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold">{o.buyOrder}</span>
              <span>{o.customerName}</span>
              <span>{clp.format(o.totalAmount)}</span>
              <select value={o.status} onChange={(e) => cambiarEstado(o.id, e.target.value)} className="border rounded px-2 py-1">
                {estados.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <ul className="text-xs text-gray-500 list-disc pl-4">
              {o.items.map((i, idx) => <li key={idx}>{i.quantity}x {i.product.name}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
