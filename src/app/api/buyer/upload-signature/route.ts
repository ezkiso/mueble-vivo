// src/app/api/buyer/upload-signature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateCommentUploadSignature } from '@/lib/cloudinary';
import { validateCsrf } from '@/lib/csrf';
import { getBuyerSession } from '@/lib/buyerAuth';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    const session = await getBuyerSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    if (!(await validateCsrf(req.headers.get('x-csrf-token')))) {
        return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
    }

    const limited = await consumeRateLimit('buyerUpload', getClientIp(req));
    if (!limited.ok) {
        return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    return NextResponse.json(generateCommentUploadSignature());
}