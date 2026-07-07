import Link from 'next/link';
import Image from 'next/image';

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
  sold?: boolean;
}

export default function ProductCard({ product }: { product: ProductCardProps }) {
  const agotado = !product.sold && product.stock === 0;

  return (
    <div className="bg-white rounded-xl border border-tierra-claro overflow-hidden group relative">
      {product.sold && (
        <span className="absolute top-2 left-2 z-10 bg-tierra-oscuro text-white text-xs font-semibold px-2 py-1 rounded-full">
          Vendido
        </span>
      )}
      <Link href={`/producto/${product.slug}`}>
        <div className="aspect-square bg-verde-claro overflow-hidden relative">
          {product.images?.[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className={`object-contain group-hover:scale-105 transicion-suave ${product.sold ? 'opacity-70' : ''}`}
            />
          )}
        </div>
      </Link>
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{product.name}</h3>
        <p className="text-verde font-semibold">
          {clp.format(product.price)}
          {product.sold && <span className="text-tierra-oscuro text-xs font-semibold ml-2">Vendido</span>}
          {agotado && <span className="text-red-500 text-xs font-semibold ml-2">Agotado</span>}
        </p>
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