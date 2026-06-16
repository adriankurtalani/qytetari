'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Map,
  PlusCircle,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  Building2,
  Megaphone,
  Settings,
  Landmark,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { SiteLogo } from '@/components/layout/SiteLogo';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { useAuthSession } from '@/hooks/useAuthSession';

export function Navbar() {
  const pathname = usePathname();
  const settings = useSiteSettings();
  const { supabase, profile, unreadCount } = useAuthSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const navLinks = [
    { href: '/', label: 'Raportimet', icon: Megaphone },
    { href: '/map', label: 'Harta', icon: Map },
    { href: '/businesses', label: 'Bizneset', icon: Building2 },
  ];

  const iconBtn =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600';

  const mobileNavItem =
    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium min-h-[44px]';

  return (
    <nav
      className={cn(
        'sticky top-0 z-40 safe-top transition-all duration-300',
        scrolled
          ? 'border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md'
          : 'border-b border-transparent bg-white'
      )}
    >
      <div className="page-container">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3 group shrink">
            <SiteLogo size="md" className="group-hover:shadow-lg transition-shadow" />
            <div className="hidden min-w-0 sm:block">
              <span className="font-bold text-slate-900 tracking-tight truncate block">
                {settings.platform_name}
              </span>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5 truncate">
                {settings.platform_tagline}
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <Link href="/reports/new">
              <Button size="sm" className="ml-2 gap-1.5 shadow-md">
                <PlusCircle className="h-4 w-4" />
                Raporto
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {profile ? (
              <>
                {profile.role === 'admin' && (
                  <Link href="/admin" className={cn(iconBtn, 'hidden sm:flex')} title="Admin">
                    <Shield className="h-5 w-5" />
                  </Link>
                )}
                {profile.role === 'business' && (
                  <Link href="/business" className={cn(iconBtn, 'hidden sm:flex')} title="Biznesi">
                    <Building2 className="h-5 w-5" />
                  </Link>
                )}
                {profile.role === 'municipality' && (
                  <Link href="/municipality" className={cn(iconBtn, 'hidden sm:flex')} title="Komuna">
                    <Landmark className="h-5 w-5" />
                  </Link>
                )}
                <Link href="/notifications" className={cn(iconBtn, 'relative')} title="Njoftimet">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile" className={cn(iconBtn, 'hidden sm:flex')} title="Profili">
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className={cn(iconBtn, 'hidden sm:flex hover:text-red-600')}
                  title="Dil"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Hyr</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Regjistrohu</Button>
                </Link>
              </div>
            )}

            <button
              className={cn(iconBtn, 'md:hidden')}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1 animate-fade-in max-h-[calc(100dvh-3.5rem)] overflow-y-auto safe-bottom">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    mobileNavItem,
                    pathname === link.href ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
            <Link href="/reports/new" onClick={() => setMobileOpen(false)} className="block px-4 pt-2">
              <Button className="w-full gap-2 min-h-[44px]">
                <PlusCircle className="h-4 w-4" />
                Raporto Problem
              </Button>
            </Link>

            {profile && (
              <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                {profile.role === 'admin' && (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={cn(mobileNavItem, pathname === '/admin' ? 'bg-blue-50 text-blue-700' : 'text-slate-600')}
                    >
                      <Shield className="h-4 w-4 shrink-0" />
                      Paneli i Administratorit
                    </Link>
                    <Link
                      href="/admin/settings"
                      onClick={() => setMobileOpen(false)}
                      className={cn(mobileNavItem, pathname === '/admin/settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600')}
                    >
                      <Settings className="h-4 w-4 shrink-0" />
                      Cilësimet e Platformës
                    </Link>
                  </>
                )}
                {profile.role === 'business' && (
                  <Link
                    href="/business"
                    onClick={() => setMobileOpen(false)}
                    className={cn(mobileNavItem, pathname === '/business' ? 'bg-blue-50 text-blue-700' : 'text-slate-600')}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    Paneli i Biznesit
                  </Link>
                )}
                {profile.role === 'municipality' && (
                  <Link
                    href="/municipality"
                    onClick={() => setMobileOpen(false)}
                    className={cn(mobileNavItem, pathname === '/municipality' ? 'bg-blue-50 text-blue-700' : 'text-slate-600')}
                  >
                    <Landmark className="h-4 w-4 shrink-0" />
                    Portali i Komunes
                  </Link>
                )}
                <Link
                  href="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className={cn(mobileNavItem, pathname === '/notifications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600')}
                >
                  <Bell className="h-4 w-4 shrink-0" />
                  Njoftimet
                  {unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={cn(mobileNavItem, pathname === '/profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600')}
                >
                  <User className="h-4 w-4 shrink-0" />
                  Profili Im
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className={cn(mobileNavItem, 'w-full text-left text-red-600')}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Dil nga llogaria
                </button>
              </div>
            )}

            {!profile && (
              <div className="flex gap-2 px-4 pt-3 border-t border-slate-100 mt-2">
                <Link href="/auth/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full min-h-[44px]" size="sm">Hyr</Button>
                </Link>
                <Link href="/auth/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full min-h-[44px]" size="sm">Regjistrohu</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
