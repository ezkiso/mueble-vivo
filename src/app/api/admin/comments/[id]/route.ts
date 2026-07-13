// src/app/api/admin/comments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { commentModerationSchema } from '@/lib/schemas';
import { validateCsrf } from '@/lib/csrf';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!(await validateCsrf(req.headers.get('x-csrf-token')))) {
        return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = commentModerationSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const comment = await prisma.comment.update({
        where: { id },
        data: { status: parsed.data.status },
    });

    return NextResponse.json(comment);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Antes esta ruta no validaba CSRF — se corrige de paso, es una acción destructiva.
    if (!(await validateCsrf(req.headers.get('x-csrf-token')))) {
        return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}