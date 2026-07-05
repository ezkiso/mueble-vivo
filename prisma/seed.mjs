// Ejecutar con: node prisma/seed.mjs
// Crea (o actualiza la contraseña de) el usuario admin inicial.
// Uso: ADMIN_USER=admin ADMIN_PASS="unaContraseñaFuerte123!" node prisma/seed.mjs

import 'dotenv/config'; // node no carga .env.local solo; ver nota abajo
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASS;

  if (!password || password.length < 8) {
    console.error('Define ADMIN_PASS (mínimo 8 caracteres) como variable de entorno antes de ejecutar el seed.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12); // 12 rondas de salt

  const admin = await prisma.admin.upsert({
    where: { username },
    update: { passwordHash, failedAttempts: 0, lockedUntil: null },
    create: { username, passwordHash },
  });

  console.log(`Admin listo: ${admin.username}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
