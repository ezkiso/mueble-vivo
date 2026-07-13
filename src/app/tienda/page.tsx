// src/app/tienda/page.tsx
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

const sortMap: Record<string, any> = {
  recientes: { createdAt: 'desc' },
  precio_asc: { price: 'asc' },
  precio_desc: { price: 'desc' },
  mas_vendidos: { salesCount: 'desc' },
};

export const metadata = { title: 'Tienda' };
export const revalidate = 60;

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  const sort = sortMap[resolvedSearchParams.sort || 'recientes'] ? resolvedSearchParams.sort! : 'recientes';
  const page = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10) || 1);
  const perPage = 12;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: sortMap[sort],
      take: perPage,
      skip: (page - 1) * perPage,
      select: { id: true, name: true, slug: true, price: true, images: true, stock: true, sold: true },
    }),
    prisma.product.count({ where: { active: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const opciones = [
    { value: 'recientes', label: 'Novedades' },
    { value: 'precio_asc', label: 'Precio: menor a mayor' },
    { value: 'precio_desc', label: 'Precio: mayor a menor' },
    { value: 'mas_vendidos', label: 'Más vendidos' },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-titulo text-2xl text-tierra-oscuro">Tienda</h1>
        <div className="flex gap-2 text-sm">
          {opciones.map((o) => (
            <Link
              key={o.value}
              href={`/tienda?sort=${o.value}`}
              className={`px-3 py-1.5 rounded-full border ${sort === o.value ? 'bg-verde text-white border-verde' : 'border-tierra-claro'}`}
            >
              {o.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => <ProductCard key={p.id} product={p as any} />)}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={`/tienda?sort=${sort}&page=${i + 1}`}
              className={`w-9 h-9 flex items-center justify-center rounded-full border ${page === i + 1 ? 'bg-verde text-white border-verde' : 'border-tierra-claro'}`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}