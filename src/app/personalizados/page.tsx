import type { Metadata } from 'next';
import { Layers, Sprout, Mountain, FlaskConical } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import GaleriaPersonalizados from '@/components/GaleriaPersonalizados';

export const dynamic = 'force-dynamic'; // siempre trae datos frescos (sin caché de ISR)

export async function generateMetadata(): Promise<Metadata> {
    const primerEjemplo = await prisma.ejemploPersonalizado.findFirst({ orderBy: { orden: 'asc' } });

    return {
        title: 'Terrarios Personalizados',
        description: 'Diseña tu propio terrario: elige el jarro, el sustrato, las plantas y la decoración. Cotización a medida.',
        openGraph: {
        title: 'Terrarios Personalizados | Mueble Vivo',
        description: 'Elige el jarro, el sustrato, las plantas y la decoración. Cotización a medida.',
        images: primerEjemplo ? [primerEjemplo.imageUrl] : [],
        },
    };
}

const NUMERO_WHATSAPP = '56927202356'; // mismo número que BotonWhatsapp.tsx y TerrariosPersonalizados.tsx

const pasos = [
    { icono: FlaskConical, titulo: 'Elige el jarro', texto: 'Distintas formas y tamaños de vidrio, desde compactos hasta grandes piezas de exhibición.' },
    { icono: Layers, titulo: 'Elige el sustrato', texto: 'Capas de drenaje, carbón activado y tierra especial según las plantas que elijas.' },
    { icono: Sprout, titulo: 'Elige las plantas', texto: 'Musgos, helechos, suculentas, o una combinación pensada para tu espacio.' },
    { icono: Mountain, titulo: 'Elige la decoración', texto: 'Piedras, madera flotante, figuras decorativas y detalles a tu gusto.' },
];

export default async function PersonalizadosPage() {
    const ejemplos = await prisma.ejemploPersonalizado.findMany({ orderBy: { orden: 'asc' } });

    const mensaje = encodeURIComponent(
        'Hola! Me interesa armar un Terrario Personalizado 🌿 ¿Me ayudan a cotizarlo?',
    );
    const whatsappUrl = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensaje}`;

    return (
        <main className="max-w-5xl mx-auto px-4 py-12 space-y-16">
        {/* Hero */}
        <section className="text-center max-w-2xl mx-auto">
            <span className="inline-block bg-verde text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            SERVICIO EXCLUSIVO
            </span>
            <h1 className="font-titulo text-4xl text-tierra-oscuro mb-4">Terrarios Personalizados</h1>
            <p className="text-gray-600 mb-8">
            Diseña tu propio terrario a tu gusto: tú eliges el jarro, el sustrato, las plantas y la
            decoración. Nosotros lo armamos a mano y te damos un precio ajustado a tu elección.
            </p>
            <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#25D366] text-white px-8 py-3.5 rounded-lg font-semibold hover:opacity-90 transicion-suave"
            >
            Cotiza el tuyo por WhatsApp
            </a>
        </section>

        {/* Cómo funciona */}
        <section>
            <h2 className="font-titulo text-2xl text-tierra-oscuro mb-6 text-center">Cómo funciona</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pasos.map(({ icono: Icono, titulo, texto }, i) => (
                <div key={titulo} className="bg-white border border-tierra-claro rounded-xl p-5 relative">
                <span className="absolute -top-3 -left-3 bg-verde text-white text-xs w-7 h-7 rounded-full flex items-center justify-center font-semibold">
                    {i + 1}
                </span>
                <Icono size={26} className="text-verde mb-3" />
                <h3 className="font-semibold mb-1">{titulo}</h3>
                <p className="text-sm text-gray-500">{texto}</p>
                </div>
            ))}
            </div>
        </section>

        {/* Galería de ejemplos: auto-scroll cada 4s, 3 imágenes visibles */}
        <section>
            <h2 className="font-titulo text-2xl text-tierra-oscuro mb-6 text-center">Algunos que ya hicimos</h2>
            <GaleriaPersonalizados ejemplos={ejemplos} />
        </section>

        {/* CTA final */}
        <section className="bg-tierra-oscuro text-white rounded-2xl p-8 text-center">
            <h2 className="font-titulo text-2xl mb-3">¿Listo para armar el tuyo?</h2>
            <p className="text-tierra-claro mb-6">Cuéntanos tu idea y te enviamos una cotización sin compromiso.</p>
            <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#25D366] text-white px-8 py-3.5 rounded-lg font-semibold hover:opacity-90 transicion-suave"
            >
            Escríbenos por WhatsApp
            </a>
        </section>
        </main>
    );
}