import { prisma } from '@/lib/prisma';
import CarruselDestacados from '@/components/CarruselDestacados';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60; // ISR: recalcula destacados/recientes cada 60s

async function getDestacados() {
  const hasSales = await prisma.product.findFirst({ where: { active: true, salesCount: { gt: 0 } } });
  return prisma.product.findMany({
    where: { active: true },
    orderBy: hasSales ? { salesCount: 'desc' } : { createdAt: 'desc' },
    take: 5,
    select: { id: true, name: true, slug: true, price: true, images: true },
  });
}

async function getRecientes() {
  return prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
  });
}

export default async function Home() {
  const [destacados, recientes] = await Promise.all([getDestacados(), getRecientes()]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-14">
      <section>
        <h1 className="font-titulo text-3xl mb-4 text-tierra-oscuro">Productos destacados</h1>
        <CarruselDestacados productos={destacados as any} />
      </section>

      <section>
        <h2 className="font-titulo text-2xl mb-4 text-tierra-oscuro">Últimos productos publicados</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {recientes.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      </section>
    </main>
  );
}