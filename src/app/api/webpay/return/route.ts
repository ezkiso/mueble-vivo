// src/app/api/webpay/return/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { commitWebpayTransaction } from '@/lib/webpay';
import { logSecurityEvent } from '@/lib/bruteforce';
import { settleOrderAsPaid } from '@/lib/orders';

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const tokenWs = formData?.get('token_ws')?.toString();
  const tbkToken = formData?.get('TBK_TOKEN')?.toString();

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