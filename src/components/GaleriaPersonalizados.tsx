'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
        }, 10000);

        return () => clearInterval(interval);
    }, [ejemplos.length]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = el.clientWidth;
        el.scrollTo({
            left: direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount,
            behavior: 'smooth',
        });
    };

    if (ejemplos.length === 0) {
        return <p className="text-center text-gray-400 text-sm">Pronto compartiremos fotos de nuestros trabajos.</p>;
    }

    const allImages = ejemplos.map(e => e.imageUrl);

    return (
        <div className="relative">
        <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-tierra-oscuro p-2 rounded-full shadow-lg transicion-suave -ml-2"
            aria-label="Anterior"
        >
            <ChevronLeft size={24} />
        </button>
        <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-tierra-oscuro p-2 rounded-full shadow-lg transicion-suave -mr-2"
            aria-label="Siguiente"
        >
            <ChevronRight size={24} />
        </button>
        <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth -mx-4 px-4"
            style={{ scrollbarWidth: 'none' }}
        >
            {ejemplos.map((ej, index) => (
                <div
                    key={ej.id}
                    className="w-[calc(33.333%-0.7rem)] min-w-[180px] shrink-0 snap-start aspect-square bg-verde-claro rounded-xl overflow-hidden relative"
                >
                    <ImagenAmpliable 
                        src={ej.imageUrl} 
                        alt={ej.description} 
                        sizes="(max-width: 640px) 33vw, 180px"
                        images={allImages}
                        currentIndex={index}
                        priority={index < 3}
                    />
                </div>
            ))}
        </div>
        </div>
    );
}