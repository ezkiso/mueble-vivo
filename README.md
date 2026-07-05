# Mueble Vivo — E-commerce de terrarios artesanales

E-commerce completo construido 100% sobre servicios con tier gratuito: **Vercel** (hosting),
**Supabase** (Postgres), **Cloudinary** (imágenes) y **Webpay Plus / Transbank** (pagos, ambiente
de integración gratuito).

## 1. Arquitectura general

```
Next.js 14 (App Router)
 ├─ Frontend: React Server Components + Client Components (carrito, admin)
 ├─ API Routes (Route Handlers) → lógica de negocio y seguridad
 ├─ Prisma ORM → Supabase Postgres (consultas parametrizadas)
 ├─ Auth admin: JWT (jose) en cookie httpOnly + bcrypt + bloqueo por fuerza bruta
 ├─ Imágenes: subida firmada directa del navegador → Cloudinary (api_secret nunca sale del server)
 └─ Pagos: transbank-sdk oficial (Webpay Plus, REST server-to-server)
```

### Por qué Cloudinary y no Supabase Storage
Se eligió **Cloudinary** porque su tier gratuito (25 GB de almacenamiento y 25 créditos
mensuales, equivalentes a bastante ancho de banda/transformaciones) es más generoso que el de
Supabase Storage (1 GB + 2 GB de banda ancha), y sus transformaciones automáticas (resize,
formato WebP) ayudan a mantener el sitio liviano sin procesar imágenes en el propio backend.
Si el catálogo fuera muy pequeño (<50 productos), Supabase Storage también sería viable.

### ⚠️ Nota importante sobre el flujo de Webpay
El enunciado pedía un webhook `/api/webpay/notify` independiente del `return_url`. En la
práctica, **Webpay Plus no emite un webhook asíncrono propio** (a diferencia de Stripe o
Mercado Pago): el único punto de confirmación real es el propio `return_url`, al que Transbank
redirige al cliente vía POST. Por eso el proyecto implementa la misma garantía de seguridad que
pedías, pero de forma técnicamente correcta:

- **`/api/webpay/return`**: recibe el `token_ws`, pero **nunca confía en los parámetros de la
  URL**. Llama a `commit()` (server-to-server contra los servidores de Transbank) y solo esa
  respuesta autoritativa determina si la orden pasa a `PAID`. La operación es idempotente.
- **`/api/webpay/notify`**: se mantiene como endpoint de **reconciliación/red de seguridad** —
  útil si el cliente cierra el navegador antes de volver del pago. Puede llamarse manualmente
  desde el panel admin o mediante un cron (Vercel Cron, gratuito) que revise órdenes `PENDING`
  antiguas y consulte su `status()` real en Transbank.

## 2. Instalación local

```bash
git clone <tu-repo>
cd mueble-vivo
npm install
npm audit fix
cp .env.example .env.local
```

Completa `.env.local` con tus credenciales (ver sección 3).

```bash
npx prisma db push          # crea las tablas en Supabase
ADMIN_USER=admin ADMIN_PASS="unaContraseñaFuerte123!" node prisma/seed.mjs
npm run dev                 # http://localhost:3000
```

## 3. Configurar variables de entorno

### Supabase (gratis)
1. Crea un proyecto en supabase.com.
2. En **Project Settings → Database**, copia la cadena de conexión con pooling (puerto 6543)
   → `DATABASE_URL`, y la conexión directa (puerto 5432) → `DIRECT_URL`.

### Cloudinary (gratis)
1. Crea una cuenta en cloudinary.com.
2. En el Dashboard copia `Cloud Name`, `API Key` y `API Secret`.

### Transbank Webpay Plus (integración, gratis)
En `TRANSBANK_ENVIRONMENT=INTEGRACION` **no necesitas credenciales propias**: el SDK usa
automáticamente el comercio y API key públicos de pruebas de Transbank. Solo debes cambiar a
`PRODUCCION` y completar `TRANSBANK_COMMERCE_CODE` / `TRANSBANK_API_KEY` cuando Transbank te
apruebe como comercio real (proceso de afiliación, fuera del alcance de este proyecto).

Tarjetas de prueba de integración: consulta la documentación oficial vigente en
`https://www.transbankdevelopers.cl` (las tarjetas de prueba cambian ocasionalmente).

### Secretos propios
```bash
openssl rand -base64 48   # para JWT_SECRET
openssl rand -base64 48   # para CSRF_SECRET
```

## 4. Despliegue en Vercel (gratis)

1. Sube el repo a GitHub.
2. En vercel.com → **New Project** → importa el repo.
3. En **Environment Variables**, agrega todas las variables de `.env.example` con sus valores
   reales (usa `NEXT_PUBLIC_BASE_URL=https://tu-proyecto.vercel.app`).
