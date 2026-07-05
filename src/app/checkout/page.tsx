'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useCart } from '@/store/cart';
import { CODIGOS_PAIS } from '@/lib/countryCodes';

// Leaflet usa `window`/`document`, no puede renderizar en el servidor.
const MapaDireccion = dynamic(() => import('@/components/MapaDireccion'), { ssr: false });

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export default function CheckoutPage() {
  const { items, totalAmount } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [codigoPais, setCodigoPais] = useState('+56');
  const [numeroLocal, setNumeroLocal] = useState('');

  const [direccion, setDireccion] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [mostrarMapa, setMostrarMapa] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!numeroLocal.trim()) {
      setError('El teléfono es obligatorio.');
      return;
    }
    if (!direccion) {
      setError('Selecciona tu dirección de envío en el mapa.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone: `${codigoPais}${numeroLocal.replace(/\D/g, '')}`,
          shippingAddress: direccion.address,
          shippingLat: direccion.lat,
          shippingLng: direccion.lng,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No fue posible procesar tu pedido.');
        setLoading(false);
        return;
      }

      // Redirección al formulario de Webpay Plus mediante POST autogenerado (requisito de Transbank)
      const formEl = document.createElement('form');
      formEl.method = 'POST';
      formEl.action = data.url;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'token_ws';
      input.value = data.token;
      formEl.appendChild(input);
      document.body.appendChild(formEl);
      formEl.submit();
      // El carrito se vacía solo tras confirmación real (ver /checkout/retorno)
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <main className="max-w-2xl mx-auto px-4 py-16 text-center">Tu carrito está vacío.</main>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-titulo text-2xl text-tierra-oscuro mb-6">Finalizar compra</h1>

      <div className="bg-white border border-tierra-claro rounded-lg p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-600">Resumen del pedido</h2>
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3">
            <div className="w-14 h-14 bg-verde-claro rounded overflow-hidden shrink-0">
              {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-verde shrink-0">{clp.format(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="bg-verde-claro rounded-lg p-4 mb-6">
        <p className="font-semibold">Total a pagar: {clp.format(totalAmount())}</p>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={pagar} className="space-y-4">
        <input required placeholder="Nombre completo" value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full border border-tierra-claro rounded-lg px-4 py-2.5" />

        <input required type="email" placeholder="Correo electrónico" value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="w-full border border-tierra-claro rounded-lg px-4 py-2.5" />

        <div>
          <label className="text-sm text-gray-600 mb-1 block">Teléfono (obligatorio)</label>
          <div className="flex gap-2">
            <select value={codigoPais} onChange={(e) => setCodigoPais(e.target.value)}
              className="border border-tierra-claro rounded-lg px-2 py-2.5 w-32">
              {CODIGOS_PAIS.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <input required type="tel" placeholder="912345678" value={numeroLocal}
              onChange={(e) => setNumeroLocal(e.target.value)}
              className="flex-1 border border-tierra-claro rounded-lg px-4 py-2.5" />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-1 block">Dirección de envío (obligatoria)</label>

          {!direccion && !mostrarMapa && (
            <button type="button" onClick={() => setMostrarMapa(true)}
              className="w-full border border-dashed border-tierra-claro rounded-lg py-3 text-sm text-gray-500 hover:border-verde hover:text-verde transicion-suave">
              📍 Seleccionar dirección en el mapa
            </button>
          )}

          {mostrarMapa && !direccion && (
            <MapaDireccion
              onConfirmar={(data) => {
                setDireccion(data);
                setMostrarMapa(false);
              }}
            />
          )}

          {direccion && (
            <div className="flex items-start justify-between gap-3 bg-verde-claro rounded-lg p-3">
              <p className="text-sm">📍 {direccion.address}</p>
              <button type="button" onClick={() => { setDireccion(null); setMostrarMapa(true); }}
                className="text-sm underline shrink-0">Cambiar</button>
            </div>
          )}
        </div>

        <button disabled={loading} type="submit"
          className="w-full bg-verde text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:bg-verde/90 transicion-suave">
          {loading ? 'Redirigiendo a Webpay...' : 'Pagar con Webpay Plus'}
        </button>
      </form>
    </main>
  );
}