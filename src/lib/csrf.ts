import { cookies } from 'next/headers';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const CSRF_COOKIE = 'mv_csrf';

function sign(value: string): string {
  const secret = process.env.CSRF_SECRET;
  if (!secret) throw new Error('CSRF_SECRET no configurado');
  return createHmac('sha256', secret).update(value).digest('hex');
}

// Genera un token CSRF y lo guarda en una cookie legible por JS (no httpOnly),
// para que el cliente pueda reenviarlo en un header personalizado (doble submit cookie).
export function issueCsrfToken(): string {
  const raw = randomBytes(24).toString('hex');
  const token = `${raw}.${sign(raw)}`;
  cookies().set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 30,
  });
  return token;
}

// Valida que el header X-CSRF-Token coincida con la cookie y que la firma sea válida.
export function validateCsrf(headerToken: string | null): boolean {
  const cookieToken = cookies().get(CSRF_COOKIE)?.value;
  if (!headerToken || !cookieToken || headerToken !== cookieToken) return false;
  const [raw, sig] = cookieToken.split('.');
  if (!raw || !sig) return false;
  const expected = sign(raw);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
