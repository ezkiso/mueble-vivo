export default function cloudinaryLoader({ src, width, quality }) {
  // Optimizaciones ultra agresivas para carga rápida
  const params = [
    'f_auto',           // Formato automático (WebP cuando sea posible)
    'c_limit',          // Crop limit
    `w_${width}`,       // Ancho específico
    `q_${quality || '70'}`, // Calidad reducida a 70 para carga más rápida
    'dpr_1',            // DPR fijo en 1 para reducir tamaño
    'fl_progressive',   // Carga progresiva para JPEG
    'e_blur:50',        // Blur ligero durante carga
  ];
  return `${src}?${params.join('&')}`;
}
