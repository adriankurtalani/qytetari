import { KOSOVO_CITIES, LAUNCH_CITY, OTHER_CITIES_LAUNCH_MESSAGE } from './constants';
import { normalizeCityKey } from './city-utils';

export interface CitySelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function isLaunchCity(city: string): boolean {
  return normalizeCityKey(city) === normalizeCityKey(LAUNCH_CITY);
}

/** Dropdown: vetëm qyteti aktiv është i zgjedhshëm; të tjerët shfaqen të çaktivizuar. */
export function getLaunchCitySelectOptions(emptyLabel?: string): CitySelectOption[] {
  const leading = emptyLabel ? [{ value: '', label: emptyLabel, disabled: false }] : [];

  return [
    ...leading,
    ...KOSOVO_CITIES.map((city) => ({
      value: city,
      label: city,
      disabled: city !== LAUNCH_CITY,
    })),
  ];
}

export { LAUNCH_CITY, OTHER_CITIES_LAUNCH_MESSAGE } from './constants';
