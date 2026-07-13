// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/schemas';
import { validateCsrf } from '@/lib/csrf';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validateCsrf(req.headers.get('x-csrf-token'))) {
    return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: parsed.data,
  }).catch(() => null);

  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validateCsrf(req.headers.get('x-csrf-token'))) {
    return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
  }

  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // P2025 = registro no encontrado (ya estaba borrado o el id no existe)
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    // P2003 = violación de foreign key (tiene órdenes o comentarios asociados)
    if (err?.code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar: este producto tiene órdenes o comentarios asociados. Márcalo como inactivo en vez de eliminarlo.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'No se pudo eliminar el producto' }, { status: 500 });
  }
}