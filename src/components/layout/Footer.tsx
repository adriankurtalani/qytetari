'use client';

import Link from 'next/link';
import { Map, Shield } from 'lucide-react';
import { SiteLogo } from '@/components/layout/SiteLogo';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

export function Footer() {
  const settings = useSiteSettings();

  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="page-container py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <SiteLogo size="md" />
              <span className="font-bold text-slate-900">{settings.platform_name}</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              {settings.footer_description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Lidhje të shpejta</h3>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">Raportimet</Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <Map className="h-3.5 w-3.5" /> Harta interaktive
                </Link>
              </li>
              <li>
                <Link href="/reports/new" className="hover:text-blue-600 transition-colors">Raporto problem</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Misioni ynë</h3>
            <p className="text-sm text-slate-500 leading-relaxed flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              {settings.mission_text}
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {settings.platform_name}. Të gjitha të drejtat e rezervuara.</p>
          <p>{settings.footer_tagline}</p>
        </div>
      </div>
    </footer>
  );
}
