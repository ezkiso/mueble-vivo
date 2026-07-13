// src/lib/csrf.ts
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
// Ahora async porque cookies() lo es en Next.js 15 — cada caller debe usar await.
export async function issueCsrfToken(): Promise<string> {
  const raw = randomBytes(24).toString('hex');
  const token = `${raw}.${sign(raw)}`;
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 30,
  });
  return token;
}

// Valida que el header X-CSRF-Token coincida con la cookie y que la firma sea válida.
export async function validateCsrf(headerToken: string | null): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
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