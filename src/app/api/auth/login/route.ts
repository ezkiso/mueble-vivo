import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/schemas';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { isLocked, registerFailedAttempt, resetFailedAttempts, logSecurityEvent } from '@/lib/bruteforce';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const limited = await consumeRateLimit('login', ip);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Demasiados intentos. Intenta más tarde.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  // Trim defensivo también en el backend: nunca confiar en que el frontend
  // ya limpió espacios (teclados móviles a veces agregan espacios invisibles).
  const username = parsed.data.username.trim();
  const password = parsed.data.password.trim();

  const admin = await prisma.admin.findUnique({ where: { username } });

  const genericError = () => NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });

  if (!admin) {
    await logSecurityEvent('LOGIN_FAILED', ip, 'usuario inexistente');
    return genericError();
  }

  if (await isLocked(admin)) {
    await logSecurityEvent('LOGIN_BLOCKED', ip, `admin=${admin.id}`);
    return NextResponse.json({ error: 'Cuenta bloqueada temporalmente. Intenta en 15 min.' }, { status: 423 });
  }

  const validPassword = await bcrypt.compare(password, admin.passwordHash);

  if (!validPassword) {
    const locked = await registerFailedAttempt(admin.id, admin.failedAttempts);
    await logSecurityEvent(locked ? 'LOGIN_BLOCKED' : 'LOGIN_FAILED', ip, `admin=${admin.id}`);
    return genericError();
  }

  await resetFailedAttempts(admin.id);
  await logSecurityEvent('LOGIN_SUCCESS', ip, `admin=${admin.id}`);

  const token = await createSessionToken({ sub: admin.id, username: admin.username });
  setSessionCookie(token);

  return NextResponse.json({ ok: true });
}