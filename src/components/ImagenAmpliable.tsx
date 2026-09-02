'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    src: string;
    alt: string;
    sizes?: string;
    priority?: boolean;
    images?: string[];
    currentIndex?: number;
    onIndexChange?: (index: number) => void;
}

export default function ImagenAmpliable({ src, alt, sizes, priority, images = [], currentIndex = 0, onIndexChange }: Props) {
    const [abierta, setAbierta] = useState(false);
    const [localIndex, setLocalIndex] = useState(currentIndex);

    const hasMultipleImages = images.length > 1;
    const currentImage = hasMultipleImages ? images[localIndex] : src;
    const currentAlt = hasMultipleImages ? `${alt} ${localIndex + 1}/${images.length}` : alt;

    const goToPrevious = () => {
        const newIndex = localIndex === 0 ? images.length - 1 : localIndex - 1;
        setLocalIndex(newIndex);
        onIndexChange?.(newIndex);
    };

    const goToNext = () => {
        const newIndex = localIndex === images.length - 1 ? 0 : localIndex + 1;
        setLocalIndex(newIndex);
        onIndexChange?.(newIndex);
    };

    return (
        <>
        <button
            type="button"
            onClick={() => {
                setLocalIndex(currentIndex);
                setAbierta(true);
            }}
            aria-label={`Ampliar imagen: ${alt}`}
            className="relative block w-full h-full cursor-zoom-in"
        >
            <Image 
                src={src} 
                alt={alt} 
                fill 
                priority={priority} 
                sizes={sizes} 
                loading={priority ? undefined : 'lazy'} 
                className="object-contain"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZDFlZmU3Ii8+PC9zdmc+"
            />
        </button>

        {abierta && (
            <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) setAbierta(false);
            }}
            >
            <button
                type="button"
                onClick={() => setAbierta(false)}
                aria-label="Cerrar imagen"
                className="absolute top-4 right-4 text-white hover:text-verde-claro transicion-suave z-10"
            >
                <X size={28} />
            </button>
            
            {hasMultipleImages && (
                <>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrevious();
                        }}
                        aria-label="Imagen anterior"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-verde-claro transicion-suave z-10 bg-black/50 hover:bg-black/70 p-2 rounded-full"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                        aria-label="Imagen siguiente"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-verde-claro transicion-suave z-10 bg-black/50 hover:bg-black/70 p-2 rounded-full"
                    >
                        <ChevronRight size={32} />
                    </button>
                </>
            )}
            
            <img src={currentImage} alt={currentAlt} className="max-w-full max-h-full object-contain" />
            </div>
        )}
        </>
    );
}