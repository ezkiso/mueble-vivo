import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import AgregarAlCarrito from '@/components/AgregarAlCarrito';

async function getProducto(slug: string) {
  return prisma.product.findUnique({ where: { slug } });
}

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
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 grid sm:grid-cols-2 gap-8">
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="aspect-square bg-verde-claro rounded-xl overflow-hidden">
        {images[0] && <img src={images[0]} alt={producto.name} className="w-full h-full object-cover" />}
      </div>

      <div>
        <h1 className="font-titulo text-3xl text-tierra-oscuro mb-2">{producto.name}</h1>
        <p className="text-2xl text-verde font-semibold mb-4">{clp.format(producto.price)}</p>
        <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">{producto.description}</p>

        {producto.stock === 0 ? (
          <p className="text-red-500 font-semibold">Agotado</p>
        ) : (
          <AgregarAlCarrito
            product={{ id: producto.id, name: producto.name, price: producto.price, image: images[0] ?? null, stock: producto.stock }}
          />
        )}
      </div>
    </main>
  );
}