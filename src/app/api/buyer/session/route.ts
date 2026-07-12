// src/app/api/buyer/session/route.ts
import { NextResponse } from 'next/server';
import { getBuyerSession } from '@/lib/buyerAuth';
import { issueCsrfToken } from '@/lib/csrf';

export async function GET() {
    const session = await getBuyerSession();
    if (!session) return NextResponse.json({ authenticated: false });

    const csrfToken = issueCsrfToken();
    return NextResponse.json({ authenticated: true, name: session.name, csrfToken });
}