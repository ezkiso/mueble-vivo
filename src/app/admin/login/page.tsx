'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username.trim(),
        password: form.password.trim(),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Error al iniciar sesión');
      return;
    }

    router.refresh();
    window.location.href = '/admin/dashboard';
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-24">
      <h1 className="font-titulo text-2xl text-tierra-oscuro mb-6 text-center">Panel administrador</h1>
      {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input required placeholder="Usuario" value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          spellCheck={false}
          className="w-full border border-tierra-claro rounded-lg px-4 py-2.5" />

        <div className="relative">
          <input required type={mostrarPassword ? 'text' : 'password'} placeholder="Contraseña" value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="current-password"
            spellCheck={false}
            className="w-full border border-tierra-claro rounded-lg px-4 py-2.5 pr-10" />
          <button
            type="button"
            onClick={() => setMostrarPassword((v) => !v)}
            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-tierra-oscuro"
          >
            {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button disabled={loading} className="w-full bg-verde text-white py-2.5 rounded-lg font-semibold disabled:opacity-50">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}