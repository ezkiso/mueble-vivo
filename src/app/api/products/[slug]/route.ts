// src/app/api/products/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true, description: true, price: true,
      stock: true, images: true, active: true,
    },
  });

  if (!product || !product.active) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json(product);
}