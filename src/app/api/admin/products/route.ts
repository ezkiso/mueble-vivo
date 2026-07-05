import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/schemas';
import { validateCsrf } from '@/lib/csrf';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).slice(2, 7); // sufijo para unicidad
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ items: products });
}

export async function POST(req: NextRequest) {
  if (!validateCsrf(req.headers.get('x-csrf-token'))) {
    return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, slug: slugify(parsed.data.name) },
  });

  return NextResponse.json(product, { status: 201 });
}
