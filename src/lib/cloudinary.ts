import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // nunca se expone al frontend
  secure: true,
});

// Genera una firma temporal para que el navegador suba directo a Cloudinary
// sin exponer el api_secret. El folder queda fijo en el backend para evitar
// que el cliente decida rutas arbitrarias.
export function generateUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'mueble-vivo/productos';
  const allowed_formats = 'jpg,png,webp';

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, allowed_formats },
    process.env.CLOUDINARY_API_SECRET as string,
  );

  return {
    timestamp,
    folder,
    allowed_formats,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    maxFileSizeBytes: 5 * 1024 * 1024,
  };
}
