'use client';

import { useEffect, useState } from 'react';
import { useAdminSession } from '@/lib/useAdminSession';

interface Producto {
  id: string; name: string; description: string; price: number; stock: number; images: string[]; sold: boolean;
}

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_IMAGENES = 8;

export default function AdminProductosPage() {
  const { csrfToken } = useAdminSession();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [q, setQ] = useState('');
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', images: [] as string[], sold: false });
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const res = await fetch(`/api/admin/products?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setProductos(data.items || []);
  }

  useEffect(() => { cargar(); }, [q]);

  function resetForm() {
    setEditando(null);
    setForm({ name: '', description: '', price: '', stock: '', images: [], sold: false });
  }

  async function subirImagen(file: File) {
    setError(null);

    if (form.images.length >= MAX_IMAGENES) {
      setError(`Máximo ${MAX_IMAGENES} imágenes por producto.`);
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      setError('Formato no permitido. Usa JPEG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('La imagen supera los 5 MB.');
      return;
    }
    if (/(\.\w+){2,}$/.test(file.name)) {
      setError('Nombre de archivo no permitido.');
      return;
    }

    setSubiendo(true);
    try {
      const sigRes = await fetch('/api/admin/upload-signature', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken || '' },
      });
      const sig = await sigRes.json();

      const body = new FormData();
      body.append('file', file);
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

      if (!uploaded.secure_url) throw new Error();
      setForm((f) => ({ ...f, images: [...f.images, uploaded.secure_url] }));
    } catch {
      setError('No fue posible subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  }

  function quitarImagen(url: string) {
    setForm((f) => ({ ...f, images: f.images.filter((img) => img !== url) }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      images: form.images,
      sold: form.sold,
    };

    const url = editando ? `/api/admin/products/${editando.id}` : '/api/admin/products';
    const method = editando ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Error al guardar');
      return;
    }

    resetForm();
    cargar();
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: { 'x-csrf-token': csrfToken || '' } });
    cargar();
  }

  function editar(p: Producto) {
    setEditando(p);
    setForm({ name: p.name, description: p.description, price: String(p.price), stock: String(p.stock), images: p.images, sold: p.sold });
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-titulo text-2xl text-tierra-oscuro mb-6">Productos</h1>

      <form onSubmit={guardar} className="bg-white border border-tierra-claro rounded-xl p-5 mb-8 space-y-3">
        <h2 className="font-semibold">{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input required placeholder="Nombre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full border border-tierra-claro rounded-lg px-3 py-2" />
        <textarea required placeholder="Descripción" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full border border-tierra-claro rounded-lg px-3 py-2" rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <input required type="number" placeholder="Precio (CLP)" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="border border-tierra-claro rounded-lg px-3 py-2" />
          <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            className="border border-tierra-claro rounded-lg px-3 py-2" />
        </div>
        <div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={form.images.length >= MAX_IMAGENES}
            onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])}
          />
          <p className="text-xs text-gray-400 mt-1">{form.images.length} / {MAX_IMAGENES} imágenes</p>
          {subiendo && <p className="text-sm text-gray-500">Subiendo imagen...</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {form.images.map((url) => (
              <div key={url} className="relative">
                <img src={url} className="w-16 h-16 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => quitarImagen(url)}
                  aria-label="Quitar imagen"
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-xs leading-none flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.sold}
            onChange={(e) => setForm((f) => ({ ...f, sold: e.target.checked }))}
          />
          Marcar como vendido (queda visible en la tienda como ejemplo, no comprable)
        </label>
        <div className="flex gap-2">
          <button className="bg-verde text-white px-4 py-2 rounded-lg">{editando ? 'Guardar cambios' : 'Crear producto'}</button>
          {editando && <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancelar</button>}
        </div>
      </form>

      <input placeholder="Buscar producto..." value={q} onChange={(e) => setQ(e.target.value)}
        className="w-full border border-tierra-claro rounded-lg px-3 py-2 mb-4" />

      <div className="bg-white border border-tierra-claro rounded-xl divide-y">
        {productos.map((p) => (
          <div key={p.id} className="p-3 flex items-center justify-between text-sm gap-2">
            <span className="flex-1 truncate">{p.name}</span>
            <span>{clp.format(p.price)}</span>
            <span>Stock: {p.stock}</span>
            <button onClick={() => editar(p)} className="underline">Editar</button>
            <button onClick={() => eliminar(p.id)} className="text-red-500 underline">Eliminar</button>
          </div>
        ))}
      </div>
    </main>
  );
}