import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Replace with the production domain once it is bought (see spec §10).
  site: 'https://alu3.pages.dev',
  output: 'static',
  i18n: {
    defaultLocale: 'pl',
    locales: ['pl', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  vite: { plugins: [tailwindcss()] },
});
