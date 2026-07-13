// src/app/api/buyer/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buyerVerifySchema } from '@/lib/schemas';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { hashBuyerToken, maskBuyerName } from '@/lib/buyerToken';
import { createBuyerSessionToken, setBuyerSessionCookie } from '@/lib/buyerAuth';
import { issueCsrfToken } from '@/lib/csrf';
import { logSecurityEvent } from '@/lib/bruteforce';

export async function POST(req: NextRequest) {
    const ip = getClientIp(req);

    const limited = await consumeRateLimit('buyerVerify', ip);
    if (!limited.ok) {
        return NextResponse.json({ error: 'Demasiados intentos. Intenta más tarde.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const parsed = buyerVerifySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    const code = parsed.data.code.trim();
    const credential = await prisma.buyerCredential.findUnique({ where: { tokenHash: hashBuyerToken(code) } });

    if (!credential || credential.revoked) {
        await logSecurityEvent('BUYER_VERIFY_FAILED', ip);
        return NextResponse.json({ error: 'Código inválido' }, { status: 401 });
    }

    const displayName = maskBuyerName(credential.customerName);
    const token = await createBuyerSessionToken({ sub: credential.id, name: displayName });
    await setBuyerSessionCookie(token);
    const csrfToken = await issueCsrfToken();

    if (!credential.revealed) {
        await prisma.buyerCredential.update({ where: { id: credential.id }, data: { revealed: true } });
    }

    await logSecurityEvent('BUYER_VERIFY_SUCCESS', ip, `buyer=${credential.id}`);
    return NextResponse.json({ ok: true, name: displayName, csrfToken });
}