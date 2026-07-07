import Link from 'next/link';
import Image from 'next/image';

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export default function ProductCard({ product }: { product: { id: string; name: string; slug: string; price: number; images: string[]; stock: number } }) {
  return (
    <div className="bg-white rounded-xl border border-tierra-claro overflow-hidden group">
      <Link href={`/producto/${product.slug}`}>
        <div className="aspect-square bg-verde-claro overflow-hidden relative">
          {product.images?.[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-contain group-hover:scale-105 transicion-suave"
            />
          )}
        </div>
      </Link>
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{product.name}</h3>
        <p className="text-verde font-semibold">{clp.format(product.price)}</p>
        {product.stock === 0 && <p className="text-xs text-red-500 mt-1">Agotado</p>}
        <Link
          href={`/producto/${product.slug}`}
          className="mt-2 inline-block text-sm text-tierra-oscuro underline hover:text-verde transicion-suave"
        >
          Ver más
        </Link>
      </div>
    </div>
  );
}