// src/app/producto/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Star } from 'lucide-react';
import GaleriaProducto from '@/components/GaleriaProducto';
import AgregarAlCarrito from '@/components/AgregarAlCarrito';
import ComentariosProducto from '@/components/ComentariosProducto';
import { maskBuyerName } from '@/lib/buyerToken';

async function getProducto(slug: string) {
  return prisma.product.findUnique({ where: { slug } });
}

async function getRatingStats(productId: string) {
  const result = await prisma.comment.aggregate({
    where: { productId, status: 'APPROVED', rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return { average: result._avg.rating, count: result._count.rating };
}

async function getTopReviews(productId: string) {
  return prisma.comment.findMany({
    where: { productId, status: 'APPROVED', rating: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { rating: true, body: true, createdAt: true, buyer: { select: { customerName: true } } },
  });
}

function toOgImage(url: string): string {
  return url.replace('/upload/', '/upload/w_1200,h_630,c_fill,g_auto/');
}

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const producto = await getProducto(id);
  if (!producto) return {};

  const images = Array.isArray(producto.images) ? (producto.images as string[]) : [];

  return {
    title: producto.name,
    description: producto.description.slice(0, 160),
    alternates: { canonical: `/producto/${producto.slug}` },
    openGraph: {
      title: producto.name,
      description: producto.description.slice(0, 160),
      images: images[0] ? [{ url: toOgImage(images[0]), width: 1200, height: 630 }] : [],
    },
  };
}

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await getProducto(id);
  if (!producto || !producto.active) notFound();

  const [ratingStats, topReviews] = await Promise.all([
    getRatingStats(producto.id),
    getTopReviews(producto.id),
  ]);

  const images = Array.isArray(producto.images) ? (producto.images as string[]) : [];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const jsonLd: Record<string, any> = {
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

  // Google exige que aggregateRating tenga al menos 1 reseña real detrás.
  if (ratingStats.count > 0 && ratingStats.average !== null) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingStats.average.toFixed(1),
      reviewCount: ratingStats.count,
    };
  }

  if (topReviews.length > 0) {
    jsonLd.review = topReviews.map((r) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.rating },
      author: { '@type': 'Person', name: maskBuyerName(r.buyer.customerName) },
      datePublished: r.createdAt.toISOString().slice(0, 10),
      ...(r.body ? { reviewBody: r.body } : {}),
    }));
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Tienda', item: `${baseUrl}/tienda` },
      { '@type': 'ListItem', position: 3, name: producto.name, item: `${baseUrl}/producto/${producto.slug}` },
    ],
  };

  const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="text-xs text-gray-400 mb-4">
        <a href="/" className="hover:underline">Inicio</a> / <a href="/tienda" className="hover:underline">Tienda</a> / <span className="text-tierra-oscuro">{producto.name}</span>
      </nav>

      <div className="grid sm:grid-cols-2 gap-8">
        <GaleriaProducto images={images} nombre={producto.name} />

        <div>
          <h1 className="font-titulo text-3xl text-tierra-oscuro mb-2">{producto.name}</h1>

          {ratingStats.count > 0 && ratingStats.average !== null && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
                    className={n <= Math.round(ratingStats.average!) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                  />
                ))}
              </span>
              <span className="text-sm text-gray-500">
                {ratingStats.average.toFixed(1)} ({ratingStats.count} {ratingStats.count === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>
          )}

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