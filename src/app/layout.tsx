import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SiteSettingsProvider } from '@/components/providers/SiteSettingsProvider';
import { getSiteSettings } from '@/lib/site-settings';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.site_title,
    description: settings.site_description,
    icons: {
      icon: [
        { url: '/icon', sizes: '32x32', type: 'image/png' },
        ...(settings.favicon_url
          ? [{ url: settings.favicon_url, sizes: 'any' as const }]
          : []),
      ],
      shortcut: '/icon',
      apple: '/apple-icon',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="sq" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col overflow-x-hidden">
        <SiteSettingsProvider settings={settings}>
          <Navbar />
          <main className="flex-1 min-w-0 w-full">{children}</main>
          <Footer />
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
