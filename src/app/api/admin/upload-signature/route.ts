import { NextRequest, NextResponse } from 'next/server';
import { generateUploadSignature } from '@/lib/cloudinary';
import { validateCsrf } from '@/lib/csrf';

// El frontend pide esta firma y luego sube el archivo DIRECTO a Cloudinary
// (nunca pasa por nuestro servidor), evitando exponer el api_secret.
export async function POST(req: NextRequest) {
  if (!validateCsrf(req.headers.get('x-csrf-token'))) {
    return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
  }

  const data = generateUploadSignature();
  return NextResponse.json(data);
}
