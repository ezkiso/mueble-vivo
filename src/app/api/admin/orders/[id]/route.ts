import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { orderStatusSchema } from '@/lib/schemas';
import { validateCsrf } from '@/lib/csrf';
import { logSecurityEvent } from '@/lib/bruteforce';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validateCsrf(req.headers.get('x-csrf-token'))) {
    return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  }).catch(() => null);

  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });

  await logSecurityEvent('ORDER_STATUS_CHANGED', null, `orden=${order.buyOrder} nuevo_estado=${parsed.data.status}`);

  return NextResponse.json(order);
}
