import { RateLimiterMemory } from 'rate-limiter-flexible';

// NOTA: al usar Vercel serverless, cada instancia tiene su propio estado en memoria.
// Para un control de fuerza bruta persistente y correcto entre instancias, la protección
// definitiva vive en la tabla `Admin` (failedAttempts/lockedUntil, ver src/lib/bruteforce.ts).
// Este limiter en memoria es una capa adicional de mitigación por IP dentro de una misma instancia.

const limiters: Record<string, RateLimiterMemory> = {
  login: new RateLimiterMemory({ points: 5, duration: 60 * 15 }), // 5 intentos / 15 min
  checkout: new RateLimiterMemory({ points: 10, duration: 60 }), // 10 / min
  webpayNotify: new RateLimiterMemory({ points: 30, duration: 60 }),
};

export type LimiterKey = keyof typeof limiters;

export async function consumeRateLimit(key: LimiterKey, ip: string): Promise<{ ok: boolean; retryAfter?: number }> {
  try {
    await limiters[key].consume(ip);
    return { ok: true };
  } catch (rejection: any) {
    return { ok: false, retryAfter: Math.ceil((rejection?.msBeforeNext ?? 1000) / 1000) };
  }
}

// Extrae la IP real considerando el proxy de Vercel.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
}
