// prisma/agregar-compradores-manuales.mjs
//
// Crea, para cada comprador "manual" (que pagó por WhatsApp, transferencia,
// en persona, etc.), una Orden marcada como PAID + su credencial de comprador
// (BuyerCredential), que es lo que la página usa para dejarlo comentar en
// /producto/[id] (ver src/app/api/comments/route.ts y src/lib/buyerAuth.ts).
//
// USO:
//   1) Copia este archivo a la carpeta prisma/ de tu proyecto.
//   2) Edita el array COMPRADORES más abajo con los datos de las 4 personas.
//   3) Corre localmente, apuntando a la misma base de datos que usa producción:
//        node prisma/agregar-compradores-manuales.mjs
//      (necesita las mismas variables de entorno que usa el sitio en Vercel:
//       DATABASE_URL, DIRECT_URL, BUYER_TOKEN_SECRET, BUYER_TOKEN_ENC_KEY.
//       Si las tienes en .env.local, el script las carga solo.)
//   4) El script imprime al final un código por persona. Ese código es el
//      que le mandas tú a cada comprador (por WhatsApp/email) para que lo
//      ingrese donde la página pida "verificar código de comprador" y así
//      pueda comentar. El código NO se vuelve a mostrar en texto plano
//      después de correr el script (solo se guarda cifrado/hasheado),
//      así que cópialos de la terminal antes de cerrarla.

import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { PrismaClient } from '@prisma/client';
import { randomUUID, randomBytes, createHmac, createCipheriv } from 'crypto';

const prisma = new PrismaClient();

// ---- EDITA ESTO: datos de los 4 compradores manuales ----
const COMPRADORES = [
  {
    customerName: 'David Larenas',
    customerEmail: 'black.bowloficial@gmail.com',
    customerPhone: '+56931311618',
    totalAmount: 0, // opcional, solo informativo para el panel admin
  },
];
// -----------------------------------------------------------

// Mismas funciones que src/lib/buyerToken.ts, reimplementadas aquí para no
// depender de imports con alias de TypeScript (@/lib/...) en un script .mjs.
function generateBuyerToken() {
  return randomBytes(20).toString('hex'); // 160 bits, igual que en el sitio
}

function hashBuyerToken(raw) {
  const secret = process.env.BUYER_TOKEN_SECRET;
  if (!secret) throw new Error('Falta BUYER_TOKEN_SECRET en el entorno');
  return createHmac('sha256', secret).update(raw).digest('hex');
}

function encryptBuyerToken(raw) {
  const key = process.env.BUYER_TOKEN_ENC_KEY;
  if (!key || key.length !== 64) {
    throw new Error('BUYER_TOKEN_ENC_KEY debe tener exactamente 64 caracteres hex (32 bytes)');
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

async function main() {
  const resultados = [];

  for (const comprador of COMPRADORES) {
    const buyOrder = `MANUAL-${Date.now()}-${Math.floor(Math.random() * 10000)}`.slice(0, 26);

    const order = await prisma.order.create({
      data: {
        customerName: comprador.customerName,
        customerEmail: comprador.customerEmail,
        customerPhone: comprador.customerPhone,
        shippingAddress: 'Venta manual (sin despacho por el sitio)',
        shippingLat: 0,
        shippingLng: 0,
        totalAmount: comprador.totalAmount ?? 0,
        buyOrder,
        sessionId: randomUUID(),
        status: 'PAID',
      },
    });

    const codigo = generateBuyerToken();

    await prisma.buyerCredential.create({
      data: {
        orderId: order.id,
        tokenHash: hashBuyerToken(codigo),
        tokenEncrypted: encryptBuyerToken(codigo),
        customerName: comprador.customerName,
      },
    });

    resultados.push({ nombre: comprador.customerName, codigo });
  }

  console.log('\nListo. Códigos para entregar a cada comprador (guárdalos, no se repiten):\n');
  for (const r of resultados) {
    console.log(`- ${r.nombre}: ${r.codigo}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
