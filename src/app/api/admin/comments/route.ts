// src/app/api/admin/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';

    const comments = await prisma.comment.findMany({
        where: { status: status as any },
        orderBy: { createdAt: 'asc' },
        include: {
        product: { select: { name: true, slug: true } },
        buyer: { select: { customerName: true } },
        },
        take: 100,
    });

    return NextResponse.json({ items: comments });
}