'use client';

import { MessageCircle } from 'lucide-react';

// Reemplaza el número por el real, formato: código país + número, sin +, espacios ni guiones
const NUMERO_WHATSAPP = '56927202356';
const MENSAJE_PREDEFINIDO = 'Hola, tengo una consulta sobre Mueble Vivo 🌿';

export default function BotonWhatsapp() {
    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAJE_PREDEFINIDO)}`;

    return (
        <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-5 right-5 z-30 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-105 transicion-suave"
        >
        <MessageCircle size={26} fill="white" strokeWidth={0} />
        </a>
    );
}