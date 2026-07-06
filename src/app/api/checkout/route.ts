import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkoutSchema } from '@/lib/schemas';
import { createWebpayTransaction } from '@/lib/webpay';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = await consumeRateLimit('checkout', ip);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const { items, customerName, customerEmail, customerPhone, shippingAddress, shippingLat, shippingLng } = parsed.data;

  // 1) Validar stock real contra la base de datos (nunca confiar en el precio/stock del cliente)
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, active: true } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: `Producto no disponible: ${item.productId}` }, { status: 409 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: `Sin stock suficiente para "${product.name}"` }, { status: 409 });
    }
  }

  const totalAmount = items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  const buyOrder = `MV-${Date.now()}-${Math.floor(Math.random() * 10000)}`.slice(0, 26);
  const sessionId = randomUUID();

  // 2) Crear orden en estado PENDING (el stock se descuenta solo tras confirmación real del pago)
  const order = await prisma.order.create({
    data: {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingLat,
      shippingLng,
      totalAmount,
      buyOrder,
      sessionId,
      status: 'PENDING',
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: productMap.get(item.productId)!.price,
        })),
      },
    },
  });

  // 3) Crear transacción en Webpay Plus
  const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webpay/return`;

  try {
    const wpResponse = await createWebpayTransaction({
      buyOrder,
      sessionId,
      amount: totalAmount,
      returnUrl,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { transactionToken: wpResponse.token },
    });

    return NextResponse.json({ token: wpResponse.token, url: wpResponse.url });
  } catch (err) {
    console.error('Error creando transacción Webpay:', err); // línea nueva
    await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
    return NextResponse.json({ error: 'No fue posible iniciar el pago. Intenta nuevamente.' }, { status: 502 });
  }
}
