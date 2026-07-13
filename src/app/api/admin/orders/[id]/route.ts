// src/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { orderStatusSchema } from '@/lib/schemas';
import { validateCsrf } from '@/lib/csrf';
import { logSecurityEvent } from '@/lib/bruteforce';
import { settleOrderAsPaid } from '@/lib/orders';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!(await validateCsrf(req.headers.get('x-csrf-token')))) {
    return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const current = await prisma.order.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });

  if (parsed.data.status === 'PAID' && current.status !== 'PAID') {
    const settled = await settleOrderAsPaid(id, `MANUAL-ADMIN-${Date.now()}`);
    await logSecurityEvent('ORDER_STATUS_CHANGED_MANUAL_PAID', null, `orden=${current.buyOrder}`);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { name: true } } } } },
    });
    return NextResponse.json({ ...order, oversold: settled.status === 'OVERSOLD' });
  }

  if (parsed.data.status === 'OVERSOLD') {
    return NextResponse.json({ error: 'OVERSOLD es un estado automático, no se puede asignar manualmente' }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
  }).catch(() => null);

  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });

  await logSecurityEvent('ORDER_STATUS_CHANGED', null, `orden=${order.buyOrder} nuevo_estado=${parsed.data.status}`);

  return NextResponse.json(order);
}