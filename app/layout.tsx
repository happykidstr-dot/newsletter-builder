import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BÜLTEN READ | Project Factory',
  description: 'Profesyonel e-bültenler oluşturun — Sürükle & Bırak, AI içerik üretimi ve erişilebilir bülten tasarımı',
  keywords: 'newsletter, bülten, e-bülten, builder, editor, AI, erişilebilirlik',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
