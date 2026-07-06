import type { Metadata } from 'next';
import { Lora, Nunito } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import BotonWhatsapp from '@/components/BotonWhatsapp';

const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: { default: 'Mueble Vivo — Terrarios artesanales', template: '%s | Mueble Vivo' },
  description: 'Terrarios artesanales hechos a mano en Chile. Trae un pedazo de bosque a tu hogar.',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'Mueble Vivo',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Mueble Vivo',
    url: baseUrl,
    description: 'Terrarios artesanales hechos a mano en Chile.',
  };

  return (
    <html lang="es-CL">
      <body className={`${lora.variable} ${nunito.variable} font-cuerpo bg-[#FAF8F5] text-texto`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Header />
        {children}
        <Footer />
        <CartDrawer />
        <BotonWhatsapp />
      </body>
    </html>
  );
}