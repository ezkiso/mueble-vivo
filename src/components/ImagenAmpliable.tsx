'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface Props {
    src: string;
    alt: string;
    sizes?: string;
    priority?: boolean;
}

export default function ImagenAmpliable({ src, alt, sizes, priority }: Props) {
    const [abierta, setAbierta] = useState(false);

    return (
        <>
        <button
            type="button"
            onClick={() => setAbierta(true)}
            aria-label={`Ampliar imagen: ${alt}`}
            className="relative block w-full h-full cursor-zoom-in"
        >
            <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-contain" />
        </button>

        {abierta && (
            <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setAbierta(false)}
            >
            <button
                type="button"
                onClick={() => setAbierta(false)}
                aria-label="Cerrar imagen"
                className="absolute top-4 right-4 text-white hover:text-verde-claro transicion-suave"
            >
                <X size={28} />
            </button>
            <img src={src} alt={alt} className="max-w-full max-h-full object-contain" />
            </div>
        )}
        </>
    );
}