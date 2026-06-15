import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { buildContentSecurityPolicy } from '@/lib/csp';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy());
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
