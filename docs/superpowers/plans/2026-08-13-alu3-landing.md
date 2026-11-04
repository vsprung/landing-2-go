# ALU3 Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a bilingual (PL/EN) lead-generation landing page for a Gdańsk gates-and-paving contractor, hosted on Cloudflare Pages, where every submitted lead reaches both an email inbox and a Telegram chat.

**Architecture:** A static Astro site with no client framework. All copy lives in JSON dictionaries and is injected at build time. The only server-side code is a single Cloudflare Pages Function that validates a lead and fans it out to Web3Forms (email) and the Telegram Bot API. Client-side JavaScript is limited to four small vanilla-TypeScript islands: the lead form, the before/after slider, the scroll reveal, and the language hint.

**Tech Stack:** Astro 7 (static output), TypeScript (strict), Tailwind CSS 4, Vitest, Cloudflare Pages + Pages Functions, Web3Forms, Telegram Bot API.

**Source documents:** [`docs/superpowers/specs/2026-08-13-ALU3-landing-design.md`](../specs/2026-08-13-ALU3-landing-design.md) (design spec) and [`info/SPEC.md`](../../../info/SPEC.md) (original product spec).

---

## File Structure

```
astro.config.mjs              Astro config: site URL, i18n, Tailwind plugin
package.json                  Scripts: dev, build, preview, test, lint, format, check:i18n
tsconfig.json                 strict: true
eslint.config.js              ESLint flat config for Astro + TS
.prettierrc                   Prettier with the Astro plugin
.env.example                  Placeholder secrets, committed
wrangler.toml                 Pages project name, for `wrangler pages dev`

public/
  fonts/inter-variable.woff2  Self-hosted Inter, latin + latin-ext
  images/placeholders/*.svg   Moved from docs/design/placeholders/
  robots.txt                  Static, references the sitemap

src/
  i18n/
    pl.json                   Polish copy (copied from docs/content/)
    en.json                   English copy (copied from docs/content/)
    index.ts                  Locale list, dictionary lookup, route map, path helpers
  styles/
    global.css                Tailwind import, design tokens, base element styles
  lib/
    validate.ts               Lead validation shared by the browser and the Function
    services.ts               The canonical list of service option values
  scripts/
    form.ts                   Lead form island: validation, submit, UI states
    before-after.ts           Drag slider island
    reveal.ts                 IntersectionObserver section reveal
    lang-hint.ts              Browser-language hint bar
  components/
    Seo.astro                 Title, description, canonical, hreflang, OG, JSON-LD
    Icon.astro                Inline Lucide SVG by name
    TopBar.astro              Sticky thin bar with phone, language switcher, CTA
    Hero.astro                Headline, lead, photo, compact form slot
    TrustBar.astro            Four static figures
    Pain.astro                Three objections with answers
    Services.astro            Three service cards
    WhyUs.astro               Four differentiators
    Process.astro             Four steps with duration badges
    Gallery.astro             Scroll-snap grid of six projects
    BeforeAfter.astro         Drag-to-compare slider
    Testimonials.astro        Three testimonial cards, hidden while placeholder
    Faq.astro                 Native details/summary accordion
    LeadForm.astro            One component, `variant="compact" | "full"`
    Contacts.astro            Contact details plus click-to-load map
    Footer.astro              Legal details and in-page navigation
    StickyCta.astro           Mobile-only bottom bar
  layouts/
    Base.astro                html/head/body shell, skip link, global styles
  pages/
    index.astro               PL landing page
    dziekujemy.astro          PL thank-you page
    polityka-prywatnosci.astro PL privacy policy
    en/index.astro            EN landing page
    en/thank-you.astro        EN thank-you page
    en/privacy-policy.astro   EN privacy policy
    sitemap.xml.ts            Generated sitemap

functions/
  api/lead.ts                 Cloudflare Pages Function: validate, honeypot, fan-out

tests/
  i18n.test.ts                Dictionary key parity and non-empty values
  validate.test.ts            Lead validator boundary cases

scripts/
  check-no-hardcoded-copy.sh  CI guard: no Polish diacritics in .astro outside i18n/
```

**Responsibility boundaries.** `src/lib/validate.ts` is the single source of truth for what a valid lead is; both `src/scripts/form.ts` and `functions/api/lead.ts` import it, so client and server can never drift. `src/i18n/index.ts` owns every locale decision — the list of locales, which dictionary applies, and how a page maps to its counterpart in the other language. Components never reach for raw strings; they receive a dictionary object.

---

## Task 1: Project Initialisation

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.prettierrc`, `eslint.config.js`, `.env.example`, `README.md`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Scaffold Astro**

```bash
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git --skip-houston
npm install
```

- [ ] **Step 2: Add Tailwind, Vitest and tooling**

```bash
npm install tailwindcss @tailwindcss/vite
npm install -D vitest eslint eslint-plugin-astro @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier prettier-plugin-astro wrangler
```

- [ ] **Step 3: Write `astro.config.mjs`**

```js
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
```

- [ ] **Step 4: Write `.prettierrc`**

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": true,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

- [ ] **Step 5: Write `eslint.config.js`**

```js
import eslintPluginAstro from 'eslint-plugin-astro';

export default [
  ...eslintPluginAstro.configs.recommended,
  { ignores: ['dist/', '.astro/', 'node_modules/'] },
];
```

- [ ] **Step 6: Add scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "wrangler pages dev dist",
    "test": "vitest run",
    "lint": "eslint . && astro check",
    "format": "prettier --write .",
    "check:copy": "bash scripts/check-no-hardcoded-copy.sh"
  }
}
```

- [ ] **Step 7: Write `.env.example`**

```bash
# Web3Forms access key — https://web3forms.com (free plan, 250 submissions/month)
WEB3FORMS_ACCESS_KEY=00000000-0000-0000-0000-000000000000

# Telegram bot token from @BotFather
TELEGRAM_BOT_TOKEN=0000000000:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

# Numeric chat ID that receives the leads (personal chat or group)
TELEGRAM_CHAT_ID=000000000
```

- [ ] **Step 8: Append to `.gitignore`**

```
.env
.env.*
!.env.example
dist/
.astro/
.wrangler/
node_modules/
```

- [ ] **Step 9: Verify the dev server boots**

Run: `npm run dev`
Expected: Astro prints `astro  v5.x ready in … ms` and `http://localhost:4321/` serves the default page without errors. Stop with Ctrl-C.

- [ ] **Step 10: Verify the build passes**

Run: `npm run build`
Expected: exit code 0, `dist/index.html` exists.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project with Tailwind, ESLint, Prettier and Vitest"
```

---

## Task 2: First Deploy to Cloudflare Pages

> **Deferred by the client (2026-08-13).** Everything is built and tested locally first;
> the Cloudflare project is created only after Task 17. Steps 1 and 2 of this task
> (`wrangler.toml` and the initial push) still run in order, because `wrangler pages dev`
> needs the config file. Steps 3–5 run between Task 17 and Task 18.
> Until then, `npm run preview` serves the Function locally and secrets live in `.dev.vars`.

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 1: Write `wrangler.toml`**

```toml
name = "alu3"
pages_build_output_dir = "dist"
compatibility_date = "2026-08-01"
```

- [ ] **Step 2: Push the repository to GitHub**

```bash
git push -u origin main
```

- [ ] **Step 3: Connect the repository in the Cloudflare dashboard**

In Cloudflare → Workers & Pages → Create → Pages → Connect to Git, pick `forevord/landing-2-go`. Build command: `npm run build`. Build output directory: `dist`. Production branch: `main`.

- [ ] **Step 4: Add the three secrets**

In the same project → Settings → Variables and Secrets, add `WEB3FORMS_ACCESS_KEY`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as **secrets** (not plain text), for both Production and Preview.

- [ ] **Step 5: Verify the deployment**

Open the `*.pages.dev` URL that Cloudflare prints.
Expected: the placeholder Astro page loads over HTTPS.

- [ ] **Step 6: Commit**

```bash
git add wrangler.toml
git commit -m "chore: add wrangler config for Cloudflare Pages"
```

---

## Task 3: i18n Foundation

**Files:**
- Create: `src/i18n/pl.json`, `src/i18n/en.json` (copied from `docs/content/`)
- Create: `src/i18n/index.ts`
- Test: `tests/i18n.test.ts`

The dictionaries already exist as drafts. This task moves them into the source tree and builds the helper that every component will use.

- [ ] **Step 1: Copy the dictionaries**

```bash
mkdir -p src/i18n
cp docs/content/pl.json src/i18n/pl.json
cp docs/content/en.json src/i18n/en.json
```

- [ ] **Step 2: Write the failing test**

Create `tests/i18n.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import pl from '../src/i18n/pl.json';
import en from '../src/i18n/en.json';

function collectKeys(value: unknown, prefix = ''): Set<string> {
  const keys = new Set<string>();
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const path = `${prefix}${index}.`;
      keys.add(`${prefix}${index}`);
      collectKeys(item, path).forEach((k) => keys.add(k));
    });
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const path = `${prefix}${key}`;
      keys.add(path);
      collectKeys(child, `${path}.`).forEach((k) => keys.add(k));
    }
  }
  return keys;
}

function collectEmptyStrings(value: unknown, prefix = ''): string[] {
  const empty: string[] = [];
  if (typeof value === 'string' && value.trim() === '') {
    empty.push(prefix.replace(/\.$/, ''));
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => empty.push(...collectEmptyStrings(item, `${prefix}${index}.`)));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      empty.push(...collectEmptyStrings(child, `${prefix}${key}.`));
    }
  }
  return empty;
}

