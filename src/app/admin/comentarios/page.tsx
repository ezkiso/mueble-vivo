// src/app/admin/comentarios/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAdminSession } from '@/lib/useAdminSession';
import ImagenAmpliable from '@/components/ImagenAmpliable';

interface ComentarioAdmin {
    id: string;
    body: string;
    images: string[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    product: { name: string; slug: string };
    buyer: { customerName: string };
}

const TABS: { key: ComentarioAdmin['status']; label: string }[] = [
    { key: 'PENDING', label: 'Pendientes' },
    { key: 'APPROVED', label: 'Aprobados' },
    { key: 'REJECTED', label: 'Rechazados' },
];

export default function AdminComentariosPage() {
    const { csrfToken } = useAdminSession();
    const [tab, setTab] = useState<ComentarioAdmin['status']>('PENDING');
    const [comentarios, setComentarios] = useState<ComentarioAdmin[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function cargar() {
        setCargando(true);
        const res = await fetch(`/api/admin/comments?status=${tab}`);
        const data = await res.json();
        setComentarios(data.items || []);
        setCargando(false);
    }

    useEffect(() => { cargar(); }, [tab]);

    async function moderar(id: string, status: 'APPROVED' | 'REJECTED') {
        setError(null);
        const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        body: JSON.stringify({ status }),
        });
        if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'No se pudo actualizar el comentario');
        return;
        }
        setComentarios((prev) => prev.filter((c) => c.id !== id));
    }

    async function eliminar(id: string) {
        if (!confirm('¿Eliminar este comentario permanentemente?')) return;
        await fetch(`/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken || '' },
        });
        setComentarios((prev) => prev.filter((c) => c.id !== id));
    }

    return (
        <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-titulo text-2xl text-tierra-oscuro mb-6">Comentarios de compradores</h1>

        <div className="flex gap-2 mb-6">
            {TABS.map((t) => (
            <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                tab === t.key ? 'bg-verde text-white border-verde' : 'border-tierra-claro text-tierra-oscuro'
                }`}
            >
                {t.label}
            </button>
            ))}
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {cargando ? (
            <p className="text-sm text-gray-400">Cargando...</p>
        ) : comentarios.length === 0 ? (
            <p className="text-sm text-gray-400">No hay comentarios en esta categoría.</p>
        ) : (
            <div className="space-y-4">
            {comentarios.map((c) => (
                <div key={c.id} className="bg-white border border-tierra-claro rounded-xl p-4">
                <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="font-semibold text-tierra-oscuro">{c.buyer.customerName}</span>
                    <a href={`/producto/${c.product.slug}`} target="_blank" className="text-verde underline">
                    {c.product.name}
                    </a>
                </div>
                <p className="text-xs text-gray-400 mb-2">{new Date(c.createdAt).toLocaleString('es-CL')}</p>
                {c.body && <p className="text-sm text-gray-700 mb-3">{c.body}</p>}
                {c.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                    {c.images.map((url, i) => (
                        <div key={url} className="relative w-28 h-28 rounded border overflow-hidden">
                        <ImagenAmpliable src={url} alt={`Foto ${i + 1} del comentario`} sizes="112px" />
                        </div>
                    ))}
                    </div>
                )}
                <div className="flex gap-2">
                    {tab !== 'APPROVED' && (
                    <button
                        onClick={() => moderar(c.id, 'APPROVED')}
                        className="bg-verde text-white px-3 py-1.5 rounded text-sm font-semibold"
                    >
                        Aprobar
                    </button>
                    )}
                    {tab !== 'REJECTED' && (
                    <button
                        onClick={() => moderar(c.id, 'REJECTED')}
                        className="border border-tierra-claro px-3 py-1.5 rounded text-sm"
                    >
                        Rechazar
                    </button>
                    )}
                    <button
                    onClick={() => eliminar(c.id)}
                    className="text-red-500 underline text-sm ml-auto"
                    >
                    Eliminar
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}
        </main>
    );
}