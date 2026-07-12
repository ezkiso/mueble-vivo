// src/app/api/webpay/return/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { commitWebpayTransaction } from '@/lib/webpay';
import { logSecurityEvent } from '@/lib/bruteforce';
import { settleOrderAsPaid } from '@/lib/orders';

// Transbank redirige el retorno exitoso por GET con `token_ws` en el query string
// (desde la v1.1 de su API). El caso de pago abortado (`TBK_TOKEN`) puede llegar
// por POST, especialmente en el ambiente de integración. Soportamos ambos métodos
// con la misma lógica.

async function handleReturn(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  let tokenWs = searchParams.get('token_ws') ?? undefined;
  let tbkToken = searchParams.get('TBK_TOKEN') ?? undefined;

  // Si no vino por query string, puede venir como form-data (POST clásico)
  if (!tokenWs && !tbkToken && req.method === 'POST') {
    const formData = await req.formData().catch(() => null);
    tokenWs = formData?.get('token_ws')?.toString();
    tbkToken = formData?.get('TBK_TOKEN')?.toString();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (tbkToken && !tokenWs) {
    const order = await prisma.order.findFirst({ where: { transactionToken: tbkToken } });
    if (order && order.status === 'PENDING') {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    }
    return NextResponse.redirect(`${baseUrl}/checkout/retorno?estado=abandonado`);
  }

  if (!tokenWs) {
    return NextResponse.redirect(`${baseUrl}/checkout/retorno?estado=error`);
  }

  const order = await prisma.order.findFirst({ where: { transactionToken: tokenWs } });
  if (!order) {
    return NextResponse.redirect(`${baseUrl}/checkout/retorno?estado=error`);
  }

  if (order.status !== 'PENDING') {
    return NextResponse.redirect(`${baseUrl}/checkout/retorno?orden=${order.buyOrder}&estado=${order.status.toLowerCase()}`);
  }

  try {
    const result = await commitWebpayTransaction(tokenWs);

    if (result.status === 'AUTHORIZED' && result.response_code === 0) {
      const settled = await settleOrderAsPaid(order.id, String(result.authorization_code));
      const outcome = settled.status;
      const buyerCode = settled.buyerCode;

      if (buyerCode) {
        await prisma.buyerCredential.update({ where: { orderId: order.id }, data: { revealed: true } });
      }

      await logSecurityEvent(outcome === 'OVERSOLD' ? 'ORDER_OVERSOLD' : 'ORDER_PAID', null, `orden=${order.buyOrder}`);

      const estado = outcome === 'OVERSOLD' ? 'revision' : 'exito';
      const codigoParam = buyerCode ? `&codigo=${encodeURIComponent(buyerCode)}` : '';
      return NextResponse.redirect(`${baseUrl}/checkout/retorno?orden=${order.buyOrder}&estado=${estado}${codigoParam}`);
    }

    await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
    return NextResponse.redirect(`${baseUrl}/checkout/retorno?orden=${order.buyOrder}&estado=fallido`);
  } catch (err) {
    await logSecurityEvent('WEBPAY_COMMIT_ERROR', null, `orden=${order.buyOrder}`);
    return NextResponse.redirect(`${baseUrl}/checkout/retorno?orden=${order.buyOrder}&estado=error`);
  }
}

export async function GET(req: NextRequest) {
  return handleReturn(req);
}

export async function POST(req: NextRequest) {
  return handleReturn(req);
}