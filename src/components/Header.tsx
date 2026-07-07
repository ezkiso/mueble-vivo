'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/store/cart';

export default function Header() {
  const totalItems = useCart((s) => s.totalItems());
  const openCart = useCart((s) => s.open);
  const [montado, setMontado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => setMontado(true), []);

  const linksNav = [
    { href: '/', label: 'Inicio' },
    { href: '/tienda', label: 'Tienda' },
    { href: '/personalizados', label: '🌿 Personalizados', destacado: true },
    { href: '/#contacto', label: 'Contacto' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-tierra-claro">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-titulo text-xl text-verde">
          <Image src="/images/logo.png" alt="Mueble Vivo" width={70} height={70} className="rounded-sm" />
            Mueble Vivo
        </Link>

        <nav className="hidden sm:flex items-center gap-6 font-cuerpo text-sm">
          {linksNav.map((l) =>
            l.destacado ? (
              <Link
                key={l.href}
                href={l.href}
                className="bg-verde-claro text-verde border border-verde/30 px-3 py-1 rounded-full font-semibold hover:bg-verde hover:text-white transicion-suave"
              >
                {l.label}
              </Link>
            ) : (
              <Link key={l.href} href={l.href} className="hover:text-verde transicion-suave">
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1">
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

          <button
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            className="sm:hidden p-2 rounded-full hover:bg-verde-claro transicion-suave"
          >
            {menuAbierto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuAbierto && (
        <nav className="sm:hidden border-t border-tierra-claro bg-white px-4 py-3 flex flex-col gap-1">
          {linksNav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuAbierto(false)}
              className={
                l.destacado
                  ? 'bg-verde-claro text-verde px-3 py-2 rounded-lg font-semibold'
                  : 'px-3 py-2 rounded-lg hover:bg-verde-claro transicion-suave'
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}