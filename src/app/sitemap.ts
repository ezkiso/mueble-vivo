import { prisma } from '@/lib/prisma';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const productos = await prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } });

  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/tienda`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/personalizados`, changeFrequency: 'weekly', priority: 0.8 },
    ...productos.map((p) => ({
      url: `${base}/producto/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}