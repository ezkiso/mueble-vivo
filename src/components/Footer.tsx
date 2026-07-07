import Link from 'next/link';
import { Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contacto" className="bg-tierra-oscuro text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-6 sm:grid-cols-4">
        <div>
          <h3 className="font-titulo text-lg mb-2">Mueble Vivo</h3>
          <p className="text-sm text-tierra-claro">Terrarios artesanales hechos a mano en Chile.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Contacto</h4>
          <p className="text-sm text-tierra-claro">hola@mueblevivo.cl</p>
          <p className="text-sm text-tierra-claro">Santiago, Chile</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Síguenos</h4>
          <div className="flex gap-4">
            <a href="#" aria-label="Instagram" className="text-tierra-claro hover:text-white transicion-suave">
              <Instagram size={22} />
            </a>
            <a href="#" aria-label="Facebook" className="text-tierra-claro hover:text-white transicion-suave">
              <Facebook size={22} />
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Servicio exclusivo</h4>
          <Link href="/personalizados" className="group inline-flex items-start gap-2">
            <span className="relative flex h-2.5 w-2.5 mt-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verde-claro opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-verde-claro" />
            </span>
            <span className="text-sm text-tierra-claro group-hover:text-white transicion-suave">
              <span className="font-semibold text-white">🌿 Terrarios Personalizados</span>
              <br />
              Elige tu jarro, sustrato, plantas y decoración. Cotiza el tuyo.
            </span>
          </Link>
        </div>
      </div>
      <div className="text-center text-xs text-tierra-claro py-4 border-t border-white/10">
        © {new Date().getFullYear()} Mueble Vivo. Todos los derechos reservados.
      </div>
    </footer>
  );
}