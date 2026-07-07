'use client';

import { useEffect, useRef } from 'react';
import ImagenAmpliable from '@/components/ImagenAmpliable';

interface Ejemplo {
    id: string;
    imageUrl: string;
    description: string;
}

export default function GaleriaPersonalizados({ ejemplos }: { ejemplos: Ejemplo[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || ejemplos.length <= 3) return;

        const interval = setInterval(() => {
        if (!el) return;
        const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
        el.scrollTo({
            left: alFinal ? 0 : el.scrollLeft + el.clientWidth,
            behavior: 'smooth',
        });
        }, 4000);

        return () => clearInterval(interval);
    }, [ejemplos.length]);

    if (ejemplos.length === 0) {
        return <p className="text-center text-gray-400 text-sm">Pronto compartiremos fotos de nuestros trabajos.</p>;
    }

    return (
        <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth -mx-4 px-4"
        style={{ scrollbarWidth: 'none' }}
        >
        {ejemplos.map((ej) => (
            <div
            key={ej.id}
            className="w-[calc(33.333%-0.7rem)] min-w-[180px] shrink-0 snap-start aspect-square bg-verde-claro rounded-xl overflow-hidden relative"
            >
            <ImagenAmpliable src={ej.imageUrl} alt={ej.description} sizes="180px" />
            </div>
        ))}
        </div>
    );
}