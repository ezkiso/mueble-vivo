import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'mv_session';

// Nota: jose funciona en Edge Runtime, por eso el middleware no importa Prisma
// (Prisma no corre en Edge). La verificación aquí es solo de la firma/expiración
// del JWT; la lógica de negocio fina se revalida dentro de cada Route Handler.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectOrUnauthorized(req, isAdminApi);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return NextResponse.next();
  } catch {
    return redirectOrUnauthorized(req, isAdminApi);
  }
}

function redirectOrUnauthorized(req: NextRequest, isApi: boolean) {
  if (isApi) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const loginUrl = new URL('/admin/login', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
