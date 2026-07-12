// src/lib/buyerToken.ts
import { createHmac, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';

function hmacSecret(): string {
    if (!process.env.BUYER_TOKEN_SECRET) throw new Error('BUYER_TOKEN_SECRET no configurado');
    return process.env.BUYER_TOKEN_SECRET;
}

function encKey(): Buffer {
    const key = process.env.BUYER_TOKEN_ENC_KEY;
    if (!key || key.length !== 64) throw new Error('BUYER_TOKEN_ENC_KEY debe tener exactamente 64 caracteres hex (32 bytes)');
    return Buffer.from(key, 'hex');
}

// 160 bits de entropía — imposible de fuerza-bruta con cualquier rate limit razonable.
export function generateBuyerToken(): string {
    return randomBytes(20).toString('hex');
}

// Hash determinístico: permite buscar por igualdad en la BD (WHERE tokenHash = ...)
// sin exponer el código real si la BD se filtra.
export function hashBuyerToken(raw: string): string {
    return createHmac('sha256', hmacSecret()).update(raw).digest('hex');
}

// Cifrado reversible: solo se usa cuando el admin necesita reenviar el código
// a un cliente que no alcanzó a verlo (ej. cerró la pestaña tras pagar).
export function encryptBuyerToken(raw: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGO, encKey(), iv);
    const encrypted = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptBuyerToken(packed: string): string {
    const [ivHex, tagHex, dataHex] = packed.split(':');
    const decipher = createDecipheriv(ALGO, encKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
}

// Nombre público mostrado junto al comentario — nunca el nombre completo del checkout.
export function maskBuyerName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
}