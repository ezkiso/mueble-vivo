'use client';

import { useState } from 'react';
import { useCart } from '@/store/cart';

interface Props {
  product: { id: string; name: string; price: number; image: string | null; stock: number };
}

export default function AgregarAlCarrito({ product }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const addItem = useCart((s) => s.addItem);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border border-tierra-claro rounded-lg">
        <button onClick={() => setCantidad((c) => Math.max(1, c - 1))} className="px-3 py-2">−</button>
        <span className="px-3">{cantidad}</span>
        <button onClick={() => setCantidad((c) => Math.min(product.stock, c + 1))} className="px-3 py-2">+</button>
      </div>
      <button
        onClick={() =>
          addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock }, cantidad)
        }
        className="flex-1 bg-verde text-white py-2.5 rounded-lg font-semibold hover:bg-verde/90 transicion-suave"
      >
        Agregar al carrito
      </button>
    </div>
  );
}
