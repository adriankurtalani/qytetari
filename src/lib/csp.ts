/**
 * Content Security Policy for Zëri i Qytetarit.
 * React/Next.js dev mode requires 'unsafe-eval' for debugging (stack traces, HMR).
 * Production builds do not use eval and omit it.
 */
export function buildContentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV === 'development';

  let supabaseHost = '*.supabase.co';
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
    }
  } catch {
    // Keep wildcard fallback when env URL is invalid during build.
  }

  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  const connectSrc = [
    "'self'",
    `https://${supabaseHost}`,
    `wss://${supabaseHost}`,
    'https://nominatim.openstreetmap.org',
    ...(isDev
      ? [
          'ws://localhost:*',
          'wss://localhost:*',
          'http://localhost:*',
          'https://localhost:*',
        ]
      : []),
  ].join(' ');

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: https://${supabaseHost} https://*.tile.openstreetmap.org https://tile.openstreetmap.org`,
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}
