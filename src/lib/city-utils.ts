import { KOSOVO_CITIES } from './constants';

/** Normalize city for comparison (handles ë/Prishtina vs Prishtinë). */
export function normalizeCityKey(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/ë/g, 'e')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/** Resolve to canonical label from KOSOVO_CITIES when possible. */
export function getCanonicalCity(city: string): string {
  const key = normalizeCityKey(city);
  const match = KOSOVO_CITIES.find((c) => normalizeCityKey(c) === key);
  return match ?? city.trim();
}
