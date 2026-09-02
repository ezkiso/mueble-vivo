export default function cloudinaryLoader({ src, width, quality }) {
  // Optimizaciones extremas para carga ultra rápida
  const params = [
    'f_auto',           // Formato automático (WebP cuando sea posible)
    'c_limit',          // Crop limit
    `w_${width}`,       // Ancho específico
    `q_${quality || '60'}`, // Calidad reducida a 60 para máxima velocidad
    'dpr_1',            // DPR fijo en 1 para reducir tamaño
    'fl_progressive',   // Carga progresiva para JPEG
    'e_blur:100',       // Blur más fuerte durante carga
    'e_trim',           // Recortar espacios vacíos
  ];
  return `${src}?${params.join('&')}`;
}
