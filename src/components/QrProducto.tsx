'use client';

import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface Props {
    url: string;
    nombreProducto: string;
}

export default function QrProducto({ url, nombreProducto }: Props) {
    const canvasRef = useRef<HTMLDivElement>(null);

    function descargar() {
        const canvas = canvasRef.current?.querySelector('canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `qr-${nombreProducto.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    return (
        <div className="bg-white border border-tierra-claro rounded-xl p-4 text-center space-y-3">
        <div ref={canvasRef} className="flex justify-center">
            <QRCodeCanvas value={url} size={160} level="M" includeMargin />
        </div>
        <p className="text-xs text-gray-500 break-all">{url}</p>
        <button
            type="button"
            onClick={descargar}
            className="text-sm bg-verde text-white px-4 py-2 rounded-lg font-semibold hover:bg-verde/90 transicion-suave"
        >
            Descargar PNG
        </button>
        </div>
    );
}