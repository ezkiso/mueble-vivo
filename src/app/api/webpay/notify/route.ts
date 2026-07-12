// src/app/api/webpay/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statusWebpayTransaction } from '@/lib/webpay';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { logSecurityEvent } from '@/lib/bruteforce';
import { getSession } from '@/lib/auth';
import { settleOrderAsPaid } from '@/lib/orders';

async function reconcile(buyOrder: string | undefined, ip: string) {
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
        const { status: outcome } = await settleOrderAsPaid(order.id, String(status.authorization_code));
        await logSecurityEvent(
          outcome === 'OVERSOLD' ? 'ORDER_RECONCILED_OVERSOLD' : 'ORDER_RECONCILED_PAID',
          ip,
          `orden=${order.buyOrder}`,
        );
        results.push({ buyOrder: order.buyOrder, status: outcome });
      } else if (['FAILED', 'NULLIFIED', 'REVERSED'].includes(status.status)) {
        await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
        results.push({ buyOrder: order.buyOrder, status: 'FAILED' });
      }
    } catch {
      results.push({ buyOrder: order.buyOrder, status: 'ERROR_CONSULTA' });
    }
  }

  return results;
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    await logSecurityEvent('WEBPAY_NOTIFY_UNAUTHORIZED', ip);
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const limited = await consumeRateLimit('webpayNotify', ip);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  const results = await reconcile(undefined, ip);
  return NextResponse.json({ processed: results.length, results });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const session = await getSession();
  if (!session) {
    await logSecurityEvent('WEBPAY_NOTIFY_UNAUTHORIZED', ip);
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const limited = await consumeRateLimit('webpayNotify', ip);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const buyOrder = body?.buyOrder as string | undefined;

  const results = await reconcile(buyOrder, ip);
  return NextResponse.json({ processed: results.length, results });
}