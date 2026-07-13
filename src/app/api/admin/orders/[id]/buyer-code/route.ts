// src/app/api/admin/orders/[id]/buyer-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decryptBuyerToken } from '@/lib/buyerToken';
import { logSecurityEvent } from '@/lib/bruteforce';
import { getClientIp } from '@/lib/rateLimit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const credential = await prisma.buyerCredential.findUnique({ where: { orderId: id } });
    if (!credential) return NextResponse.json({ error: 'Esta orden no tiene código generado' }, { status: 404 });

    const code = decryptBuyerToken(credential.tokenEncrypted);

    await prisma.buyerCredential.update({ where: { id: credential.id }, data: { revealed: true } });
    await logSecurityEvent('BUYER_CODE_REVEALED_BY_ADMIN', getClientIp(req), `orden=${id}`);

    return NextResponse.json({ code, customerName: credential.customerName });
}