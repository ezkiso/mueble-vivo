// src/app/api/webpay/return/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { commitWebpayTransaction } from '@/lib/webpay';
import { logSecurityEvent } from '@/lib/bruteforce';
import { settleOrderAsPaid } from '@/app/api/webpay/notify/route';

// IMPORTANTE sobre el flujo real de Webpay Plus:
// Transbank NO llama a un webhook independiente para este producto. El único punto
// de confirmación es este mismo endpoint de retorno, al que Transbank redirige al
// cliente vía POST con `token_ws` (pago exitoso/rechazado) o `TBK_TOKEN` (abandono).
// Por eso NUNCA se confía en los parámetros de la URL: se llama a `commit()` (server-to-server)
// y solo la respuesta AUTORITATIVA de Transbank determina el estado final de la orden.
// La actualización es idempotente: si la orden ya no está PENDING, no se vuelve a procesar.
export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const tokenWs = formData?.get('token_ws')?.toString();
  const tbkToken = formData?.get('TBK_TOKEN')?.toString(); // usuario abandonó el pago

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

  // Idempotencia: si ya fue procesada, no se vuelve a confirmar ni a descontar stock.
  if (order.status !== 'PENDING') {
    return NextResponse.redirect(`${baseUrl}/checkout/retorno?orden=${order.buyOrder}&estado=${order.status.toLowerCase()}`);
  }

  try {
    const result = await commitWebpayTransaction(tokenWs);

    if (result.status === 'AUTHORIZED' && result.response_code === 0) {
      const outcome = await settleOrderAsPaid(order.id, String(result.authorization_code));

      await logSecurityEvent(
        outcome === 'OVERSOLD' ? 'ORDER_OVERSOLD' : 'ORDER_PAID',
        null,
        `orden=${order.buyOrder}`,
      );

      const estado = outcome === 'OVERSOLD' ? 'revision' : 'exito';
      return NextResponse.redirect(`${baseUrl}/checkout/retorno?orden=${order.buyOrder}&estado=${estado}`);
    }

    await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
    return NextResponse.redirect(`${baseUrl}/checkout/retorno?orden=${order.buyOrder}&estado=fallido`);
  } catch (err) {
    await logSecurityEvent('WEBPAY_COMMIT_ERROR', null, `orden=${order.buyOrder}`);
    return NextResponse.redirect(`${baseUrl}/checkout/retorno?orden=${order.buyOrder}&estado=error`);
  }
}