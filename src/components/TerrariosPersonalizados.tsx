import { Layers, Sprout, Mountain, FlaskConical } from 'lucide-react';
import Link from 'next/link';

const NUMERO_WHATSAPP = '56912345678'; // mismo número que BotonWhatsapp.tsx

const pasos = [
    { icono: FlaskConical, titulo: 'Elige el jarro', texto: 'Distintas formas y tamaños de vidrio.' },
    { icono: Layers, titulo: 'Elige el sustrato', texto: 'Capas de drenaje, carbón activado y tierra especial.' },
    { icono: Sprout, titulo: 'Elige las plantas', texto: 'Musgos, helechos, suculentas o mix personalizado.' },
    { icono: Mountain, titulo: 'Elige la decoración', texto: 'Piedras, madera flotante, figuras y más.' },
    ];

    export default function TerrariosPersonalizados() {
    const mensaje = encodeURIComponent(
        'Hola! Me interesa armar un Terrario Personalizado 🌿 ¿Me ayudan a cotizarlo?',
    );

    return (
        <section className="bg-tierra-oscuro text-white rounded-2xl overflow-hidden">
        <div className="px-6 py-10 sm:px-10 sm:py-14 grid sm:grid-cols-2 gap-8 items-center">
            <div>
            <span className="inline-block bg-verde text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                SERVICIO EXCLUSIVO
            </span>
            <h2 className="font-titulo text-3xl mb-3">Terrarios Personalizados</h2>
            <p className="text-tierra-claro mb-6">
                Diseña tu propio terrario a tu gusto: tú eliges el jarro, el sustrato, las plantas y la
                decoración. Nosotros lo armamos a mano y te damos un precio ajustado a tu elección.
            </p>
            <div className="flex flex-wrap gap-3">
                <a
                href={`https://wa.me/${NUMERO_WHATSAPP}?text=${mensaje}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-verde text-white px-6 py-3 rounded-lg font-semibold hover:bg-verde/90 transicion-suave"
                >
                Cotiza el tuyo por WhatsApp
                </a>
                <Link
                href="/personalizados"
                className="inline-block border border-white/40 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transicion-suave"
                >
                Ver más
                </Link>
            </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
            {pasos.map(({ icono: Icono, titulo, texto }) => (
                <div key={titulo} className="bg-white/10 rounded-xl p-4">
                <Icono size={26} className="text-verde-claro mb-2" />
                <h3 className="font-semibold text-sm mb-1">{titulo}</h3>
                <p className="text-xs text-tierra-claro">{texto}</p>
                </div>
            ))}
            </div>
        </div>
        </section>
    );
}