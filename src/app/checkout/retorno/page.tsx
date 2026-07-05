'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/store/cart';

const mensajes: Record<string, { titulo: string; texto: string; color: string }> = {
  exito: { titulo: '¡Pago exitoso!', texto: 'Tu pedido fue confirmado. Te enviaremos un correo con los detalles.', color: 'text-verde' },
  fallido: { titulo: 'Pago rechazado', texto: 'La transacción no pudo completarse. Puedes intentarlo nuevamente.', color: 'text-red-600' },
  abandonado: { titulo: 'Pago no completado', texto: 'Cancelaste el proceso de pago.', color: 'text-tierra-oscuro' },
  error: { titulo: 'Ocurrió un error', texto: 'No pudimos verificar tu pago. Contáctanos si el problema persiste.', color: 'text-red-600' },
};

export default function RetornoPage() {
  const searchParams = useSearchParams();
  const estado = searchParams.get('estado') || 'error';
  const orden = searchParams.get('orden');
  const clear = useCart((s) => s.clear);
  const info = mensajes[estado] || mensajes.error;

  useEffect(() => {
    if (estado === 'exito') clear(); // el carrito solo se vacía tras confirmación real del backend
  }, [estado, clear]);

  return (
    <main className="max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className={`font-titulo text-3xl mb-3 ${info.color}`}>{info.titulo}</h1>
      <p className="text-gray-600 mb-2">{info.texto}</p>
      {orden && <p className="text-sm text-gray-400 mb-8">N° de orden: {orden}</p>}
      <Link href="/tienda" className="inline-block bg-verde text-white px-6 py-3 rounded-lg font-semibold">
        Volver a la tienda
      </Link>
    </main>
  );
}
