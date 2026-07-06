import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { validateCsrf } from '@/lib/csrf';

const ejemploSchema = z.object({
    imageUrl: z.string().url(),
    description: z.string().min(3).max(200),
    orden: z.number().int().min(0).max(1000).optional().default(0),
});

export async function GET() {
    const items = await prisma.ejemploPersonalizado.findMany({ orderBy: { orden: 'asc' } });
    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    if (!validateCsrf(req.headers.get('x-csrf-token'))) {
        return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ejemploSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const ejemplo = await prisma.ejemploPersonalizado.create({ data: parsed.data });
    return NextResponse.json(ejemplo, { status: 201 });
}