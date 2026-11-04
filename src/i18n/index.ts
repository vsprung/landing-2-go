import pl from './pl.json';
import en from './en.json';

export const locales = ['pl', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pl';

const dictionaries = { pl, en } as const;
export type Dictionary = typeof pl;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] as Dictionary;
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'pl' ? 'en' : 'pl';
}

/**
 * Route keys exist because the two locales use different slugs
 * (/dziekujemy vs /en/thank-you). A naive prefix swap would 404.
 */
export const routes = {
  home: { pl: '/', en: '/en/' },
  thanks: { pl: '/dziekujemy', en: '/en/thank-you' },
  privacy: { pl: '/polityka-prywatnosci', en: '/en/privacy-policy' },
} as const;

export type RouteKey = keyof typeof routes;

export function route(key: RouteKey, locale: Locale): string {
  return routes[key][locale];
}

export function absoluteUrl(path: string, site: URL | undefined): string {
  const origin = site?.origin ?? 'https://alu3.pages.dev';
  return new URL(path, origin).toString();
}
