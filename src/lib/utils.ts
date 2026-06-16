import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { sq } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: sq });
}

export function formatTimelineDate(date: string) {
  return format(new Date(date), 'd MMM', { locale: sq });
}

export function formatRelativeDate(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: sq });
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

export function generateAnonymousId(): string {
  if (typeof window !== 'undefined') {
    let id = localStorage.getItem('anonymous_id');
    if (!id) {
      id = `anon_${crypto.randomUUID()}`;
      localStorage.setItem('anonymous_id', id);
    }
    return id;
  }
  return `anon_${crypto.randomUUID()}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
