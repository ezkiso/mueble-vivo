// src/components/GaleriaProducto.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImagenAmpliable from '@/components/ImagenAmpliable';

interface Props {
    images: string[];
    nombre: string;
}

export default function GaleriaProducto({ images, nombre }: Props) {
    const [seleccionada, setSeleccionada] = useState(0);

    if (images.length === 0) return null;

    return (
        <div>
        <div className="aspect-square bg-verde-claro rounded-xl overflow-hidden relative">
            <ImagenAmpliable
            src={images[seleccionada]}
            alt={`${nombre} - foto ${seleccionada + 1}`}
            priority
            sizes="(max-width: 640px) 100vw, 50vw"
            />
        </div>

        {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((url, i) => (
                <button
                key={url}
                type="button"
                onClick={() => setSeleccionada(i)}
                className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transicion-suave ${
                    i === seleccionada ? 'border-verde' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                aria-label={`Ver foto ${i + 1} de ${nombre}`}
                >
                <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                </button>
            ))}
            </div>
        )}
        </div>
    );
}