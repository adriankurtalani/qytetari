'use client';

import Link from 'next/link';
import { SiteLogo } from '@/components/layout/SiteLogo';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const settings = useSiteSettings();

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-8 xl:p-12">
        <div className="max-w-md text-white">
          <SiteLogo size="lg" className="mb-8 !shadow-lg" />
          <h2 className="text-3xl font-bold leading-tight">{settings.platform_name}</h2>
          <p className="mt-4 text-blue-100 leading-relaxed">{settings.site_description}</p>
          <div className="mt-8 flex gap-6 text-sm text-blue-200">
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p>Falas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">24/7</p>
              <p>Raportim</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">GPS</p>
              <p>Lokacion i saktë</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-3.5 sm:px-4 py-6 sm:py-12 bg-slate-50 min-w-0">
        <div className="w-full max-w-md animate-fade-in min-w-0">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-6 sm:mb-8">
            <SiteLogo size="sm" />
            <span className="font-bold text-slate-900 truncate">{settings.platform_name}</span>
          </Link>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">{title}</h1>
            <p className="text-slate-500 mt-2 text-sm break-words">{subtitle}</p>
          </div>

          <div className="card rounded-2xl p-5 sm:p-8">{children}</div>

          <p className="text-center text-sm text-slate-500 mt-5 sm:mt-6 break-words px-1">{footer}</p>
        </div>
      </div>
    </div>
  );
}
