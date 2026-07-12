// src/components/ComentariosProducto.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

interface Comentario {
    id: string;
    body: string;
    images: string[];
    createdAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    authorName: string;
    isMine: boolean;
}

export default function ComentariosProducto({ productId }: { productId: string }) {
    const [autenticado, setAutenticado] = useState<boolean | null>(null);
    const [nombre, setNombre] = useState('');
    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [codigo, setCodigo] = useState('');
    const [verificando, setVerificando] = useState(false);
    const [errorVerify, setErrorVerify] = useState('');

    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [cargandoLista, setCargandoLista] = useState(true);

    const [texto, setTexto] = useState('');
    const [imagenes, setImagenes] = useState<string[]>([]);
    const [subiendo, setSubiendo] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [errorEnvio, setErrorEnvio] = useState('');

    const cargarComentarios = useCallback(async () => {
        setCargandoLista(true);
        const res = await fetch(`/api/comments?productId=${productId}`);
        const data = await res.json();
        setComentarios(data.items ?? []);
        setCargandoLista(false);
    }, [productId]);

    const revisarSesion = useCallback(async () => {
        const res = await fetch('/api/buyer/session');
        const data = await res.json();
        setAutenticado(data.authenticated);
        if (data.authenticated) {
        setNombre(data.name);
        setCsrfToken(data.csrfToken);
        }
    }, []);

    useEffect(() => {
        revisarSesion();
        cargarComentarios();
    }, [revisarSesion, cargarComentarios]);

    const verificar = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerificando(true);
        setErrorVerify('');
        try {
        const res = await fetch('/api/buyer/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: codigo.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
            setErrorVerify(data.error || 'Código inválido');
            return;
        }
        setAutenticado(true);
        setNombre(data.name);
        setCsrfToken(data.csrfToken);
        setCodigo('');
        } finally {
        setVerificando(false);
        }
    };

    const subirImagen = async (file: File) => {
        if (imagenes.length >= 3 || !csrfToken) return;
        setSubiendo(true);
        setErrorEnvio('');
        try {
        const firmaRes = await fetch('/api/buyer/upload-signature', {
            method: 'POST',
            headers: { 'x-csrf-token': csrfToken },
        });
        if (!firmaRes.ok) {
            setErrorEnvio('No se pudo iniciar la subida. Intenta de nuevo.');
            return;
        }
        const firma = await firmaRes.json();

        if (file.size > firma.maxFileSizeBytes) {
            setErrorEnvio('La imagen supera el tamaño máximo permitido (4MB).');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', firma.apiKey);
        formData.append('timestamp', String(firma.timestamp));
        formData.append('signature', firma.signature);
        formData.append('folder', firma.folder);
        formData.append('allowed_formats', firma.allowed_formats);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
            setErrorEnvio('No se pudo subir la imagen.');
            return;
        }

        setImagenes((prev) => [...prev, uploadData.secure_url]);
        } finally {
        setSubiendo(false);
        }
    };

    const enviarComentario = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!csrfToken) return;
        setEnviando(true);
        setErrorEnvio('');
        try {
        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
            body: JSON.stringify({ productId, body: texto, images: imagenes }),
        });
        const data = await res.json();
        if (!res.ok) {
            setErrorEnvio(data.error || 'No se pudo publicar el comentario.');
            return;
        }
        setTexto('');
        setImagenes([]);
        await cargarComentarios();
        } finally {
        setEnviando(false);
        }
    };

    return (
        <section className="py-10 border-t">
        <h2 className="font-titulo text-2xl text-tierra-oscuro mb-6">Comentarios de compradores</h2>

        {autenticado === false && (
            <form onSubmit={verificar} className="bg-tierra-claro/30 border rounded-lg p-4 mb-8 max-w-md">
            <p className="text-sm text-gray-700 mb-3">
                ¿Ya compraste un terrario? Ingresa tu código de comprador para comentar y mostrar tu avance.
            </p>
            <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Pega tu código aquí"
                className="w-full border rounded px-3 py-2 text-sm mb-2"
                required
            />
            {errorVerify && <p className="text-red-600 text-sm mb-2">{errorVerify}</p>}
            <button
                type="submit"
                disabled={verificando}
                className="bg-verde text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            >
                {verificando ? 'Verificando...' : 'Verificar código'}
            </button>
            </form>
        )}

        {autenticado && (
            <form onSubmit={enviarComentario} className="bg-tierra-claro/30 border rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-600 mb-2">Comentando como <strong>{nombre}</strong></p>
            <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Cuéntanos cómo va tu terrario..."
                maxLength={1000}
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm mb-3"
            />

            <div className="flex flex-wrap gap-2 mb-3">
                {imagenes.map((url) => (
                <img key={url} src={url} alt="" className="w-16 h-16 object-cover rounded border" />
                ))}
                {imagenes.length < 3 && (
                <label className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center text-xs text-gray-400 cursor-pointer">
                    {subiendo ? '...' : '+ Foto'}
                    <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={subiendo}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) subirImagen(file);
                        e.target.value = '';
                    }}
                    />
                </label>
                )}
            </div>

            {errorEnvio && <p className="text-red-600 text-sm mb-2">{errorEnvio}</p>}

            <button
                type="submit"
                disabled={enviando || subiendo}
                className="bg-verde text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            >
                {enviando ? 'Publicando...' : 'Publicar comentario'}
            </button>
            <p className="text-xs text-gray-400 mt-2">Tu comentario se revisará antes de publicarse.</p>
            </form>
        )}

        {cargandoLista ? (
            <p className="text-sm text-gray-400">Cargando comentarios...</p>
        ) : comentarios.length === 0 ? (
            <p className="text-sm text-gray-400">Aún no hay comentarios en este producto.</p>
        ) : (
            <ul className="space-y-4">
            {comentarios.map((c) => (
                <li key={c.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-tierra-oscuro text-sm">{c.authorName}</span>
                    {c.isMine && c.status !== 'APPROVED' && (
                    <span className="text-xs text-gray-400">
                        {c.status === 'PENDING' ? 'En revisión' : 'No aprobado'}
                    </span>
                    )}
                </div>
                {c.body && <p className="text-sm text-gray-700 mb-2">{c.body}</p>}
                {c.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                    {c.images.map((url) => (
                        <img key={url} src={url} alt="" className="w-20 h-20 object-cover rounded border" />
                    ))}
                    </div>
                )}
                </li>
            ))}
            </ul>
        )}
        </section>
    );
}