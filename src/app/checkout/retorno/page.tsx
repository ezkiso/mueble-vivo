// src/app/checkout/retorno/page.tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import RetornoContenido from './RetornoContenido';

// Este campo sí lo renderiza Next.js dentro de <head> correctamente —
// a diferencia de un <meta> suelto en el body de un client component.
export const metadata: Metadata = {
  other: { referrer: 'no-referrer' },
};

export default function RetornoPage() {
  return (
    <Suspense fallback={<main className="max-w-lg mx-auto px-4 py-20 text-center">Cargando...</main>}>
      <RetornoContenido />
    </Suspense>
  );
}