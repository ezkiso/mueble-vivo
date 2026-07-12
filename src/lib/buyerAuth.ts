// src/lib/buyerAuth.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = () => {
    if (!process.env.BUYER_JWT_SECRET) throw new Error('BUYER_JWT_SECRET no configurado');
    return new TextEncoder().encode(process.env.BUYER_JWT_SECRET);
};

export const BUYER_COOKIE_NAME = 'mv_buyer';
const NINETY_DAYS = 60 * 60 * 24 * 90;

export interface BuyerSession {
    sub: string; // BuyerCredential.id
    name: string; // nombre ya enmascarado, listo para mostrar
}

export async function createBuyerSessionToken(payload: BuyerSession): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('90d')
        .sign(secret());
}

export function setBuyerSessionCookie(token: string) {
    cookies().set(BUYER_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: NINETY_DAYS,
    });
}

export function clearBuyerSessionCookie() {
    cookies().set(BUYER_COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getBuyerSession(): Promise<BuyerSession | null> {
    const token = cookies().get(BUYER_COOKIE_NAME)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secret());
        return payload as unknown as BuyerSession;
    } catch {
        return null;
    }
    }