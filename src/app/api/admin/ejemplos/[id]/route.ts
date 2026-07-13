// src/app/api/admin/ejemplos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCsrf } from '@/lib/csrf';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!(await validateCsrf(req.headers.get('x-csrf-token')))) {
        return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
    }

    try {
        await prisma.ejemploPersonalizado.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (err: any) {
        if (err?.code === 'P2025') {
        return NextResponse.json({ error: 'Ejemplo no encontrado' }, { status: 404 });
        }
        return NextResponse.json({ error: 'No se pudo eliminar el ejemplo' }, { status: 500 });
    }
    }