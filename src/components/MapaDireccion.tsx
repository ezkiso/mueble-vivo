'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Icono propio en SVG inline: evita depender de imágenes externas (unpkg) que
// romperían la CSP. No requiere agregar dominios extra a img-src.
const pinIcon = L.divIcon({
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z" fill="#2E7D32"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`,
  className: '',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

const CENTRO_CHILE: [number, number] = [-33.4489, -70.6693]; // Santiago por defecto

interface Props {
  onConfirmar: (data: { address: string; lat: number; lng: number }) => void;
}

export default function MapaDireccion({ onConfirmar }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    const map = L.map(mapRef.current).setView(CENTRO_CHILE, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      colocarPin(e.latlng.lat, e.latlng.lng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  function colocarPin(lat: number, lng: number) {
    if (!mapInstance.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(mapInstance.current);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng);
      });
    }
    mapInstance.current.setView([lat, lng], 16);
    setCoords({ lat, lng });
  }

  // Nominatim: geocodificación gratuita de OpenStreetMap (límite ~1 req/seg, uso liviano de una tienda pequeña)
  async function buscarDireccion() {
    if (!busqueda.trim()) return;
    setBuscando(true);
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cl&q=${encodeURIComponent(busqueda)}`,
      );
      const data = await res.json();
      if (!data?.length) {
        setError('No se encontró esa dirección. Intenta ser más específico o marca el punto en el mapa.');
        setBuscando(false);
        return;
      }
      const { lat, lon, display_name } = data[0];
      colocarPin(parseFloat(lat), parseFloat(lon));
      setDireccionSeleccionada(display_name);
    } catch {
      setError('No fue posible buscar la dirección. Intenta nuevamente.');
    } finally {
      setBuscando(false);
    }
  }

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      setDireccionSeleccionada(data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setDireccionSeleccionada(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }

  function confirmar() {
    if (!coords || !direccionSeleccionada) {
      setError('Marca tu ubicación en el mapa antes de continuar.');
      return;
    }
    onConfirmar({ address: direccionSeleccionada, lat: coords.lat, lng: coords.lng });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          placeholder="Busca tu dirección (calle, número, comuna)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarDireccion())}
          className="flex-1 border border-tierra-claro rounded-lg px-3 py-2 text-sm"
        />
        <button type="button" onClick={buscarDireccion} disabled={buscando}
          className="px-4 py-2 bg-tierra-oscuro text-white rounded-lg text-sm disabled:opacity-50">
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      <div ref={mapRef} className="w-full h-72 rounded-lg overflow-hidden border border-tierra-claro" />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {direccionSeleccionada && (
        <p className="text-sm text-gray-600">📍 {direccionSeleccionada}</p>
      )}

      <button type="button" onClick={confirmar}
        className="w-full border border-verde text-verde py-2 rounded-lg font-semibold hover:bg-verde-claro transicion-suave">
        Confirmar esta dirección
      </button>
    </div>
  );
}