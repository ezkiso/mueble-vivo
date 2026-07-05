import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'mv_session';

function buildCsp(nonce: string, isDev: boolean) {
  return [
    "default-src 'self'",
    "img-src 'self' res.cloudinary.com data: https://*.tile.openstreetmap.org",
    `style-src 'self' 'nonce-${nonce}'` + (isDev ? " 'unsafe-inline'" : ''),
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'` + (isDev ? " 'unsafe-eval' 'unsafe-inline'" : ''),
    "font-src 'self' data:",
    "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com https://nominatim.openstreetmap.org" +
      (isDev ? ' ws://localhost:* http://localhost:*' : ''),
    "form-action 'self' https://webpay3g.transbank.cl https://webpay3gint.transbank.cl",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

// Middleware unificado: genera el nonce de CSP para TODAS las rutas (necesario para que
// React hidrate en producción) y, además, protege /admin y /api/admin verificando el JWT.
export async function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV !== 'production';
  const csp = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const { pathname } = req.nextUrl;
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    let valido = false;

    if (token) {
      try {
        await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        valido = true;
      } catch {
        valido = false;
      }
    }

    if (!valido) {
      if (isAdminApi) {
        const res = NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        res.headers.set('Content-Security-Policy', csp);
        return res;
      }
      const loginUrl = new URL('/admin/login', req.url);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set('Content-Security-Policy', csp);
      return res;
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png).*)'],
};