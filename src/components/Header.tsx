'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Leaf } from 'lucide-react';
import { useCart } from '@/store/cart';

export default function Header() {
  const totalItems = useCart((s) => s.totalItems());
  const openCart = useCart((s) => s.open);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-tierra-claro">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-titulo text-xl text-verde">
          <Leaf size={22} strokeWidth={2.2} />
          Mueble Vivo
        </Link>

        <nav className="hidden sm:flex items-center gap-6 font-cuerpo text-sm">
          <Link href="/" className="hover:text-verde transicion-suave">Inicio</Link>
          <Link href="/tienda" className="hover:text-verde transicion-suave">Tienda</Link>
          <Link
            href="/personalizados"
            className="bg-verde-claro text-verde border border-verde/30 px-3 py-1 rounded-full font-semibold hover:bg-verde hover:text-white transicion-suave"
          >
            🌿 Personalizados
          </Link>
          <Link href="/#contacto" className="hover:text-verde transicion-suave">Contacto</Link>
        </nav>

        <button
          onClick={openCart}
          aria-label="Abrir carrito"
          className="relative p-2 rounded-full hover:bg-verde-claro transicion-suave"
        >
          <ShoppingCart size={22} className="text-tierra-oscuro" />
          {montado && totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-verde text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}