import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statusWebpayTransaction } from '@/lib/webpay';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { logSecurityEvent } from '@/lib/bruteforce';

// Webpay Plus no emite un webhook asíncrono propio (a diferencia de otras pasarelas).
// Este endpoint cumple el mismo propósito de seguridad que pedía el requerimiento:
// una vía de confirmación que NO depende de que el navegador del cliente vuelva al
// return_url (por ejemplo, si cerró la pestaña tras pagar). Puede invocarse:
//   - manualmente desde el panel admin ("Verificar estado") para una orden puntual, o
//   - mediante un cron job (Vercel Cron, gratuito) que reconcilie órdenes PENDING antiguas.
// La actualización de estado es siempre idempotente y solo confía en la respuesta de
// `status()` consultada directamente a Transbank, nunca en datos enviados por el cliente.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = await consumeRateLimit('webpayNotify', ip);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const buyOrder = body?.buyOrder as string | undefined;

  const orders = buyOrder
    ? await prisma.order.findMany({ where: { buyOrder, status: 'PENDING' } })
    : await prisma.order.findMany({
        where: { status: 'PENDING', createdAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
        take: 20,
      });

  const results = [];

  for (const order of orders) {
    if (!order.transactionToken) continue;
    try {
      const status = await statusWebpayTransaction(order.transactionToken);

      if (status.status === 'AUTHORIZED' && status.response_code === 0) {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'PAID', transactionId: String(status.authorization_code) },
          });
          const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
            });
          }
        });
        await logSecurityEvent('ORDER_RECONCILED_PAID', ip, `orden=${order.buyOrder}`);
        results.push({ buyOrder: order.buyOrder, status: 'PAID' });
      } else if (['FAILED', 'NULLIFIED', 'REVERSED'].includes(status.status)) {
        await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
        results.push({ buyOrder: order.buyOrder, status: 'FAILED' });
      }
    } catch {
      results.push({ buyOrder: order.buyOrder, status: 'ERROR_CONSULTA' });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
