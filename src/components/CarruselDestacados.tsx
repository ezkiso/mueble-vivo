'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Producto {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export default function CarruselDestacados({ productos }: { productos: Producto[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (productos.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % productos.length), 5000);
    return () => clearInterval(timer);
  }, [productos.length]);

  if (productos.length === 0) return null;
  const actual = productos[index];

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-verde-claro">
      <Link href={`/producto/${actual.slug}`} className="block w-full h-full">
        {actual.images?.[0] && (
          <img src={actual.images[0]} alt={actual.name} className="w-full h-full object-cover transicion-suave" />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
          <h3 className="font-titulo text-2xl">{actual.name}</h3>
          <p className="text-lg">{clp.format(actual.price)}</p>
        </div>
      </Link>
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {productos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2.5 h-2.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
