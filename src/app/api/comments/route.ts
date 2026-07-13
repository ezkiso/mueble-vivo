// src/app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { commentSchema } from '@/lib/schemas';
import { validateCsrf } from '@/lib/csrf';
import { getBuyerSession } from '@/lib/buyerAuth';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { maskBuyerName } from '@/lib/buyerToken';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId requerido' }, { status: 400 });

    const session = await getBuyerSession();

    const approved = await prisma.comment.findMany({
        where: { productId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { buyer: { select: { customerName: true } } },
    });

    let ownPending: typeof approved = [];
    if (session) {
        ownPending = await prisma.comment.findMany({
        where: { productId, buyerId: session.sub, status: { in: ['PENDING', 'REJECTED'] } },
        orderBy: { createdAt: 'desc' },
        include: { buyer: { select: { customerName: true } } },
        });
    }

    const format = (c: (typeof approved)[number]) => ({
        id: c.id,
        body: c.body,
        images: c.images,
        rating: c.rating,
        createdAt: c.createdAt,
        status: c.status,
        authorName: maskBuyerName(c.buyer.customerName),
        isMine: session ? c.buyerId === session.sub : false,
    });

    return NextResponse.json({
        items: [...ownPending.map(format), ...approved.map(format)],
    });
    }

    export async function POST(req: NextRequest) {
    const session = await getBuyerSession();
    if (!session) return NextResponse.json({ error: 'Debes verificar tu código de comprador' }, { status: 401 });

    if (!(await validateCsrf(req.headers.get('x-csrf-token')))) {
        return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
    }

    const limited = await consumeRateLimit('comment', getClientIp(req));
    if (!limited.ok) {
        return NextResponse.json({ error: 'Demasiados comentarios. Intenta más tarde.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const comment = await prisma.comment.create({
        data: {
        productId: parsed.data.productId,
        buyerId: session.sub,
        body: parsed.data.body.trim(),
        images: parsed.data.images,
        rating: parsed.data.rating ?? null,
        status: 'PENDING',
        },
    });

    return NextResponse.json({ ok: true, id: comment.id, status: comment.status }, { status: 201 });
}