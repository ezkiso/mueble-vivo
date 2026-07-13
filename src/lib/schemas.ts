import { z } from 'zod';

export const MAX_LIMIT = 50;

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(200),
});

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(4000),
  price: z.number().int().positive().max(50_000_000),
  stock: z.number().int().min(0).max(100_000),
  images: z.array(z.string().url()).max(8),
  active: z.boolean().optional().default(true),
  sold: z.boolean().optional().default(false),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(12),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['recientes', 'precio_asc', 'precio_desc', 'mas_vendidos']).default('recientes'),
});

export const cartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive().max(20),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().max(200),
  customerPhone: z.string().regex(/^\+\d{1,4}\d{6,14}$/, 'Teléfono inválido, incluye el código de país'),
  shippingAddress: z.string().min(5).max(300),
  shippingLat: z.number().min(-90).max(90),
  shippingLng: z.number().min(-180).max(180),
  items: z.array(cartItemSchema).min(1).max(50),
});

export const orderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'CANCELLED', 'FAILED', 'OVERSOLD']),
});

// Validación de archivos de imagen (MIME + tamaño), reforzada también en backend
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function isSafeFilename(filename: string): boolean {
  // Rechaza doble extensión (ej. foto.jpg.php) y caracteres peligrosos
  const dangerousPattern = /(\.\w+){2,}$|[<>:"/\\|?*\x00-\x1F]/;
  return !dangerousPattern.test(filename);
}
export const buyerVerifySchema = z.object({
  code: z.string().min(20).max(64),
});

export const commentSchema = z
  .object({
    productId: z.string().cuid(),
    body: z.string().max(1000).optional().default(''),
    images: z.array(z.string().url()).max(3).default([]),
  })
  .refine((d) => d.body.trim().length >= 3 || d.images.length > 0, {
    message: 'Escribe un comentario o sube al menos una imagen',
    path: ['body'],
  });

export const commentModerationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});