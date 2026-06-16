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

/** All spellings to match in DB queries for a municipality jurisdiction. */
export function getCityFilterValues(jurisdiction: string): string[] {
  const canonical = getCanonicalCity(jurisdiction);
  const key = normalizeCityKey(canonical);
  const variants = new Set<string>([canonical, jurisdiction.trim()]);

  for (const c of KOSOVO_CITIES) {
    if (normalizeCityKey(c) === key) {
      variants.add(c);
      variants.add(c.replace(/ë/g, 'e').replace(/ç/g, 'c'));
    }
  }

  // Common English/informal spellings
  if (key === 'prishtine') {
    variants.add('Prishtina');
    variants.add('Prishtine');
    variants.add('Pristina');
  }

  return [...variants];
}

export function cityMatchesJurisdiction(reportCity: string, jurisdiction: string): boolean {
  return normalizeCityKey(reportCity) === normalizeCityKey(getCanonicalCity(jurisdiction));
}
