// Permite importar archivos .css como efectos secundarios (ej. import 'leaflet/dist/leaflet.css')
// sin que TypeScript se queje de que no encuentra declaraciones de tipo (TS2882).
// Next.js ya maneja esto en tiempo de build vía webpack; esto solo calma al editor/tsc.
declare module '*.css';