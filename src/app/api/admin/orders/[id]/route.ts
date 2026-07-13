// src/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { orderStatusSchema } from '@/lib/schemas';
import { validateCsrf } from '@/lib/csrf';
import { logSecurityEvent } from '@/lib/bruteforce';
import { settleOrderAsPaid } from '@/lib/orders';

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

  const current = await prisma.order.findUnique({ where: { id: params.id } });
  if (!current) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });

  // Si se está marcando manualmente como PAID (ej. pago recibido fuera de Webpay),
  // se reutiliza la misma lógica segura de descuento de stock + emisión de código
  // de comprador que usa el flujo automático — nunca un update plano a PAID.
  if (parsed.data.status === 'PAID' && current.status !== 'PAID') {
    const settled = await settleOrderAsPaid(params.id, `MANUAL-ADMIN-${Date.now()}`);
    await logSecurityEvent('ORDER_STATUS_CHANGED_MANUAL_PAID', null, `orden=${current.buyOrder}`);
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: { include: { product: { select: { name: true } } } } },
    });
    return NextResponse.json({ ...order, oversold: settled.status === 'OVERSOLD' });
  }

  // No permitir setear OVERSOLD a mano — ese estado solo lo determina el sistema
  // al comparar stock disponible en el momento del pago.
  if (parsed.data.status === 'OVERSOLD') {
    return NextResponse.json({ error: 'OVERSOLD es un estado automático, no se puede asignar manualmente' }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  }).catch(() => null);

  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });

  await logSecurityEvent('ORDER_STATUS_CHANGED', null, `orden=${order.buyOrder} nuevo_estado=${parsed.data.status}`);

  return NextResponse.json(order);
}