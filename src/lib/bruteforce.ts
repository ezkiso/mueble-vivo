import { prisma } from '@/lib/prisma';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function isLocked(admin: { lockedUntil: Date | null }): Promise<boolean> {
  return !!admin.lockedUntil && admin.lockedUntil.getTime() > Date.now();
}

export async function registerFailedAttempt(adminId: string, currentAttempts: number) {
  const attempts = currentAttempts + 1;
  const shouldLock = attempts >= MAX_ATTEMPTS;
  await prisma.admin.update({
    where: { id: adminId },
    data: {
      failedAttempts: shouldLock ? 0 : attempts,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
    },
  });
  return shouldLock;
}

export async function resetFailedAttempts(adminId: string) {
  await prisma.admin.update({
    where: { id: adminId },
    data: { failedAttempts: 0, lockedUntil: null },
  });
}

export async function logSecurityEvent(event: string, ip: string | null, detail?: string) {
  // Nunca registrar contraseñas, tokens ni secretos en `detail`.
  await prisma.securityLog.create({ data: { event, ip: ip ?? undefined, detail } }).catch(() => {});
}