describe('dictionaries', () => {
  it('have identical key sets', () => {
    const plKeys = collectKeys(pl);
    const enKeys = collectKeys(en);
    const missingInEn = [...plKeys].filter((k) => !enKeys.has(k)).sort();
    const missingInPl = [...enKeys].filter((k) => !plKeys.has(k)).sort();
    expect(missingInEn).toEqual([]);
    expect(missingInPl).toEqual([]);
  });

  it('contain no empty strings', () => {
    expect(collectEmptyStrings(pl)).toEqual([]);
    expect(collectEmptyStrings(en)).toEqual([]);
  });

  it('leave no unresolved placeholders in production builds', () => {
    // This assertion is expected to FAIL until the client supplies the real data.
    // Un-skip it as the final pre-launch gate (Task 18).
    const serialised = JSON.stringify(pl) + JSON.stringify(en);
    const unresolved = serialised.match(/\{\{[A-Z_]+\}\}/g) ?? [];
    expect.soft(unresolved).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify the first two cases pass and the third soft-fails**

Run: `npx vitest run tests/i18n.test.ts`
Expected: the parity and empty-string tests PASS; the placeholder test reports a soft failure listing `{{TELEFON}}`, `{{LATA}}` and the rest. That soft failure is the intended state until launch.

- [ ] **Step 4: Write `src/i18n/index.ts`**

```ts
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
```

- [ ] **Step 5: Verify TypeScript accepts the JSON imports**

Run: `npx astro check`
Expected: 0 errors. If it reports that JSON modules cannot be imported, add `"resolveJsonModule": true` to `compilerOptions` in `tsconfig.json` and re-run.

- [ ] **Step 6: Commit**

```bash
git add src/i18n tests/i18n.test.ts tsconfig.json
git commit -m "feat: add locale dictionaries, i18n helpers and parity test"
```

---

## Task 4: Design Tokens and Global Styles

**Files:**
- Create: `src/styles/global.css`
- Create: `public/fonts/inter-variable.woff2`

- [ ] **Step 1: Download the Inter variable font with the Latin Extended subset**

```bash
mkdir -p public/fonts
curl -L -o public/fonts/inter-variable.woff2 \
  "https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-ext-wght-normal.woff2"
```

Verify: `ls -lh public/fonts/inter-variable.woff2` shows a file of roughly 30–60 KB. If the download fails, fetch the equivalent file manually from https://fontsource.org/fonts/inter — the requirement is a variable `.woff2` covering `latin-ext`, because Polish diacritics live in that subset.

- [ ] **Step 2: Write `src/styles/global.css`**

```css
@import 'tailwindcss';

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB,
    U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

@theme {
  --color-ink: #0f172a;
  --color-ink-soft: #1e293b;
  --color-primary: #334155;
  --color-muted: #64748b;
  --color-cta: #c2410c;
  --color-cta-hover: #ea580c;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-error: #dc2626;
  --color-success: #059669;

  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --radius-control: 4px;
  --radius-card: 8px;

  --shadow-card: 0 1px 2px rgb(15 23 42 / 0.06);
  --shadow-raised: 0 8px 24px rgb(15 23 42 / 0.12);
}

:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --dur-press: 120ms;
  --dur-hover: 160ms;
  --dur-enter: 300ms;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-sans);
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 1rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

:where(a, button, input, select, textarea, summary):focus-visible {
  outline: 2px solid var(--color-cta-hover);
  outline-offset: 2px;
}

/* Scroll reveal. Elements start hidden only when JS is available,
   so the page stays fully readable without it. */
.js [data-reveal] {
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity var(--dur-enter) var(--ease-out),
    transform var(--dur-enter) var(--ease-out);
}

.js [data-reveal].is-visible {
  opacity: 1;
  transform: none;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 1.5rem;
  border-radius: var(--radius-control);
  font-weight: 600;
  transition: transform var(--dur-press) var(--ease-out),
    background-color var(--dur-hover) var(--ease-out);
}

.btn:active {
  transform: scale(0.97);
}

.btn-primary {
  background: var(--color-cta);
  color: #fff;
}

@media (hover: hover) and (pointer: fine) {
  .btn-primary:hover {
    background: var(--color-cta-hover);
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .js [data-reveal] {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 3: Verify the build still passes**

Run: `npm run build`
Expected: exit code 0 and `dist/_astro/*.css` containing `--color-cta`.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css public/fonts
git commit -m "feat: add design tokens, self-hosted Inter and motion primitives"
```

---

## Task 5: Base Layout and SEO Component

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/components/Seo.astro`

- [ ] **Step 1: Write `src/components/Seo.astro`**

```astro
---
import { absoluteUrl, route, type Locale, type RouteKey } from '../i18n';

interface Props {
  locale: Locale;
  routeKey: RouteKey;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageAlt?: string;
  noindex?: boolean;
}

const { locale, routeKey, title, description, ogTitle, ogDescription, ogImageAlt, noindex } =
  Astro.props;

const canonical = absoluteUrl(route(routeKey, locale), Astro.site);
const plHref = absoluteUrl(route(routeKey, 'pl'), Astro.site);
const enHref = absoluteUrl(route(routeKey, 'en'), Astro.site);
const ogImage = absoluteUrl('/images/og-default.jpg', Astro.site);
---

<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
{noindex && <meta name="robots" content="noindex" />}

<link rel="alternate" hreflang="pl" href={plHref} />
<link rel="alternate" hreflang="en" href={enHref} />
<link rel="alternate" hreflang="x-default" href={plHref} />

<meta property="og:type" content="website" />
<meta property="og:url" content={canonical} />
<meta property="og:title" content={ogTitle ?? title} />
<meta property="og:description" content={ogDescription ?? description} />
<meta property="og:image" content={ogImage} />
{ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
<meta property="og:locale" content={locale === 'pl' ? 'pl_PL' : 'en_GB'} />
<meta name="twitter:card" content="summary_large_image" />
```

- [ ] **Step 2: Write `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import Seo from '../components/Seo.astro';
import { getDictionary, type Locale, type RouteKey } from '../i18n';

interface Props {
  locale: Locale;
  routeKey: RouteKey;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageAlt?: string;
  noindex?: boolean;
}

const { locale, routeKey, ...seo } = Astro.props;
const t = getDictionary(locale);
---

<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preload" href="/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin />
    <Seo locale={locale} routeKey={routeKey} {...seo} />
    <script is:inline>
      // Marks JS availability before first paint so reveal styles never hide
      // content for users without JavaScript.
      document.documentElement.classList.add('js');
    </script>
  </head>
  <body>
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
      {t.a11y.skipToContent}
    </a>
    <slot />
  </body>
</html>
```

- [ ] **Step 3: Wire a minimal PL page to prove the layout renders**

Replace `src/pages/index.astro` with:

```astro
---
import Base from '../layouts/Base.astro';
import { getDictionary } from '../i18n';

const locale = 'pl' as const;
const t = getDictionary(locale);
---

<Base
  locale={locale}
  routeKey="home"
  title={t.seo.title}
  description={t.seo.description}
  ogTitle={t.seo.ogTitle}
  ogDescription={t.seo.ogDescription}
  ogImageAlt={t.seo.ogImageAlt}
>
  <main id="main">
    <h1>{t.hero.h1}</h1>
  </main>
</Base>
```

- [ ] **Step 4: Verify the head is correct**

Run: `npm run build && grep -A2 'hreflang' dist/index.html`
Expected: three `<link rel="alternate">` tags — `pl`, `en` and `x-default` — and a `<link rel="canonical">` pointing at the site root.

- [ ] **Step 5: Commit**

```bash
git add src/layouts src/components/Seo.astro src/pages/index.astro
git commit -m "feat: add base layout with hreflang, canonical and Open Graph tags"
```

---

## Task 6: Shared Lead Validator

**Files:**
- Create: `src/lib/services.ts`
- Create: `src/lib/validate.ts`
- Test: `tests/validate.test.ts`

This is the only piece of logic shared between the browser and the server, so it is built test-first.

- [ ] **Step 1: Write `src/lib/services.ts`**

```ts
export const SERVICE_VALUES = [
  'brama-przesuwna',
  'brama-skrzydlowa',
  'brama-przemyslowa',
  'automatyka',
  'furtka',
  'ogrodzenie',
  'brukarstwo',
  'pod-klucz',
  'nie-wiem',
] as const;

export type ServiceValue = (typeof SERVICE_VALUES)[number];

export function isServiceValue(value: string): value is ServiceValue {
  return (SERVICE_VALUES as readonly string[]).includes(value);
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/validate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateLead, type LeadInput } from '../src/lib/validate';

const compactValid: LeadInput = {
  phone: '+48 600 123 456',
  service: 'brukarstwo',
  gdpr: true,
  source: 'hero',
};

const fullValid: LeadInput = {
  ...compactValid,
  name: 'Jan',
  city: 'Gdańsk',
  email: 'jan@example.com',
  message: 'Podjazd 40 m2',
  source: 'full',
};

describe('validateLead — compact variant', () => {
  it('accepts a minimal valid lead', () => {
    expect(validateLead(compactValid, 'compact')).toEqual({});
  });

  it('rejects a missing phone number', () => {
    expect(validateLead({ ...compactValid, phone: '' }, 'compact')).toEqual({ phone: 'required' });
  });

  it('rejects a phone number with fewer than 9 digits', () => {
    expect(validateLead({ ...compactValid, phone: '600 12' }, 'compact')).toEqual({
      phone: 'phoneInvalid',
    });
  });

  it('accepts a phone number written with separators', () => {
    expect(validateLead({ ...compactValid, phone: '(58) 555-11-22' }, 'compact')).toEqual({});
  });

  it('rejects an unknown service value', () => {
    expect(validateLead({ ...compactValid, service: 'kosmodrom' }, 'compact')).toEqual({
      service: 'serviceRequired',
    });
  });

  it('rejects a missing GDPR consent', () => {
    expect(validateLead({ ...compactValid, gdpr: false }, 'compact')).toEqual({
      gdpr: 'gdprRequired',
    });
  });

  it('does not require name or city', () => {
    expect(validateLead({ ...compactValid, name: undefined, city: undefined }, 'compact')).toEqual(
      {},
    );
  });
});

describe('validateLead — full variant', () => {
  it('accepts a complete lead', () => {
    expect(validateLead(fullValid, 'full')).toEqual({});
  });

  it('requires a name', () => {
    expect(validateLead({ ...fullValid, name: '' }, 'full')).toEqual({ name: 'required' });
  });

  it('rejects a one-character name', () => {
    expect(validateLead({ ...fullValid, name: 'J' }, 'full')).toEqual({ name: 'nameShort' });
  });

  it('requires a city', () => {
    expect(validateLead({ ...fullValid, city: '  ' }, 'full')).toEqual({ city: 'required' });
  });

  it('accepts an omitted email because it is optional', () => {
    expect(validateLead({ ...fullValid, email: undefined }, 'full')).toEqual({});
  });

  it('rejects a malformed email when one is supplied', () => {
    expect(validateLead({ ...fullValid, email: 'jan@' }, 'full')).toEqual({
      emailInvalid: undefined,
      email: 'emailInvalid',
    });
  });

  it('reports every invalid field at once', () => {
    const errors = validateLead(
      { phone: '', service: '', gdpr: false, name: '', city: '', source: 'full' },
      'full',
    );
    expect(Object.keys(errors).sort()).toEqual(['city', 'gdpr', 'name', 'phone', 'service']);
  });
});
```

Note on the malformed-email case: `toEqual` ignores keys whose value is `undefined`, so the assertion above is equivalent to `{ email: 'emailInvalid' }`. Written explicitly to document that no other field errors.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/validate.test.ts`
Expected: FAIL — `Failed to resolve import "../src/lib/validate"`.

- [ ] **Step 4: Write `src/lib/validate.ts`**

```ts
import { isServiceValue } from './services';

export interface LeadInput {
  name?: string;
  phone: string;
  email?: string;
  service: string;
  city?: string;
  message?: string;
  gdpr: boolean;
  hp?: string;
  source: 'hero' | 'full';
}

export type ErrorCode =
  | 'required'
  | 'nameShort'
  | 'phoneInvalid'
  | 'emailInvalid'
  | 'serviceRequired'
  | 'gdprRequired';

export type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'service' | 'city' | 'gdpr', ErrorCode>>;

export type Variant = 'compact' | 'full';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PHONE_DIGITS = 9;

function countDigits(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}

export function validateLead(input: LeadInput, variant: Variant): FieldErrors {
  const errors: FieldErrors = {};

  const phone = (input.phone ?? '').trim();
  if (phone === '') {
    errors.phone = 'required';
  } else if (countDigits(phone) < MIN_PHONE_DIGITS) {
    errors.phone = 'phoneInvalid';
  }

  const service = (input.service ?? '').trim();
  if (service === '' || !isServiceValue(service)) {
    errors.service = 'serviceRequired';
  }

  if (input.gdpr !== true) {
    errors.gdpr = 'gdprRequired';
  }

  const email = (input.email ?? '').trim();
  if (email !== '' && !EMAIL_PATTERN.test(email)) {
    errors.email = 'emailInvalid';
  }

  if (variant === 'full') {
    const name = (input.name ?? '').trim();
    if (name === '') {
      errors.name = 'required';
    } else if (name.length < 2) {
      errors.name = 'nameShort';
    }

    const city = (input.city ?? '').trim();
    if (city === '') {
      errors.city = 'required';
    }
  }

  return errors;
}

export function isSpam(input: LeadInput): boolean {
  return (input.hp ?? '').trim() !== '';
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/validate.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib tests/validate.test.ts
git commit -m "feat: add shared lead validator with full test coverage"
```

---

## Task 7: Lead Delivery Function

**Files:**
- Create: `functions/api/lead.ts`

- [ ] **Step 1: Write `functions/api/lead.ts`**

```ts
import { isSpam, validateLead, type LeadInput } from '../../src/lib/validate';

interface Env {
  WEB3FORMS_ACCESS_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

const SERVICE_MARKERS: Record<string, string> = {
  'brama-przesuwna': '🚧',
  'brama-skrzydlowa': '🚧',
  'brama-przemyslowa': '🏭',
  automatyka: '⚙️',
  furtka: '🚪',
  ogrodzenie: '🧱',
  brukarstwo: '🧱',
  'pod-klucz': '🚜',
  'nie-wiem': '❓',
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildTelegramMessage(lead: LeadInput): string {
  const marker = SERVICE_MARKERS[lead.service] ?? '📩';
  const lines = [
    `${marker} <b>Nowe zgłoszenie</b> (${lead.source === 'hero' ? 'hero' : 'formularz'})`,
    '',
    `<b>Usługa:</b> ${escapeHtml(lead.service)}`,
    `<b>Telefon:</b> <code>${escapeHtml(lead.phone)}</code>`,
  ];
  if (lead.name) lines.push(`<b>Imię:</b> ${escapeHtml(lead.name)}`);
  if (lead.city) lines.push(`<b>Miejscowość:</b> ${escapeHtml(lead.city)}`);
  if (lead.email) lines.push(`<b>E-mail:</b> ${escapeHtml(lead.email)}`);
  if (lead.message) lines.push('', escapeHtml(lead.message));
  return lines.join('\n');
}

async function sendEmail(lead: LeadInput, env: Env): Promise<void> {
  const response = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: env.WEB3FORMS_ACCESS_KEY,
      subject: `Nowe zgłoszenie: ${lead.service}`,
      from_name: 'ALU3 — formularz',
      Usługa: lead.service,
      Telefon: lead.phone,
      Imię: lead.name ?? '—',
      Miejscowość: lead.city ?? '—',
      'E-mail': lead.email ?? '—',
      Wiadomość: lead.message ?? '—',
      Źródło: lead.source,
    }),
  });
  if (!response.ok) throw new Error(`web3forms ${response.status}`);
}

async function sendTelegram(lead: LeadInput, env: Env): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        text: buildTelegramMessage(lead),
      }),
    },
  );
  if (!response.ok) throw new Error(`telegram ${response.status}`);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: LeadInput;
  try {
    payload = (await request.json()) as LeadInput;
  } catch {
    return Response.json({ ok: false, errors: {} }, { status: 400 });
  }

  // A filled honeypot means a bot. Answer 200 so it never learns it was blocked.
  if (isSpam(payload)) {
    return Response.json({ ok: true }, { status: 200 });
  }

  const variant = payload.source === 'hero' ? 'compact' : 'full';
  const errors = validateLead(payload, variant);
  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, errors }, { status: 422 });
  }

  const results = await Promise.allSettled([sendEmail(payload, env), sendTelegram(payload, env)]);
  const failures = results.filter((r) => r.status === 'rejected');

  for (const failure of failures) {
    console.error('lead delivery failed:', (failure as PromiseRejectedResult).reason);
  }

  if (failures.length === results.length) {
    return Response.json({ ok: false, errors: {} }, { status: 502 });
  }

  return Response.json({ ok: true, partial: failures.length > 0 }, { status: 200 });
};
```

- [ ] **Step 2: Verify the honeypot path locally**

Run in one terminal: `npm run build && npx wrangler pages dev dist`
Run in another:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8788/api/lead \
  -H 'Content-Type: application/json' \
  -d '{"phone":"600123456","service":"brukarstwo","gdpr":true,"source":"hero","hp":"bot"}'
```

Expected: `200`, and nothing arrives in email or Telegram.

- [ ] **Step 3: Verify the validation path**

```bash
curl -s -X POST http://localhost:8788/api/lead \
  -H 'Content-Type: application/json' \
  -d '{"phone":"12","service":"brukarstwo","gdpr":false,"source":"hero"}'
```

Expected: HTTP 422 with body `{"ok":false,"errors":{"phone":"phoneInvalid","gdpr":"gdprRequired"}}`.

- [ ] **Step 4: Verify a real delivery**

Create `.dev.vars` (already git-ignored via `.env.*`) holding the three real secrets, restart `wrangler pages dev dist`, then:

```bash
curl -s -X POST http://localhost:8788/api/lead \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","phone":"600123456","city":"Gdańsk","service":"brukarstwo","gdpr":true,"source":"full","message":"Test delivery"}'
```

Expected: HTTP 200 `{"ok":true,"partial":false}`, one email in the inbox and one Telegram message with the phone number in a copyable code block.

- [ ] **Step 5: Commit**

```bash
git add functions
git commit -m "feat: add lead endpoint with honeypot, validation and email/Telegram fan-out"
```

---

## Task 8: Lead Form Component and Island

**Files:**
- Create: `src/components/LeadForm.astro`
- Create: `src/scripts/form.ts`

- [ ] **Step 1: Write `src/components/LeadForm.astro`**

```astro
---
import { getDictionary, route, type Locale } from '../i18n';

interface Props {
  locale: Locale;
  variant: 'compact' | 'full';
  id: string;
}

const { locale, variant, id } = Astro.props;
const t = getDictionary(locale);
const f = t.form;
const isFull = variant === 'full';
const privacyHref = route('privacy', locale);
---

<form
  id={id}
  class="lead-form grid gap-4 rounded-[--radius-card] bg-surface p-6 shadow-card"
  data-variant={variant}
  novalidate
>
  <p class="text-lg font-semibold text-ink">{isFull ? f.title : f.compactTitle}</p>
  {isFull && <p class="text-sm text-muted">{f.lead}</p>}

  {
    isFull && (
      <label class="grid gap-1.5 text-sm font-medium">
        {f.fields.name.label}
        <input
          type="text"
          name="name"
          autocomplete="given-name"
          placeholder={f.fields.name.placeholder}
          class="min-h-11 rounded-[--radius-control] border border-border px-3"
          required
        />
        <span class="error text-sm text-error" data-error-for="name" aria-live="polite" />
      </label>
    )
  }

  <label class="grid gap-1.5 text-sm font-medium">
    {f.fields.phone.label}
    <input
      type="tel"
      name="phone"
      inputmode="tel"
      autocomplete="tel"
      placeholder={f.fields.phone.placeholder}
      class="min-h-11 rounded-[--radius-control] border border-border px-3"
      required
    />
    <span class="text-xs text-muted">{f.fields.phone.hint}</span>
    <span class="error text-sm text-error" data-error-for="phone" aria-live="polite"></span>
  </label>

  <label class="grid gap-1.5 text-sm font-medium">
    {f.fields.service.label}
    <select
      name="service"
      class="min-h-11 rounded-[--radius-control] border border-border px-3"
      required
    >
      <option value="">{f.fields.service.placeholder}</option>
      {f.serviceOptions.map((o) => <option value={o.value}>{o.label}</option>)}
    </select>
    <span class="error text-sm text-error" data-error-for="service" aria-live="polite"></span>
  </label>

  {
    isFull && (
      <>
        <label class="grid gap-1.5 text-sm font-medium">
          {f.fields.city.label}
          <input
            type="text"
            name="city"
            autocomplete="address-level2"
            placeholder={f.fields.city.placeholder}
            class="min-h-11 rounded-[--radius-control] border border-border px-3"
            required
          />
          <span class="error text-sm text-error" data-error-for="city" aria-live="polite" />
        </label>

        <label class="grid gap-1.5 text-sm font-medium">
          {`${f.fields.email.label} (${f.fields.email.optional})`}
          <input
            type="email"
            name="email"
            autocomplete="email"
            placeholder={f.fields.email.placeholder}
            class="min-h-11 rounded-[--radius-control] border border-border px-3"
          />
          <span class="error text-sm text-error" data-error-for="email" aria-live="polite" />
        </label>

        <label class="grid gap-1.5 text-sm font-medium">
          {`${f.fields.message.label} (${f.fields.message.optional})`}
          <textarea
            name="message"
            rows="4"
            placeholder={f.fields.message.placeholder}
            class="rounded-[--radius-control] border border-border p-3"
          />
        </label>
      </>
    )
  }

  <label class="flex items-start gap-3 text-sm">
    <input type="checkbox" name="gdpr" class="mt-1 h-5 w-5" required />
    <span>
      {f.fields.gdpr.label}{' '}
      <a href={privacyHref} class="underline">{f.fields.gdpr.linkText}</a>
    </span>
  </label>
  <span class="error text-sm text-error" data-error-for="gdpr" aria-live="polite"></span>

  {/* Honeypot: hidden from humans, irresistible to bots. */}
  <div class="absolute left-[-9999px]" aria-hidden="true">
    <label>
      Nie wypełniaj tego pola
      <input type="text" name="hp" tabindex="-1" autocomplete="off" />
    </label>
  </div>

  <input type="hidden" name="source" value={isFull ? 'full' : 'hero'} />
  <input type="hidden" name="locale" value={locale} />
  <input type="hidden" name="thanks" value={route('thanks', locale)} />

  <button type="submit" class="btn btn-primary w-full" data-submit>
    <span data-submit-label>{isFull ? f.submit : f.submitCompact}</span>
  </button>

  <p class="text-xs text-muted">{isFull ? f.microcopy : t.hero.microcopy}</p>

  <p
    class="hidden rounded-[--radius-control] bg-error/10 p-3 text-sm text-error"
    data-form-error
    role="alert"
  >
  </p>
</form>

<script>
  import '../scripts/form';
</script>
```

- [ ] **Step 2: Write `src/scripts/form.ts`**

```ts
import { validateLead, type FieldErrors, type LeadInput } from '../lib/validate';
import pl from '../i18n/pl.json';
import en from '../i18n/en.json';

const dictionaries = { pl, en } as const;
type Locale = keyof typeof dictionaries;

function readForm(form: HTMLFormElement): LeadInput & { locale: Locale; thanks: string } {
  const data = new FormData(form);
  const str = (key: string) => String(data.get(key) ?? '').trim();
  return {
    name: str('name') || undefined,
    phone: str('phone'),
    email: str('email') || undefined,
    service: str('service'),
    city: str('city') || undefined,
    message: str('message') || undefined,
    gdpr: data.get('gdpr') === 'on',
    hp: str('hp'),
    source: str('source') === 'full' ? 'full' : 'hero',
    locale: (str('locale') === 'en' ? 'en' : 'pl') as Locale,
    thanks: str('thanks'),
  };
}

function paintErrors(form: HTMLFormElement, errors: FieldErrors, locale: Locale): void {
  const messages = dictionaries[locale].form.errors as Record<string, string>;
  form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((node) => {
    const field = node.dataset.errorFor as keyof FieldErrors;
    const code = errors[field];
    node.textContent = code ? (messages[code] ?? messages.required) : '';
    const input = form.querySelector<HTMLElement>(`[name="${field}"]`);
    input?.setAttribute('aria-invalid', code ? 'true' : 'false');
  });
}

function focusFirstInvalid(form: HTMLFormElement, errors: FieldErrors): void {
  const first = Object.keys(errors)[0];
  if (!first) return;
  form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
}

function initForm(form: HTMLFormElement): void {
  const variant = form.dataset.variant === 'full' ? 'full' : 'compact';
  const button = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const label = form.querySelector<HTMLElement>('[data-submit-label]')!;
  const banner = form.querySelector<HTMLElement>('[data-form-error]')!;
  const idleLabel = label.textContent ?? '';

  // Validate on blur, never on keystroke: correcting a half-typed value is noise.
  form.querySelectorAll<HTMLElement>('input, select').forEach((field) => {
    field.addEventListener('blur', () => {
      const payload = readForm(form);
      paintErrors(form, validateLead(payload, variant), payload.locale);
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readForm(form);
    const dict = dictionaries[payload.locale];
    const errors = validateLead(payload, variant);

    paintErrors(form, errors, payload.locale);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(form, errors);
      return;
    }

    button.disabled = true;
    label.textContent = dict.form.submitting;
    banner.classList.add('hidden');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        window.location.assign(payload.thanks);
        return;
      }

      if (response.status === 422) {
        const body = (await response.json()) as { errors: FieldErrors };
        paintErrors(form, body.errors, payload.locale);
        focusFirstInvalid(form, body.errors);
      } else {
        banner.textContent = dict.form.errors.server;
        banner.classList.remove('hidden');
      }
    } catch {
      banner.textContent = dict.form.errors.network;
      banner.classList.remove('hidden');
    } finally {
      button.disabled = false;
      label.textContent = idleLabel;
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form.lead-form').forEach(initForm);
```

- [ ] **Step 3: Verify the client blocks an invalid submission**

Run `npm run dev`, open the page, submit the empty form.
Expected: no network request in DevTools; error text appears under phone, service and the GDPR checkbox; focus jumps to the phone field.

- [ ] **Step 4: Verify a valid submission reaches the endpoint**

Run `npm run build && npx wrangler pages dev dist`, fill the form, submit.
Expected: navigation to `/dziekujemy`, one email and one Telegram message.

- [ ] **Step 5: Commit**

```bash
git add src/components/LeadForm.astro src/scripts/form.ts
git commit -m "feat: add lead form component with inline validation and submit states"
```

---

## Task 9: Top Bar, Hero and Trust Bar

**Files:**
- Create: `src/components/Icon.astro`, `src/components/TopBar.astro`, `src/components/Hero.astro`, `src/components/TrustBar.astro`
- Modify: `src/pages/index.astro`
- Move: `docs/design/placeholders/*.svg` → `public/images/placeholders/`

- [ ] **Step 1: Move the placeholders into the served tree**

```bash
mkdir -p public/images/placeholders
git mv docs/design/placeholders/*.svg public/images/placeholders/
```

- [ ] **Step 2: Write `src/components/Icon.astro`**

```astro
---
// Inline Lucide paths. Adding an icon means adding one entry here — no icon
// library ships to the browser.
interface Props {
  name: keyof typeof PATHS;
  class?: string;
}

const PATHS = {
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  'file-signature': '<path d="M20 19.5v.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v2"/><path d="M8 18h1a2 2 0 0 0 2-2 2 2 0 1 1 4 0 2 2 0 0 0 2 2h1"/>',
  'calendar-check': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
  'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  droplets: '<path d="M12 22a7 7 0 0 0 7-7c0-4-7-12-7-12S5 11 5 15a7 7 0 0 0 7 7z"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
} as const;

const { name, class: className = 'h-6 w-6' } = Astro.props;
---

<svg
  class={className}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  set:html={PATHS[name]}
/>
```

- [ ] **Step 3: Write `src/components/TopBar.astro`**

```astro
---
import Icon from './Icon.astro';
import { getDictionary, otherLocale, route, type Locale, type RouteKey } from '../i18n';

interface Props {
  locale: Locale;
  routeKey: RouteKey;
  phone: string;
}

const { locale, routeKey, phone } = Astro.props;
const t = getDictionary(locale);
const other = otherLocale(locale);
const otherHref = route(routeKey, other);
const telHref = `tel:${phone.replace(/\s/g, '')}`;
---

<header class="sticky top-0 z-40 border-b border-ink-soft bg-ink text-white">
  <div class="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-4">
    <span class="font-semibold tracking-tight">{t.topbar.brand}</span>

    <span class="hidden items-center gap-1.5 text-sm text-white/70 sm:flex">
      <Icon name="map-pin" class="h-4 w-4" />
      {t.topbar.location}
    </span>

    <div class="ml-auto flex items-center gap-2">
      <a href={telHref} class="flex min-h-11 items-center gap-2 px-2 text-sm" aria-label={t.topbar.phoneAria}>
        <Icon name="phone" class="h-4 w-4" />
        <span class="hidden md:inline">{phone}</span>
      </a>

      <a
        href={otherHref}
        hreflang={other}
        class="min-h-11 px-2 text-sm leading-[2.75rem] text-white/70"
        aria-label={t.topbar.langSwitchTo}
      >
        {other.toUpperCase()}
      </a>

      <a href="#formularz" class="btn btn-primary h-11 min-h-11 text-sm">{t.topbar.cta}</a>
    </div>
  </div>
</header>
```

- [ ] **Step 4: Write `src/components/Hero.astro`**

```astro
---
import LeadForm from './LeadForm.astro';
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = getDictionary(locale);
---

<section class="bg-ink text-white">
  <div class="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
    <div>
      <p class="text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-cta-hover">
        {t.hero.eyebrow}
      </p>
      <h1
        class="mt-4 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.015em]"
      >
        {t.hero.h1}
      </h1>
      <p class="mt-6 max-w-[52ch] text-lg text-white/70">{t.hero.lead}</p>

      <img
        src="/images/placeholders/hero-gate.svg"
        alt={t.hero.imageAlt}
        width="1600"
        height="900"
        fetchpriority="high"
        decoding="async"
        class="mt-10 w-full rounded-[--radius-card]"
      />
    </div>

    <div class="lg:pt-16">
      <LeadForm locale={locale} variant="compact" id="hero-form" />
    </div>
  </div>
</section>
```

- [ ] **Step 5: Write `src/components/TrustBar.astro`**

```astro
---
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = getDictionary(locale);
---

<section class="border-b border-border bg-bg" aria-label={t.trust.srTitle}>
  <ul class="mx-auto grid max-w-[1200px] grid-cols-2 gap-px bg-border px-4 py-0 md:grid-cols-4">
    {
      t.trust.items.map((item) => (
        <li class="bg-bg px-4 py-8 text-center">
          <span class="block text-4xl font-bold tracking-[-0.02em] text-ink">{item.value}</span>
          <span class="mt-1 block text-sm text-muted">{item.label}</span>
        </li>
      ))
    }
  </ul>
</section>
```

- [ ] **Step 6: Assemble them in `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TopBar from '../components/TopBar.astro';
import Hero from '../components/Hero.astro';
import TrustBar from '../components/TrustBar.astro';
import { getDictionary } from '../i18n';

const locale = 'pl' as const;
const t = getDictionary(locale);
const phone = '+48 600 000 000'; // Replaced by {{TELEFON}} in Task 18.
---

<Base
  locale={locale}
  routeKey="home"
  title={t.seo.title}
  description={t.seo.description}
  ogTitle={t.seo.ogTitle}
  ogDescription={t.seo.ogDescription}
  ogImageAlt={t.seo.ogImageAlt}
>
  <TopBar locale={locale} routeKey="home" phone={phone} />
  <main id="main">
    <Hero locale={locale} />
    <TrustBar locale={locale} />
  </main>
</Base>
```

- [ ] **Step 7: Verify at 375px**

Run `npm run dev`, open DevTools device mode at 375×667.
Expected: no horizontal scrollbar; the form sits below the headline; the phone icon and CTA button remain visible in the top bar.

- [ ] **Step 8: Commit**

```bash
git add src/components public/images src/pages/index.astro
git commit -m "feat: add top bar, hero with compact form and trust bar"
```

---

## Task 10: Pain, Services, Why Us and Process Sections

**Files:**
- Create: `src/components/Pain.astro`, `src/components/Services.astro`, `src/components/WhyUs.astro`, `src/components/Process.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/Pain.astro`**

```astro
---
import Icon from './Icon.astro';
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = getDictionary(locale);
---

<section class="mx-auto max-w-[1200px] px-4 py-20">
  <h2 class="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.01em] text-ink">
    {t.pain.title}
  </h2>
  <p class="mt-3 max-w-[60ch] text-muted">{t.pain.lead}</p>

  <ul class="mt-10 grid gap-6 md:grid-cols-3">
    {
      t.pain.items.map((item, index) => (
        <li
          class="rounded-[--radius-card] border border-border p-6 shadow-card"
          data-reveal
          style={`transition-delay:${index * 50}ms`}
        >
          <Icon name={item.icon as 'shield-check'} class="h-6 w-6 text-cta" />
          <p class="mt-4 text-lg font-medium italic text-ink">“{item.quote}”</p>
          <p class="mt-3 text-muted">{item.answer}</p>
        </li>
      ))
    }
  </ul>
</section>
```

- [ ] **Step 2: Write `src/components/Services.astro`**

```astro
---
import Icon from './Icon.astro';
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = getDictionary(locale);

const IMAGES: Record<string, string> = {
  bramy: '/images/placeholders/hero-gate.svg',
  brukarstwo: '/images/placeholders/service-paving.svg',
  'pod-klucz': '/images/placeholders/service-earthworks.svg',
};

// Pre-selects the matching option in the full form.
const SERVICE_PARAM: Record<string, string> = {
  bramy: 'brama-przesuwna',
  brukarstwo: 'brukarstwo',
  'pod-klucz': 'pod-klucz',
};
---

<section id="uslugi" class="bg-bg py-20">
  <div class="mx-auto max-w-[1200px] px-4">
    <h2 class="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.01em] text-ink">
      {t.services.title}
    </h2>
    <p class="mt-3 max-w-[60ch] text-muted">{t.services.lead}</p>

    <div class="mt-10 grid gap-6 md:grid-cols-3">
      {
        t.services.items.map((item, index) => (
          <article
            class="flex flex-col overflow-hidden rounded-[--radius-card] border border-border bg-surface shadow-card"
            data-reveal
            style={`transition-delay:${index * 50}ms`}
          >
            <img
              src={IMAGES[item.id]}
              alt={item.imageAlt}
              width="1200"
              height="900"
              loading="lazy"
              decoding="async"
              class="aspect-[4/3] w-full object-cover"
            />
            <div class="flex flex-1 flex-col p-6">
              <h3 class="text-xl font-semibold text-ink">{item.title}</h3>
              <p class="mt-2 text-muted">{item.desc}</p>
              <ul class="mt-4 grid gap-1.5 text-sm">
                {item.list.map((entry) => (
                  <li class="flex items-center gap-2">
                    <Icon name="check" class="h-4 w-4 shrink-0 text-cta" />
                    {entry}
                  </li>
                ))}
              </ul>
              <a
                href={`#formularz?usluga=${SERVICE_PARAM[item.id]}`}
                data-service={SERVICE_PARAM[item.id]}
                class="btn btn-primary mt-6 w-full"
              >
                {item.cta}
              </a>
            </div>
          </article>
        ))
      }
    </div>
  </div>
</section>

<script>
  // Clicking a service card jumps to the full form with that service selected.
  document.querySelectorAll<HTMLAnchorElement>('a[data-service]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const select = document.querySelector<HTMLSelectElement>('#full-form select[name="service"]');
      if (select) select.value = link.dataset.service ?? '';
      document.querySelector('#formularz')?.scrollIntoView({ block: 'start' });
    });
  });
</script>
```

- [ ] **Step 3: Write `src/components/WhyUs.astro`**

```astro
---
import Icon from './Icon.astro';
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = getDictionary(locale);
---

<section class="mx-auto max-w-[1200px] px-4 py-20">
  <h2 class="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.01em] text-ink">
    {t.why.title}
  </h2>
  <p class="mt-3 max-w-[60ch] text-muted">{t.why.lead}</p>

  <ul class="mt-10 grid gap-8 sm:grid-cols-2">
    {
      t.why.items.map((item, index) => (
        <li class="flex gap-4" data-reveal style={`transition-delay:${index * 50}ms`}>
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[--radius-control] bg-ink text-white">
            <Icon name={item.icon as 'zap'} class="h-5 w-5" />
          </span>
          <div>
            <h3 class="text-lg font-semibold text-ink">{item.title}</h3>
            <p class="mt-1.5 text-muted">{item.desc}</p>
          </div>
        </li>
      ))
    }
  </ul>
</section>
```

- [ ] **Step 4: Write `src/components/Process.astro`**

```astro
---
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = getDictionary(locale);
---

<section id="proces" class="bg-ink py-20 text-white">
  <div class="mx-auto max-w-[1200px] px-4">
    <h2 class="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.01em]">
      {t.process.title}
    </h2>
    <p class="mt-3 max-w-[60ch] text-white/70">{t.process.lead}</p>

    <ol class="mt-10 grid gap-6 md:grid-cols-4">
      {
        t.process.steps.map((step, index) => (
          <li
            class="border-t border-ink-soft pt-6"
            data-reveal
            style={`transition-delay:${index * 50}ms`}
          >
            <span class="text-sm font-medium tracking-[0.12em] text-cta-hover">{step.num}</span>
            <h3 class="mt-3 text-lg font-semibold">{step.title}</h3>
            <p class="mt-2 text-white/70">{step.desc}</p>
            <span class="mt-4 inline-block rounded-[--radius-control] border border-ink-soft px-2 py-1 text-xs text-white/60">
              {step.badge}
            </span>
          </li>
        ))
      }
    </ol>

    <a href="#formularz" class="btn btn-primary mt-10">{t.process.cta}</a>
  </div>
</section>
```

- [ ] **Step 5: Add all four to `src/pages/index.astro`**

Import them and place inside `<main>` in this order: `Hero`, `TrustBar`, `Pain`, `Services`, `WhyUs`, `Process`.

- [ ] **Step 6: Verify**

Run `npm run build`
Expected: exit code 0. Open the preview and confirm all four sections render with copy from `pl.json`, and that clicking a service card scrolls down (the form target arrives in Task 12; until then the scroll is a no-op — this is expected).

- [ ] **Step 7: Commit**

```bash
git add src/components src/pages/index.astro
git commit -m "feat: add pain, services, why-us and process sections"
```

---

## Task 11: Gallery, Before/After Slider, Testimonials and FAQ

**Files:**
- Create: `src/components/Gallery.astro`, `src/components/BeforeAfter.astro`, `src/components/Testimonials.astro`, `src/components/Faq.astro`
- Create: `src/scripts/before-after.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/BeforeAfter.astro`**

```astro
---
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const ba = getDictionary(locale).gallery.beforeAfter;
---

<figure class="mt-12">
  <figcaption class="mb-4 flex items-baseline justify-between gap-4">
    <span class="text-lg font-semibold text-ink">{ba.title}</span>
    <span class="text-sm text-muted">{ba.hint}</span>
  </figcaption>

  <div
    class="relative aspect-video w-full touch-pan-y select-none overflow-hidden rounded-[--radius-card]"
    data-before-after
  >
    <img
      src="/images/placeholders/before-driveway.svg"
      alt={ba.beforeAlt}
      width="1600"
      height="900"
      loading="lazy"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <img
      src="/images/placeholders/after-driveway.svg"
      alt={ba.afterAlt}
      width="1600"
      height="900"
      loading="lazy"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover"
      data-after
      style="clip-path: inset(0 0 0 50%)"
    />

    <input
      type="range"
      min="0"
      max="100"
      value="50"
      class="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      aria-label={ba.hint}
      data-range
    />

    <span
      class="pointer-events-none absolute inset-y-0 w-0.5 bg-white"
      data-handle
      style="left: 50%"
    ></span>
  </div>
</figure>

<script>
  import '../scripts/before-after';
</script>
```

The slider is driven by a real `<input type="range">`: it is keyboard-operable and screen-reader-announced for free, and the visual handle simply follows it.

- [ ] **Step 2: Write `src/scripts/before-after.ts`**

```ts
function initSlider(root: HTMLElement): void {
  const range = root.querySelector<HTMLInputElement>('[data-range]');
  const after = root.querySelector<HTMLElement>('[data-after]');
  const handle = root.querySelector<HTMLElement>('[data-handle]');
  if (!range || !after || !handle) return;

  const paint = (percent: number): void => {
    after.style.clipPath = `inset(0 0 0 ${percent}%)`;
    handle.style.left = `${percent}%`;
  };

  range.addEventListener('input', () => paint(Number(range.value)));
  paint(Number(range.value));
}

document.querySelectorAll<HTMLElement>('[data-before-after]').forEach(initSlider);
```

- [ ] **Step 3: Write `src/components/Gallery.astro`**

```astro
---
import BeforeAfter from './BeforeAfter.astro';
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = getDictionary(locale);
const IMAGES = [
  '/images/placeholders/hero-gate.svg',
  '/images/placeholders/service-paving.svg',
  '/images/placeholders/service-earthworks.svg',
  '/images/placeholders/hero-gate.svg',
  '/images/placeholders/service-paving.svg',
  '/images/placeholders/service-earthworks.svg',
];
---

<section id="realizacje" class="bg-bg py-20">
  <div class="mx-auto max-w-[1200px] px-4">
    <h2 class="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.01em] text-ink">
      {t.gallery.title}
    </h2>
    <p class="mt-3 max-w-[60ch] text-muted">{t.gallery.lead}</p>

    <ul
      class="mt-10 grid snap-x snap-mandatory grid-flow-col auto-cols-[85%] gap-4 overflow-x-auto pb-4 sm:auto-cols-[45%] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible"
    >
      {
        t.gallery.items.map((item, index) => (
          <li class="snap-start">
            <img
              src={IMAGES[index]}
              alt={item.alt}
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
              class="aspect-video w-full rounded-[--radius-card] object-cover"
            />
            <p class="mt-2 text-sm text-muted">{item.caption}</p>
          </li>
        ))
      }
    </ul>

    <BeforeAfter locale={locale} />
  </div>
</section>
```

- [ ] **Step 4: Write `src/components/Testimonials.astro`**

```astro
---
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = getDictionary(locale);

// The section stays out of the DOM while the copy is placeholder material.
// Publishing invented reviews breaches the EU Omnibus Directive (spec §7).
const isPlaceholder = t.testimonials._placeholder === true;
---

{
  !isPlaceholder && (
    <section class="mx-auto max-w-[1200px] px-4 py-20">
      <h2 class="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.01em] text-ink">
        {t.testimonials.title}
      </h2>
      <p class="mt-3 max-w-[60ch] text-muted">{t.testimonials.lead}</p>

      <ul class="mt-10 grid gap-6 md:grid-cols-3">
        {t.testimonials.items.map((item, index) => (
          <li
            class="rounded-[--radius-card] border border-border p-6 shadow-card"
            data-reveal
            style={`transition-delay:${index * 50}ms`}
          >
            <blockquote class="text-ink">“{item.quote}”</blockquote>
            <figcaption class="mt-4 flex items-center gap-3">
              <img
                src="/images/placeholders/avatar.svg"
                alt={item.avatarAlt}
                width="160"
                height="160"
                loading="lazy"
                class="h-10 w-10 rounded-full"
              />
              <span class="text-sm">
                <span class="block font-medium text-ink">{item.author}</span>
                <span class="block text-muted">{item.role}</span>
              </span>
            </figcaption>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 5: Write `src/components/Faq.astro`**

```astro
---
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = getDictionary(locale);
---

<section id="faq" class="mx-auto max-w-[840px] px-4 py-20">
  <h2 class="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.01em] text-ink">
    {t.faq.title}
  </h2>
  <p class="mt-3 text-muted">{t.faq.lead}</p>

  <div class="mt-10 divide-y divide-border border-y border-border">
    {
      t.faq.items.map((item) => (
        <details class="faq-item group">
          <summary class="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-4 font-medium text-ink marker:content-['']">
            {item.q}
            <span class="text-cta transition-transform duration-200 group-open:rotate-45">+</span>
          </summary>
          <div class="faq-body">
            <p class="overflow-hidden pb-5 text-muted">{item.a}</p>
          </div>
        </details>
      ))
    }
  </div>
</section>

<style>
  /* Animating grid-template-rows avoids the layout thrash of animating height. */
  .faq-body {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 200ms var(--ease-out);
  }
  details[open] .faq-body {
    grid-template-rows: 1fr;
  }
</style>
```

- [ ] **Step 6: Add the four sections to `src/pages/index.astro`**

Order inside `<main>`: `… Process`, `Gallery`, `Testimonials`, `Faq`.

- [ ] **Step 7: Verify the slider and the accordion**

Run `npm run dev`.
Expected: dragging the slider moves the divider and reveals the "after" image; the arrow keys move it too. Clicking a FAQ question expands it smoothly, and the `+` rotates into an `×`.

- [ ] **Step 8: Commit**

```bash
git add src/components src/scripts/before-after.ts src/pages/index.astro
git commit -m "feat: add gallery, before/after slider, testimonials and FAQ"
```

---

## Task 12: Full Form Section, Contacts, Footer and Sticky CTA

**Files:**
- Create: `src/components/Contacts.astro`, `src/components/Footer.astro`, `src/components/StickyCta.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/Contacts.astro`**

```astro
---
import Icon from './Icon.astro';
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
  phone: string;
  email: string;
}

const { locale, phone, email } = Astro.props;
const t = getDictionary(locale);
const telHref = `tel:${phone.replace(/\s/g, '')}`;
const mapsUrl = 'https://www.google.com/maps/place/Gda%C5%84sk';
---

<section id="kontakt" class="bg-bg py-20">
  <div class="mx-auto grid max-w-[1200px] gap-10 px-4 lg:grid-cols-2">
    <div>
      <h2 class="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.01em] text-ink">
        {t.contacts.title}
      </h2>
      <p class="mt-3 text-muted">{t.contacts.lead}</p>

      <dl class="mt-8 grid gap-5">
        <div>
          <dt class="text-sm text-muted">{t.contacts.phoneLabel}</dt>
          <dd>
            <a href={telHref} class="flex min-h-11 items-center gap-2 text-lg font-medium text-ink">
              <Icon name="phone" class="h-5 w-5 text-cta" />
              {phone}
            </a>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">{t.contacts.emailLabel}</dt>
          <dd><a href={`mailto:${email}`} class="text-lg text-ink underline">{email}</a></dd>
        </div>
        <div>
          <dt class="text-sm text-muted">{t.contacts.hoursLabel}</dt>
          <dd class="text-ink">{t.contacts.hours}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">{t.contacts.areaLabel}</dt>
          <dd class="text-ink">{t.contacts.area}</dd>
        </div>
      </dl>
    </div>

    <div>
      {/* Facade pattern: the heavy embed loads only on request, so no third-party
          cookies are set and the map never competes with LCP. */}
      <div
        class="relative aspect-[4/3] overflow-hidden rounded-[--radius-card] border border-border bg-ink-soft"
        data-map
      >
        <img
          src="/images/placeholders/service-earthworks.svg"
          alt={t.contacts.mapAlt}
          width="1200"
          height="900"
          loading="lazy"
          class="h-full w-full object-cover opacity-40"
        />
        <button type="button" class="btn btn-primary absolute inset-0 m-auto h-12 w-48" data-map-load>
          {t.contacts.mapLoad}
        </button>
      </div>
      <p class="mt-2 text-xs text-muted">{t.contacts.mapNote}</p>
      <a href={mapsUrl} rel="noopener" target="_blank" class="mt-2 inline-block text-sm underline">
        {t.contacts.mapCta}
      </a>
    </div>
  </div>
</section>

<script>
  document.querySelectorAll<HTMLButtonElement>('[data-map-load]').forEach((button) => {
    button.addEventListener('click', () => {
      const container = button.closest<HTMLElement>('[data-map]');
      if (!container) return;
      const iframe = document.createElement('iframe');
      iframe.src =
        'https://www.google.com/maps?q=Gda%C5%84sk&output=embed';
      iframe.loading = 'lazy';
      iframe.title = container.querySelector('img')?.alt ?? 'map';
      iframe.className = 'absolute inset-0 h-full w-full border-0';
      container.replaceChildren(iframe);
    });
  });
</script>
```

- [ ] **Step 2: Write `src/components/Footer.astro`**

```astro
---
import { getDictionary, route, type Locale } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = getDictionary(locale);
const year = new Date().getFullYear();
---

<footer class="bg-ink py-12 text-white/70">
  <div class="mx-auto grid max-w-[1200px] gap-8 px-4 md:grid-cols-2">
    <div>
      <p class="font-semibold text-white">{t.topbar.brand}</p>
      <p class="mt-2 max-w-[40ch] text-sm">{t.footer.tagline}</p>
      <p class="mt-4 text-sm">{t.footer.company}</p>
      <p class="text-sm">{t.footer.address}</p>
      <p class="text-sm">{t.footer.nip}</p>
    </div>

    <nav aria-label={t.footer.navTitle}>
      <p class="text-sm font-medium text-white">{t.footer.navTitle}</p>
      <ul class="mt-3 grid gap-2 text-sm">
        {t.footer.nav.map((item) => <li><a href={item.href} class="hover:text-white">{item.label}</a></li>)}
        <li><a href={route('privacy', locale)} class="hover:text-white">{t.footer.privacy}</a></li>
      </ul>
    </nav>
  </div>

  <div class="mx-auto mt-10 max-w-[1200px] border-t border-ink-soft px-4 pt-6 text-xs">
    © {year} {t.topbar.brand}. {t.footer.rights}
  </div>
</footer>
```

- [ ] **Step 3: Write `src/components/StickyCta.astro`**

```astro
---
import Icon from './Icon.astro';
import { getDictionary, type Locale } from '../i18n';

interface Props {
  locale: Locale;
  phone: string;
}

const { locale, phone } = Astro.props;
const t = getDictionary(locale);
const telHref = `tel:${phone.replace(/\s/g, '')}`;
---

<div
  class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-border bg-surface p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-raised md:hidden"
>
  <a href={telHref} class="btn border border-border text-ink">
    <Icon name="phone" class="mr-2 h-4 w-4" />
    {t.stickyBar.call}
  </a>
  <a href="#formularz" class="btn btn-primary">{t.stickyBar.quote}</a>
</div>
```

- [ ] **Step 4: Assemble the final page in `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TopBar from '../components/TopBar.astro';
import Hero from '../components/Hero.astro';
import TrustBar from '../components/TrustBar.astro';
import Pain from '../components/Pain.astro';
import Services from '../components/Services.astro';
import WhyUs from '../components/WhyUs.astro';
import Process from '../components/Process.astro';
import Gallery from '../components/Gallery.astro';
import Testimonials from '../components/Testimonials.astro';
import Faq from '../components/Faq.astro';
import LeadForm from '../components/LeadForm.astro';
import Contacts from '../components/Contacts.astro';
import Footer from '../components/Footer.astro';
import StickyCta from '../components/StickyCta.astro';
import { getDictionary } from '../i18n';

const locale = 'pl' as const;
const t = getDictionary(locale);
const phone = '+48 600 000 000';
const email = 'kontakt@example.com';
---

<Base
  locale={locale}
  routeKey="home"
  title={t.seo.title}
  description={t.seo.description}
  ogTitle={t.seo.ogTitle}
  ogDescription={t.seo.ogDescription}
  ogImageAlt={t.seo.ogImageAlt}
>
  <TopBar locale={locale} routeKey="home" phone={phone} />
  <main id="main" class="pb-24 md:pb-0">
    <Hero locale={locale} />
    <TrustBar locale={locale} />
    <Pain locale={locale} />
    <Services locale={locale} />
    <WhyUs locale={locale} />
    <Process locale={locale} />
    <Gallery locale={locale} />
    <Testimonials locale={locale} />
    <Faq locale={locale} />

    <section id="formularz" class="mx-auto max-w-[640px] px-4 py-20">
      <LeadForm locale={locale} variant="full" id="full-form" />
    </section>

    <Contacts locale={locale} phone={phone} email={email} />
  </main>
  <Footer locale={locale} />
  <StickyCta locale={locale} phone={phone} />
</Base>
```

- [ ] **Step 5: Verify the sticky bar does not cover content**

Open at 375px, scroll to the very bottom.
Expected: the footer's last line is fully readable above the sticky bar (`pb-24` on `<main>` reserves the space), and the bar sits above the home indicator on a device with a gesture bar.

- [ ] **Step 6: Verify the service pre-selection**

Click "Wyceń brukarstwo" on the services card.
Expected: the page scrolls to the form and the service select already reads "Brukarstwo / kostka".

- [ ] **Step 7: Commit**

```bash
git add src/components src/pages/index.astro
git commit -m "feat: add full form section, contacts with map facade, footer and sticky CTA"
```

---

## Task 13: English Page and Secondary Pages

**Files:**
- Create: `src/pages/en/index.astro`, `src/pages/dziekujemy.astro`, `src/pages/en/thank-you.astro`, `src/pages/polityka-prywatnosci.astro`, `src/pages/en/privacy-policy.astro`

- [ ] **Step 1: Create `src/pages/en/index.astro`**

Copy `src/pages/index.astro` verbatim and change three things: `const locale = 'en' as const;`, the import paths gain one `../` level, and `routeKey` stays `"home"`. Everything else reads from the dictionary, so no other edit is needed.

- [ ] **Step 2: Create the thank-you pages**

`src/pages/dziekujemy.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import TopBar from '../components/TopBar.astro';
import Footer from '../components/Footer.astro';
import { getDictionary, route } from '../i18n';

const locale = 'pl' as const;
const t = getDictionary(locale);
const phone = '+48 600 000 000';
---

<Base
  locale={locale}
  routeKey="thanks"
  title={t.thankyou.seoTitle}
  description={t.thankyou.lead}
  noindex
>
  <TopBar locale={locale} routeKey="thanks" phone={phone} />
  <main id="main" class="mx-auto max-w-[640px] px-4 py-24 text-center">
    <h1 class="text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.015em] text-ink">
      {t.thankyou.title}
    </h1>
    <p class="mt-4 text-lg text-muted">{t.thankyou.lead}</p>
    <p class="mt-2 text-muted">{t.thankyou.next}</p>
    <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <a href={`tel:${phone.replace(/\s/g, '')}`} class="btn btn-primary">{t.thankyou.callNow}</a>
      <a href={route('home', locale)} class="btn border border-border text-ink">
        {t.thankyou.backHome}
      </a>
    </div>
  </main>
  <Footer locale={locale} />
</Base>
```

`src/pages/en/thank-you.astro` is the same file with `locale = 'en'` and one extra `../` on each import.

Both pages carry `noindex`: a thank-you page in the index would leak into search results and pollute the conversion count.

- [ ] **Step 3: Create the privacy pages**

Create `src/pages/polityka-prywatnosci.astro` and `src/pages/en/privacy-policy.astro` using the same shell as the thank-you page, with `routeKey="privacy"` and a `<article class="prose">` body.

The legal text itself is supplied by the client — it must name the data controller, the legal basis (Art. 6(1)(a) GDPR, consent), the retention period and the contact address for data-subject requests. Until it arrives, put a single visible sentence: `{{POLITYKA_PRYWATNOSCI}}`, so the missing text fails the placeholder check in Task 18 rather than shipping silently.

- [ ] **Step 4: Verify both locales build and cross-link**

Run: `npm run build && ls dist dist/en`
Expected: `dist/index.html`, `dist/dziekujemy/index.html`, `dist/polityka-prywatnosci/index.html`, `dist/en/index.html`, `dist/en/thank-you/index.html`, `dist/en/privacy-policy/index.html`.

Open `dist/en/index.html` in a browser and click the `PL` switcher.
Expected: it lands on `/`, not on a 404.

- [ ] **Step 5: Commit**

```bash
git add src/pages
git commit -m "feat: add English landing page, thank-you and privacy pages"
```

---

## Task 14: Reveal Animation and Language Hint

**Files:**
- Create: `src/scripts/reveal.ts`, `src/scripts/lang-hint.ts`
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: Write `src/scripts/reveal.ts`**

```ts
const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Reveal once; re-animating on scroll-back is noise.
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  targets.forEach((el) => observer.observe(el));
} else {
  targets.forEach((el) => el.classList.add('is-visible'));
}
```

- [ ] **Step 2: Write `src/scripts/lang-hint.ts`**

```ts
import pl from '../i18n/pl.json';
import en from '../i18n/en.json';

const STORAGE_KEY = 'lang-hint-dismissed';

function run(): void {
  if (localStorage.getItem(STORAGE_KEY) === '1') return;

  const pageLocale = document.documentElement.lang === 'en' ? 'en' : 'pl';
  const prefersPolish = navigator.languages.some((lang) => lang.toLowerCase().startsWith('pl'));

  // Only offer the switch when the browser disagrees with the page.
  const shouldOffer = pageLocale === 'pl' ? !prefersPolish : prefersPolish;
  if (!shouldOffer) return;

  const dict = pageLocale === 'pl' ? pl : en;
  const target = pageLocale === 'pl' ? '/en/' : '/';

  const bar = document.createElement('div');
  bar.className =
    'flex items-center justify-center gap-4 bg-cta px-4 py-2 text-sm text-white';
  bar.innerHTML = `
    <span></span>
    <a class="underline" href="${target}"></a>
    <button type="button" class="ml-auto underline" aria-label=""></button>`;

  const [message, link, dismiss] = bar.children as unknown as [
    HTMLElement,
    HTMLAnchorElement,
    HTMLButtonElement,
  ];
  message.textContent = dict.langHint.message;
  link.textContent = dict.langHint.cta;
  dismiss.textContent = '×';
  dismiss.setAttribute('aria-label', dict.langHint.dismiss);

  dismiss.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, '1');
    bar.remove();
  });

  document.body.prepend(bar);
}

try {
  run();
} catch {
  // localStorage can throw in private mode. A missing hint is not worth an error.
}
```

- [ ] **Step 3: Load both scripts from `src/layouts/Base.astro`**

Add before `</body>`:

```astro
<script>
  import '../scripts/reveal';
  import '../scripts/lang-hint';
</script>
```

- [ ] **Step 4: Verify the reveal respects reduced motion**

In DevTools → Rendering → Emulate CSS `prefers-reduced-motion: reduce`, reload.
Expected: every section is visible immediately, nothing slides in.

- [ ] **Step 5: Verify the language hint**

Set the browser's preferred language to English and open `/`.
Expected: an orange bar appears offering the English version; the URL does **not** change. Dismiss it and reload — it stays gone.

- [ ] **Step 6: Check the JavaScript budget**

Astro inlines small scripts into the HTML instead of emitting a chunk, so counting
`dist/_astro/*.js` alone under-reports and can read as zero. Count both:

```bash
npm run build && node -e "
const fs=require('fs'),zlib=require('zlib'),path=require('path');
const walk=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap((e)=>
  e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
let total=0;
for (const f of walk('dist')) {
  if (f.endsWith('.js')) total += zlib.gzipSync(fs.readFileSync(f)).length;
  if (f.endsWith('.html'))
    for (const m of fs.readFileSync(f,'utf8')
      .matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))
      total += zlib.gzipSync(m[1]).length;
}
console.log(total);
"
```

Expected: under 6144 bytes. If it exceeds that, the usual cause is a dictionary being
bundled into a client script — pass the handful of needed strings from the server as a
`data-` attribute instead, the way `LeadForm.astro` does (Task 8).

- [ ] **Step 7: Commit**

```bash
git add src/scripts src/layouts/Base.astro
git commit -m "feat: add scroll reveal and browser-language hint bar"
```

---

## Task 15: SEO Assets

**Files:**
- Create: `public/robots.txt`, `src/pages/sitemap.xml.ts`
- Modify: `src/layouts/Base.astro` (JSON-LD)

- [ ] **Step 1: Write `public/robots.txt`**

```
User-agent: *
Allow: /
Disallow: /dziekujemy
Disallow: /en/thank-you

Sitemap: https://alu3.pages.dev/sitemap.xml
```

- [ ] **Step 2: Write `src/pages/sitemap.xml.ts`**

```ts
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
```

- [ ] **Step 3: Add JSON-LD to `src/layouts/Base.astro`**

Inside `<head>`, after `<Seo />`:

```astro
---
// … existing frontmatter …
const businessSchema = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  name: t.topbar.brand,
  description: t.seo.description,
  areaServed: ['Gdańsk', 'Pomorskie'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Gdańsk',
    addressCountry: 'PL',
  },
  telephone: '{{TELEFON}}',
  url: Astro.site?.origin,
};
---

<script type="application/ld+json" set:html={JSON.stringify(businessSchema)} is:inline />
```

- [ ] **Step 4: Verify the sitemap**

Run: `npm run build && cat dist/sitemap.xml`
Expected: four `<url>` entries (home and privacy, each in PL and EN), each with three `hreflang` alternates. The thank-you pages are absent by design.

- [ ] **Step 5: Commit**

```bash
git add public/robots.txt src/pages/sitemap.xml.ts src/layouts/Base.astro
git commit -m "feat: add robots.txt, generated sitemap and LocalBusiness schema"
```

---

## Task 16: Hardcoded-Copy Guard

**Files:**
- Create: `scripts/check-no-hardcoded-copy.sh`

- [ ] **Step 1: Write the script**

```bash
#!/usr/bin/env bash
# Fails if user-visible Polish copy is written directly into components
# instead of living in src/i18n/. Diacritics are the cheap, reliable tell.
set -euo pipefail

matches=$(grep -rnE '[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]' src --include='*.astro' --include='*.ts' \
  --exclude-dir=i18n || true)

if [ -n "$matches" ]; then
  echo "Polish copy found outside src/i18n/:"
  echo "$matches"
  exit 1
fi

echo "OK: no hardcoded copy."
```

- [ ] **Step 2: Make it executable and run it**

```bash
chmod +x scripts/check-no-hardcoded-copy.sh
npm run check:copy
```

Expected: it FAILS, listing `Gdańsk` inside `src/components/Contacts.astro` and `src/pages/*.astro`.

- [ ] **Step 3: Fix the violations**

Move the hardcoded `Gdańsk` values into the dictionaries. In `Contacts.astro`, replace the inline `mapsUrl` city with a new key `contacts.mapsQuery` (`"Gdańsk"` in `pl.json`, `"Gdansk"` in `en.json`) and build the URL from it. In the JSON-LD block, read `addressLocality` from a new key `seo.addressLocality`.

Add the two new keys to both dictionaries, then re-run `npx vitest run tests/i18n.test.ts` to confirm parity still holds.

- [ ] **Step 4: Re-run the guard**

Run: `npm run check:copy`
Expected: `OK: no hardcoded copy.`

- [ ] **Step 5: Commit**

```bash
git add scripts src/components src/i18n src/layouts
git commit -m "chore: add CI guard against copy hardcoded outside i18n"
```

---

## Task 17: Analytics and Lighthouse Pass

**Files:**
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: Enable Cloudflare Web Analytics**

In the Cloudflare dashboard → Web Analytics → Add a site, select the Pages project. Copy the generated token.

- [ ] **Step 2: Add the beacon to `src/layouts/Base.astro`**

Before `</body>`:

```astro
<script
  is:inline
  defer
  src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon={`{"token": "${import.meta.env.PUBLIC_CF_BEACON_TOKEN ?? ''}"}`}></script>
```

Add `PUBLIC_CF_BEACON_TOKEN=` to `.env.example` and set the real value in the Cloudflare project variables.

This beacon sets no cookies and stores no personal data, which is why the site ships without a consent banner (spec §9).

- [ ] **Step 3: Run Lighthouse against the deployed preview**

```bash
npx lighthouse https://<preview>.pages.dev --preset=desktop --quiet --chrome-flags="--headless" --output=json --output-path=./lighthouse.json
node -e "const r=require('./lighthouse.json');for(const k of ['performance','accessibility','best-practices','seo'])console.log(k, Math.round(r.categories[k].score*100))"
```

Expected: performance ≥ 90, accessibility ≥ 90, best-practices ≥ 90, seo ≥ 95.

- [ ] **Step 4: Repeat for mobile**

```bash
npx lighthouse https://<preview>.pages.dev --quiet --chrome-flags="--headless" --output=json --output-path=./lighthouse-mobile.json
```

Expected: the same thresholds. If LCP exceeds 2.5s the first suspect is the hero image — once real photography lands, export it as AVIF at no more than 1600px wide and serve it through `<picture>`.

- [ ] **Step 5: Delete the reports and commit**

```bash
rm -f lighthouse.json lighthouse-mobile.json
git add src/layouts/Base.astro .env.example
git commit -m "feat: add cookieless Cloudflare Web Analytics beacon"
```

---

## Task 18: Pre-Launch Gate

**Files:**
- Modify: `src/i18n/pl.json`, `src/i18n/en.json`, `tests/i18n.test.ts`

This task cannot be completed until the client supplies the outstanding data listed in spec §10. It exists so that no one mistakes an unfinished site for a finished one.

- [ ] **Step 1: Replace every placeholder**

Substitute real values for `{{TELEFON}}`, `{{LATA}}`, `{{REALIZACJE}}`, `{{GWARANCJA}}`, `{{GWARANCJA_AUTOMATYKA}}`, `{{CENA_BRAMA_OD}}`, `{{TERMIN_TYGODNI}}`, `{{NAZWA_FIRMY}}`, `{{ADRES}}`, `{{NIP}}` and `{{POLITYKA_PRYWATNOSCI}}` in both dictionaries, plus the hardcoded `phone` and `email` constants in the page files.

- [ ] **Step 2: Promote the placeholder check from soft to hard**

In `tests/i18n.test.ts`, change `expect.soft(unresolved).toEqual([])` to `expect(unresolved).toEqual([])`.

- [ ] **Step 3: Replace the testimonials or keep the section hidden**

Either swap the three placeholder entries for genuine reviews and set `"_placeholder": false` in both dictionaries, or leave the flag `true` so `Testimonials.astro` continues to omit the section entirely. Do not publish invented reviews — the EU Omnibus Directive prohibits it.

- [ ] **Step 4: Replace the image placeholders**

Swap the SVGs in `public/images/placeholders/` for real photographs per `docs/design/placeholders/README.md`, converted to AVIF and WebP, and switch the `<img>` tags to `<picture>` with both sources.

- [ ] **Step 5: Have a native speaker proofread the Polish copy**

- [ ] **Step 6: Resolve the domain**

Run a WHOIS check on `alu3.pl` and a search of the Polish trademark register. If the name is taken, rebrand before the public launch rather than after. Attach the chosen domain to the Pages project and confirm the certificate is issued.

- [ ] **Step 7: Run the full suite**

```bash
npm run lint && npm test && npm run check:copy && npm run build
```

Expected: all four commands exit 0, including the now-hard placeholder assertion.

- [ ] **Step 8: Submit the sitemap to Google Search Console**

Verify the domain, submit `https://<domain>/sitemap.xml`, and confirm no coverage errors after the first crawl.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: replace placeholders with production data and enforce the launch gate"
```

---

## Self-Review Notes

**Spec coverage.** Every numbered section of the design spec maps to at least one task: §2.1 stack → Task 1; §2.2 routes → Tasks 5 and 13; §2.3 i18n → Task 3; §2.4 lead handling → Tasks 6, 7 and 8; §3 design system → Task 4; §4 page structure → Tasks 9–12; §5 motion → Tasks 4 and 14; §6 performance and accessibility → Tasks 9, 12 and 17; §7 content → Tasks 3 and 18; §8 checks → Tasks 3, 6 and 16; §9 analytics → Task 17; §10 open questions → Task 18; §11 acceptance criteria → Tasks 7, 12, 13, 14 and 18.

**Known deviation.** The design spec describes the before/after slider as a pointer-capture drag with damping at the bounds. The plan implements it as a styled `<input type="range">` instead. This is deliberate: the range input is keyboard-operable and screen-reader-announced with no extra code, which the acceptance criteria require, and it costs 12 lines rather than 40. If the drag feel proves unsatisfying in review, the pointer-capture version can replace the input's event handling without touching the markup.

**Type consistency.** `LeadInput`, `FieldErrors`, `ErrorCode` and `Variant` are defined once in `src/lib/validate.ts` (Task 6) and imported unchanged by `src/scripts/form.ts` (Task 8) and `functions/api/lead.ts` (Task 7). `Locale`, `RouteKey` and `route()` are defined once in `src/i18n/index.ts` (Task 3) and used with the same signatures throughout. The error codes emitted by `validateLead` match the key names under `form.errors` in both dictionaries.
