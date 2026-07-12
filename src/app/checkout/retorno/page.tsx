// src/app/checkout/retorno/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/store/cart';

const mensajes: Record<string, { titulo: string; texto: string; color: string }> = {
  exito: { titulo: '¡Pago exitoso!', texto: 'Tu pedido fue confirmado. Te enviaremos un correo con los detalles.', color: 'text-verde' },
  revision: { titulo: 'Pago recibido', texto: 'Tu pago se procesó correctamente. Estamos verificando la disponibilidad y te contactaremos pronto.', color: 'text-verde' },
  fallido: { titulo: 'Pago rechazado', texto: 'La transacción no pudo completarse. Puedes intentarlo nuevamente.', color: 'text-red-600' },
  abandonado: { titulo: 'Pago no completado', texto: 'Cancelaste el proceso de pago.', color: 'text-tierra-oscuro' },
  error: { titulo: 'Ocurrió un error', texto: 'No pudimos verificar tu pago. Contáctanos si el problema persiste.', color: 'text-red-600' },
};

function RetornoContenido() {
  const searchParams = useSearchParams();
  const estado = searchParams.get('estado') || 'error';
  const orden = searchParams.get('orden');
  const codigo = searchParams.get('codigo');
  const clear = useCart((s) => s.clear);
  const info = mensajes[estado] || mensajes.error;
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (estado === 'exito' || estado === 'revision') clear();
  }, [estado, clear]);

  const copiarCodigo = async () => {
    if (!codigo) return;
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className={`font-titulo text-3xl mb-3 ${info.color}`}>{info.titulo}</h1>
      <p className="text-gray-600 mb-2">{info.texto}</p>
      {orden && <p className="text-sm text-gray-400 mb-6">N° de orden: {orden}</p>}

      {codigo && (
        <div className="bg-verde/10 border border-verde/30 rounded-lg p-5 mb-8 text-left">
          <p className="font-semibold text-tierra-oscuro mb-1">🔑 Tu código de comprador</p>
          <p className="text-sm text-gray-600 mb-3">
            Guárdalo — con este código puedes comentar y subir fotos del avance de tu terrario en cualquier producto de la tienda.
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-white border rounded px-3 py-2 text-sm flex-1 break-all">{codigo}</code>
            <button
              onClick={copiarCodigo}
              className="bg-verde text-white px-3 py-2 rounded text-sm font-semibold whitespace-nowrap"
            >
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      <Link href="/tienda" className="inline-block bg-verde text-white px-6 py-3 rounded-lg font-semibold">
        Volver a la tienda
      </Link>
    </main>
  );
}

export default function RetornoPage() {
  return (
    <>
      {/* Reduce el riesgo de que el código viaje en el header Referer hacia recursos externos */}
      <meta name="referrer" content="no-referrer" />
      <Suspense fallback={<main className="max-w-lg mx-auto px-4 py-20 text-center">Cargando...</main>}>
        <RetornoContenido />
      </Suspense>
    </>
  );
}