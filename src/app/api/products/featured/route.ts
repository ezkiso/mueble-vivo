import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Lógica de destacados (backend, nunca manual):
// - Si existen productos con salesCount > 0 -> los 5 más vendidos.
// - Si no hay ventas registradas aún -> los 5 más recientes.
export async function GET() {
  const hasSales = await prisma.product.findFirst({
    where: { active: true, salesCount: { gt: 0 } },
    select: { id: true },
  });

  const items = await prisma.product.findMany({
    where: { active: true },
    orderBy: hasSales ? { salesCount: 'desc' } : { createdAt: 'desc' },
    take: 5,
    select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
  });

  return NextResponse.json({ items, criterio: hasSales ? 'mas_vendidos' : 'recientes' });
}
