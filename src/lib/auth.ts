import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET no configurado');
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

export const COOKIE_NAME = 'mv_session';

export interface AdminSession {
  sub: string; // admin id
  username: string;
}

// Crea un JWT firmado (HS256) con expiración corta.
export async function createSessionToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '20m')
    .sign(secret());
}

// Verifica un JWT. Lanza si es inválido/expirado.
export async function verifySessionToken(token: string): Promise<AdminSession> {
  const { payload } = await jwtVerify(token, secret());
  return payload as unknown as AdminSession;
}

// Setea la cookie httpOnly de sesión (llamar desde una Route Handler / Server Action).
export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 20, // 20 minutos, alineado con JWT_EXPIRES_IN
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

// Helper para obtener la sesión actual en Server Components / Route Handlers.
export async function getSession(): Promise<AdminSession | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
