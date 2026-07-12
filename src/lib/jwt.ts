// src/lib/jwt.ts
import { jwtVerify } from 'jose';

// Módulo separado y sin dependencias de 'next/headers': lo importan tanto
// auth.ts (Node runtime) como middleware.ts (Edge runtime). Una sola fuente
// de verdad para la lógica de verificación del JWT de sesión admin.

export interface AdminSession {
    sub: string;
    username: string;
}

function secret() {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET no configurado');
    return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function verifySessionJwt(token: string): Promise<AdminSession> {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as AdminSession;
}