4. Despliega. Vercel ejecuta `prisma generate` automáticamente vía el script `postinstall`.
5. Corre las migraciones una sola vez desde tu máquina local apuntando a la BD de Supabase:
   `npx prisma db push`.
6. Ejecuta el seed del admin una vez (localmente, apuntando a `DATABASE_URL` de producción) o
   crea un script temporal protegido — nunca dejes credenciales de admin en el repo.
7. Actualiza `NEXT_PUBLIC_BASE_URL` en Vercel con la URL final antes de probar el checkout, ya
   que el `return_url` de Webpay depende de esa variable.

### Mantenerse en los límites gratuitos
- **Vercel Hobby**: 100 GB de banda ancha/mes — suficiente para una tienda pequeña/mediana.
- **Supabase Free**: 500 MB de BD y pausa automática tras 1 semana de inactividad (hacer un
  ping periódico o reactivar manualmente si el proyecto queda inactivo).
- **Cloudinary Free**: 25 GB almacenamiento / 25 créditos mensuales — evita subir imágenes sin
  comprimir; Cloudinary ya optimiza automáticamente al servir.
- El rate limiting en memoria (`rate-limiter-flexible`) se resetea si Vercel recicla la función;
  la protección "dura" contra fuerza bruta vive en la tabla `Admin`, que sí persiste.

## 5. Checklist de pruebas funcionales y de seguridad

**Funcional**
- [ ] Carrusel de destacados rota cada 5s y respeta la lógica (ventas > recientes)
- [ ] Grid de últimos 8 productos se actualiza al crear uno nuevo
- [ ] Carrito persiste tras recargar la página (localStorage)
- [ ] Checkout valida stock real contra la BD antes de crear la orden
- [ ] Flujo Webpay integración: pago exitoso, rechazado y abandono (TBK_TOKEN)
- [ ] Panel admin: crear/editar/eliminar producto, subir imagen, cambiar estado de orden

**Seguridad**
- [ ] Inyección SQL: probar comillas/operadores en filtros de búsqueda (`q`, `slug`) — Prisma parametriza, no debería romper
- [ ] XSS: intentar `<script>` en nombre/descripción de producto y verificar que se renderiza escapado
- [ ] CSRF: intentar un POST/PUT/DELETE de admin sin el header `x-csrf-token` → debe responder 403
- [ ] Acceso no autorizado: golpear `/api/admin/*` y `/admin/*` sin cookie de sesión → 401/redirect
- [ ] Rate limiting: hacer >10 requests/min a `/api/checkout` → 429
- [ ] Fuerza bruta: 5 intentos fallidos de login → cuenta bloqueada 15 min
- [ ] Cookies: verificar en DevTools que `mv_session` tiene `HttpOnly`, `Secure` (en prod) y `SameSite=Strict`
- [ ] Headers: confirmar con `curl -I` que están presentes CSP, HSTS, X-Frame-Options, etc.
- [ ] Webpay: confirmar que el estado de la orden **nunca** cambia solo por parámetros de la URL, solo tras `commit()`/`status()` reales
- [ ] Subida de archivos: intentar subir `.php`, `foto.jpg.exe`, o un archivo >5MB → debe rechazarse en frontend y backend

## 6. Estructura de carpetas

```
mueble-vivo/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.mjs
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                    (inicio)
│  │  ├─ tienda/page.tsx
│  │  ├─ producto/[id]/page.tsx
│  │  ├─ checkout/page.tsx
│  │  ├─ checkout/retorno/page.tsx
│  │  ├─ admin/{login,dashboard,productos,ordenes}/page.tsx
│  │  ├─ api/
│  │  │  ├─ auth/{login,logout}/route.ts
│  │  │  ├─ products/route.ts, products/featured/route.ts, products/[slug]/route.ts
│  │  │  ├─ checkout/route.ts
│  │  │  ├─ webpay/{return,notify}/route.ts
│  │  │  └─ admin/{products,orders,upload-signature,session}/route.ts
│  │  ├─ sitemap.ts / robots.ts
│  │  └─ layout.tsx / globals.css
│  ├─ components/ (Header, Footer, CartDrawer, ProductCard, CarruselDestacados, AgregarAlCarrito)
│  ├─ lib/ (prisma, auth, csrf, rateLimit, bruteforce, webpay, cloudinary, schemas)
│  ├─ store/cart.ts
│  └─ middleware.ts
├─ next.config.js / tailwind.config.js / tsconfig.json
├─ .env.example / .gitignore
└─ package.json
```
