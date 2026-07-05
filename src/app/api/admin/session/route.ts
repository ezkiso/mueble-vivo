import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { issueCsrfToken } from '@/lib/csrf';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const csrfToken = issueCsrfToken();
  return NextResponse.json({ username: session.username, csrfToken });
}
