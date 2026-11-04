import type { APIRoute } from 'astro';
import { routes } from '../i18n';

const INDEXABLE = ['home', 'privacy'] as const;

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? 'https://alu3.pages.dev';
  const urls = INDEXABLE.flatMap((key) =>
    (['pl', 'en'] as const).map((locale) => {
      const loc = new URL(routes[key][locale], origin).toString();
      const alternates = (['pl', 'en'] as const)
        .map(
          (alt) =>
            `<xhtml:link rel="alternate" hreflang="${alt}" href="${new URL(routes[key][alt], origin)}"/>`,
        )
        .join('');
      return `<url><loc>${loc}</loc>${alternates}<xhtml:link rel="alternate" hreflang="x-default" href="${new URL(routes[key].pl, origin)}"/></url>`;
    }),
  ).join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
