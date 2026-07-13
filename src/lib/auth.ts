// src/lib/auth.ts
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { verifySessionJwt, type AdminSession } from '@/lib/jwt';

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET no configurado');
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

export const COOKIE_NAME = 'mv_session';
export type { AdminSession };

export async function createSessionToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '20m')
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<AdminSession> {
  return verifySessionJwt(token);
}

// cookies() ahora es async en Next.js 15 — todo caller de esta función pasa a ser async también.
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 20,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}