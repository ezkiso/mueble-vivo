// src/lib/rateLimit.ts
import { RateLimiterMemory } from 'rate-limiter-flexible';

const limiters: Record<string, RateLimiterMemory> = {
  login: new RateLimiterMemory({ points: 5, duration: 60 * 15 }),
  checkout: new RateLimiterMemory({ points: 10, duration: 60 }),
  webpayNotify: new RateLimiterMemory({ points: 30, duration: 60 }),
  buyerVerify: new RateLimiterMemory({ points: 8, duration: 60 * 15 }), // pegar código
  buyerUpload: new RateLimiterMemory({ points: 15, duration: 60 * 60 }), // firmas de subida
  comment: new RateLimiterMemory({ points: 5, duration: 60 * 60 }), // comentarios creados
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

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
}