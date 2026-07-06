import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCsrf } from '@/lib/csrf';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    if (!validateCsrf(req.headers.get('x-csrf-token'))) {
        return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
    }

    await prisma.ejemploPersonalizado.delete({ where: { id: params.id } }).catch(() => null);
    return NextResponse.json({ ok: true });
}