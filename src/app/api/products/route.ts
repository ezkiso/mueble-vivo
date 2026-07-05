import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paginationSchema } from '@/lib/schemas';

const sortMap = {
  recientes: { createdAt: 'desc' as const },
  precio_asc: { price: 'asc' as const },
  precio_desc: { price: 'desc' as const },
  mas_vendidos: { salesCount: 'desc' as const },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = paginationSchema.safeParse({
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  const { limit, offset, sort } = parsed.data;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: sortMap[sort],
      take: limit,
      skip: offset,
      select: {
        id: true, name: true, slug: true, price: true, stock: true,
        images: true, salesCount: true, createdAt: true,
      },
    }),
    prisma.product.count({ where: { active: true } }),
  ]);

  return NextResponse.json({ items, total, limit, offset });
}
