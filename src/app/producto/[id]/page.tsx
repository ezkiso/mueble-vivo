// src/app/producto/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import GaleriaProducto from '@/components/GaleriaProducto';
import AgregarAlCarrito from '@/components/AgregarAlCarrito';
import ComentariosProducto from '@/components/ComentariosProducto';

async function getProducto(slug: string) {
  return prisma.product.findUnique({ where: { slug } });
}

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const producto = await getProducto(params.id);
  if (!producto) return {};

  return {
    title: producto.name,
    description: producto.description.slice(0, 160),
    alternates: { canonical: `/producto/${producto.slug}` },
    openGraph: {
      title: producto.name,
      description: producto.description.slice(0, 160),
      images: Array.isArray(producto.images) ? (producto.images as string[]) : [],
    },
  };
}

export default async function ProductoPage({ params }: { params: { id: string } }) {
  const producto = await getProducto(params.id);
  if (!producto || !producto.active) notFound();

  const images = Array.isArray(producto.images) ? (producto.images as string[]) : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.name,
    description: producto.description,
    image: images,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CLP',
      price: producto.price,
      availability: producto.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid sm:grid-cols-2 gap-8">
        <GaleriaProducto images={images} nombre={producto.name} />

        <div>
          <h1 className="font-titulo text-3xl text-tierra-oscuro mb-2">{producto.name}</h1>
          <p className="text-2xl text-verde font-semibold mb-4">
            {clp.format(producto.price)}
            {producto.sold && (
              <span className="text-tierra-oscuro text-base font-semibold ml-3">Vendido</span>
            )}
            {!producto.sold && producto.stock === 0 && (
              <span className="text-red-500 text-base font-semibold ml-3">Agotado</span>
            )}
          </p>
          <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">{producto.description}</p>

          {producto.sold ? (
            <div className="bg-tierra-claro/40 border border-tierra-claro rounded-lg p-4">
              <p className="text-tierra-oscuro font-semibold mb-1">🌿 Este terrario ya fue vendido</p>
              <p className="text-sm text-gray-600">Lo dejamos aquí como ejemplo de nuestro trabajo. ¿Quieres uno similar? Contáctanos.</p>
            </div>
          ) : producto.stock === 0 ? null : (
            <AgregarAlCarrito
              product={{ id: producto.id, name: producto.name, price: producto.price, image: images[0] ?? null, stock: producto.stock }}
            />
          )}
        </div>
      </div>

      <ComentariosProducto productId={producto.id} />
    </main>
  );
}