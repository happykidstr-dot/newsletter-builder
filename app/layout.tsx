import type { Metadata } from 'next';
import './globals.css';

// Conditionally import Clerk only if keys are available
let ClerkProvider: any = null;
try {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    ClerkProvider = require('@clerk/nextjs').ClerkProvider;
  }
} catch {}

export const metadata: Metadata = {
  title: 'Newsletter Builder | Project Factory',
  description: 'Profesyonel e-bültenler oluşturun — Sürükle & Bırak, AI içerik üretimi, NotebookLM entegrasyonu',
  keywords: 'newsletter, bülten, e-bülten, builder, editor, AI, NotebookLM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = (
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

  // Wrap with Clerk only if configured
  if (ClerkProvider) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
