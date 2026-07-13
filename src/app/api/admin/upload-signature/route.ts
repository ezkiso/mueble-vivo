// src/app/api/admin/upload-signature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateUploadSignature } from '@/lib/cloudinary';
import { validateCsrf } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  if (!(await validateCsrf(req.headers.get('x-csrf-token')))) {
    return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
  }

  const data = generateUploadSignature();
  return NextResponse.json(data);
}