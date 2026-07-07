// src/app/admin/personalizados/page.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { useAdminSession } from '@/lib/useAdminSession';

interface Ejemplo {
    id: string;
    imageUrl: string;
    description: string;
    orden: number;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export default function AdminPersonalizadosPage() {
    const { csrfToken } = useAdminSession();
    const [ejemplos, setEjemplos] = useState<Ejemplo[]>([]);

    const [archivo, setArchivo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [subiendo, setSubiendo] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function cargar() {
        try {
        const res = await fetch('/api/admin/ejemplos');
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Error ${res.status} al cargar la galería`);
        }
        const data = await res.json();
        setEjemplos(data.items || []);
        } catch (e) {
        console.error('Error cargando ejemplos:', e);
        setError(e instanceof Error ? e.message : 'No fue posible cargar la galería.');
        }
    }

    useEffect(() => { cargar(); }, []);

    function elegirArchivo(file: File) {
        setError(null);

        if (!ALLOWED.includes(file.type)) {
        setError('Formato no permitido. Usa JPEG, PNG o WebP.');
        return;
        }
        if (file.size > MAX_SIZE) {
        setError('La imagen supera los 5 MB.');
        return;
        }

        setArchivo(file);
        setPreviewUrl(URL.createObjectURL(file));
    }

    function cancelarSeleccion() {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setArchivo(null);
        setPreviewUrl(null);
        setDescription('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function confirmarSubida() {
        if (!archivo) return;
        setError(null);

        if (!csrfToken) {
        setError('Sesión no lista todavía, espera un segundo e intenta de nuevo.');
        return;
        }

        setSubiendo(true);
        try {
        const sigRes = await fetch('/api/admin/upload-signature', {
            method: 'POST',
            headers: { 'x-csrf-token': csrfToken },
        });
        if (!sigRes.ok) throw new Error('No fue posible generar la firma de subida.');
        const sig = await sigRes.json();

        const body = new FormData();
        body.append('file', archivo);
        body.append('api_key', sig.apiKey);
        body.append('timestamp', sig.timestamp);
        body.append('signature', sig.signature);
        body.append('folder', sig.folder);
        body.append('allowed_formats', sig.allowed_formats);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
            method: 'POST',
            body,
        });
        const uploaded = await uploadRes.json();
        if (!uploaded.secure_url) {
            throw new Error(uploaded.error?.message || 'Cloudinary no devolvió la imagen.');
        }

        const createRes = await fetch('/api/admin/ejemplos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
            body: JSON.stringify({ imageUrl: uploaded.secure_url, description, orden: ejemplos.length }),
        });

        if (!createRes.ok) {
            const data = await createRes.json().catch(() => ({}));
            throw new Error(data.error || 'No fue posible guardar el ejemplo en la base de datos.');
        }

        cancelarSeleccion();
        await cargar();
        } catch (e) {
        console.error('Error subiendo imagen:', e);
        setError(e instanceof Error ? e.message : 'No fue posible subir la imagen.');
        } finally {
        setSubiendo(false);
        }
    }

    async function eliminar(id: string) {
        if (!confirm('¿Eliminar esta foto de ejemplo?')) return;
        await fetch(`/api/admin/ejemplos/${id}`, { method: 'DELETE', headers: { 'x-csrf-token': csrfToken || '' } });
        cargar();
    }

    return (
        <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-titulo text-2xl text-tierra-oscuro mb-2">Terrarios Personalizados — Galería</h1>
        <p className="text-sm text-gray-500 mb-6">
            Estas fotos se muestran en la sección "Algunos que ya hicimos" de la página pública /personalizados.
        </p>

        <div className="bg-white border border-tierra-claro rounded-xl p-5 mb-8 space-y-3">
            {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>}

            {!archivo ? (
            <>
                <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && elegirArchivo(e.target.files[0])}
                />
                <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-verde text-white py-2.5 rounded-lg font-semibold hover:bg-verde/90 transicion-suave"
                >
                📷 Elegir foto de terrario vendido
                </button>
            </>
            ) : (
            <>
                <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-verde-claro">
                <img src={previewUrl!} alt="Vista previa" className="w-full h-full object-cover" />
                </div>

                <input
                placeholder="Título (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-tierra-claro rounded-lg px-3 py-2"
                />

                <div className="flex gap-2">
                <button
                    type="button"
                    onClick={confirmarSubida}
                    disabled={subiendo}
                    className="flex-1 bg-verde text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:bg-verde/90 transicion-suave"
                >
                    {subiendo ? 'Subiendo...' : '✓ Subir foto'}
                </button>
                <button
                    type="button"
                    onClick={cancelarSeleccion}
                    disabled={subiendo}
                    className="px-4 py-2.5 border border-tierra-claro rounded-lg disabled:opacity-50"
                >
                    Cancelar
                </button>
                </div>
            </>
            )}
        </div>

        <div className="flex flex-col gap-3">
            {ejemplos.length === 0 && !error && (
            <p className="text-sm text-gray-400 text-center py-6">Aún no hay fotos subidas.</p>
            )}
            {ejemplos.map((ej) => (
            <div key={ej.id} className="bg-white border border-tierra-claro rounded-xl overflow-hidden flex gap-4 p-3">
                <div className="w-24 h-24 bg-verde-claro rounded-lg overflow-hidden shrink-0">
                <img src={ej.imageUrl} alt={ej.description || 'Terrario personalizado'} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                <p className="text-sm text-gray-700">{ej.description || <span className="text-gray-400 italic">Sin título</span>}</p>
                <button onClick={() => eliminar(ej.id)} className="text-red-500 text-xs underline self-start">Eliminar</button>
                </div>
            </div>
            ))}
        </div>
        </main>
    );
}