export default function Footer() {
  return (
    <footer id="contacto" className="bg-tierra-oscuro text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-6 sm:grid-cols-3">
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
          <div className="flex gap-4 text-sm text-tierra-claro">
            <a href="#" className="hover:text-white transicion-suave">Instagram</a>
            <a href="#" className="hover:text-white transicion-suave">Facebook</a>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-tierra-claro py-4 border-t border-white/10">
        © {new Date().getFullYear()} Mueble Vivo. Todos los derechos reservados.
      </div>
    </footer>
  );
}
