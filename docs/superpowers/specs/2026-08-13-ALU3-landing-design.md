# Design Specification — ALU3 Landing Page

**Date:** 2026-08-13
**Status:** approved by the client, ready for implementation planning
**Relationship to earlier documents:** refines and supersedes the decisions in [`info/SPEC.md`](../../../info/SPEC.md) in the areas listed below. Anything not mentioned here (target audience, business goal, KPIs) carries over from `info/SPEC.md` unchanged.

---

## 1. Changes Against the Original SPEC

| Area | Was (`info/SPEC.md`) | Now | Why |
|---|---|---|---|
| Hosting | Vercel | **Cloudflare Pages** | Client decision |
| Framework | Next.js + shadcn/ui | **Astro + Tailwind, no React** | Static landing page; React costs ~90 KB of JS for five interactive elements and makes the §7 budget hard to hit |
| Routes | `/pl/` + `/en/` + reserved `de/cs/sk` | **`/` (PL) + `/en/`**, no reserved slots | Primary market served without a redirect; adding a locale in Astro is a one-line config change |
| Language detection | not specified | Hint based on `navigator.language`, no auto-redirect | Auto-redirecting on `Accept-Language` damages indexing of the Polish homepage, and Google rankings are a stated KPI |
| Lead delivery | Next API Route + Resend | **Cloudflare Pages Function → Web3Forms + Telegram Bot API** | Telegram is a paid Web3Forms feature; our own Function is free and satisfies §5 and §9 |
| Analytics | GA4 | **Cloudflare Web Analytics**, GA4 later for Ads | GA4 in the EU requires a consent banner, and the banner hurts the primary KPI |
| Form | one form, 7 fields | **two variants of one component:** 3 fields in the hero, 7 at the bottom | Conversion rule: ≤3 fields at the first point of contact |
| Page structure | 10 blocks | + pain block, + sticky mobile CTA bar, trust bar moved up under the hero | Seven-section marketing framework |

---

## 2. Architecture

### 2.1 Stack

- **Astro**, `output: 'static'`, TypeScript `strict: true`
- **Tailwind CSS** via `@tailwindcss/vite`
- **No React.** Interactivity is covered as follows:

| Element | Solution | JS |
|---|---|---|
| FAQ accordion | native `<details>/<summary>` | 0 |
| Gallery | CSS scroll-snap | 0 |
| Mobile menu | CSS + `<input type="checkbox">` | 0 |
| Form | vanilla TS island | ~120 lines |
| Before/after slider | `clip-path` + Pointer Events | ~40 lines |
| Language hint | `navigator.language` + `localStorage` | ~15 lines |
| Section reveal | IntersectionObserver | ~10 lines |

Budget: **no more than 6 KB of JS** (gzipped) per page.

- **ESLint** (`eslint-plugin-astro`) + **Prettier** (`prettier-plugin-astro`)
- **Vitest** — a minimal set of checks (see §8)
- Local development: `astro dev` for markup, `wrangler pages dev dist` to exercise the Function

### 2.2 Routes

```
/                       PL, the single landing page
/en/                    EN
/dziekujemy             PL thank-you page — the analytics goal
/en/thank-you           EN
/polityka-prywatnosci   PL privacy policy
/en/privacy-policy      EN
/api/lead               Cloudflare Pages Function (POST)
```

`astro.config.mjs`: `i18n: { defaultLocale: 'pl', locales: ['pl', 'en'], routing: { prefixDefaultLocale: false } }`

`hreflang` in every page `<head>`: `pl → /`, `en → /en/`, `x-default → /`.
Canonical is the absolute URL of the current locale.

### 2.3 Content and i18n

Dictionaries: `src/i18n/pl.json`, `src/i18n/en.json` — drafts are ready in [`docs/content/`](../../content/).
Keys are organised by page block: `seo`, `topbar`, `hero`, `trust`, `pain`, `services`, `why`, `process`, `gallery`, `testimonials`, `faq`, `form`, `contacts`, `footer`, `thankyou`, `langHint`, `a11y`, `stickyBar`.

**Rule:** no user-visible string lives outside the dictionaries, starting with the very first component. Enforced by a test (§8).

Values such as `{{LATA}}`, `{{TELEFON}}` and `{{GWARANCJA}}` are data that did not exist at writing time. The full list of open values is in §10.

### 2.4 Lead Handling

```
Form (island)
  │  POST /api/lead  { name?, phone, email?, service, city?, message?, gdpr, hp, source }
  ▼
functions/api/lead.ts  (Cloudflare Pages Function)
  ├─ parse and validate server-side (mirrors the client rules)
  ├─ honeypot `hp` filled → return 200 OK, send nothing
  ├─ Promise.allSettled:
  │     ├─→ POST https://api.web3forms.com/submit          → email to the owner
  │     └─→ POST https://api.telegram.org/bot…/sendMessage → owner's chat
  ▼
  ├─ both succeeded    → 200 { ok: true }
  ├─ one of two failed → 200 { ok: true, partial: true }, failure logged via console.error
  └─ both failed       → 502 { ok: false }
```

Secrets live in Cloudflare environment variables: `WEB3FORMS_ACCESS_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

The `source` field distinguishes the hero form from the full one (`hero` / `full`), so it becomes visible which one performs.

The Telegram message is formatted by hand: service type, town, phone number on its own line for quick copying, then the comment. The heading carries an emoji marker per service type so the chat feed can be scanned at a glance.

**Failure handling on the front end:**

- 200 → navigate to `/dziekujemy` (or `/en/thank-you`)
- 502 → message with a clickable phone number: "We could not send it — call us"; the form keeps its values
- network error → same message, the button returns to its idle state

**Anti-spam at launch:** honeypot plus server-side validation. Cloudflare Turnstile and a WAF rate-limiting rule go in **only if real spam appears** — both are free and neither requires reworking the code.

A useful side effect of this design: Web3Forms free is capped at 250 submissions per month while Telegram has no cap, so once the quota runs out leads keep arriving in Telegram and `partial: true` in the logs explains why.

---

## 3. Design System

### 3.1 Palette

Based on the Construction/Architecture set — industrial graphite with safety orange.

| Token | Hex | Used for |
|---|---|---|
| `--ink` | `#0F172A` | Dark sections: hero, CTA blocks, footer |
| `--ink-soft` | `#1E293B` | Surfaces and borders on dark |
| `--primary` | `#334155` | Headings on light |
| `--muted` | `#64748B` | Secondary text |
| `--cta` | `#C2410C` | Lead-capture buttons |
| `--cta-hover` | `#EA580C` | Hover, accent rules, icons |
| `--bg` | `#F8FAFC` | Light sections |
| `--surface` | `#FFFFFF` | Cards, inputs |
| `--border` | `#E2E8F0` | Dividers, field outlines |
| `--error` | `#DC2626` | Validation errors |
| `--success` | `#059669` | Success |

**Contrast check:** white text on `#EA580C` measures 3.56:1, which only clears the bar for large text. Buttons are therefore built on `#C2410C` (**5.17:1**, AA at any size), and `#EA580C` is reserved for hover states and accents. This is a precondition for the Accessibility > 90 target in §7 of the original SPEC.

No site-wide dark theme: the page already alternates dark and light sections, and a separate dark mode on a landing page is one more surface that can break.

### 3.2 Typography

A single family — **Inter** (variable), subsets `latin` plus **`latin-ext`**.

> `latin-ext` is mandatory. Without it `ł ą ę ś ż ź ć ń ó` fall back to a system font and the layout shifts on the very first screen.

Delivery: a local `.woff2` in `public/fonts` with `@font-face`, `font-display: swap`, and `preload` for the primary weight only. Google Fonts over CDN is not used — it adds a domain to the critical path and raises GDPR questions.

| Role | Weight | Size | Tracking |
|---|---|---|---|
| Display (H1) | 700 | `clamp(2.5rem, 6vw, 4.5rem)` | −1.5 |
| H2 | 600 | `clamp(1.75rem, 3.5vw, 2.75rem)` | −0.5 |
| H3 | 600 | 1.25rem | −0.25 |
| Body | 400 | 1rem / 1.6 | 0 |
| Label | 500 uppercase | 0.8125rem | +1.2 |

Measure: 60–75 characters per line on desktop, 35–60 on mobile.

### 3.3 Other Foundations

- **Icons:** Lucide, inline SVG, stroke 1.5, one set across the whole site. No emoji.
- **Radii:** 4px on inputs and buttons, 8px on cards. An industrial register does not tolerate pill shapes.
- **Shadows:** one scale — `0 1px 2px rgba(15,23,42,.06)` for cards, `0 8px 24px rgba(15,23,42,.12)` for raised elements. No further levels.
- **Grid:** container `max-width: 1200px`, spacing 16 / 24 / 32 / 48 / 80 on a 4px step.
- **Breakpoints:** 375 / 768 / 1024 / 1440, mobile-first.

---

## 4. Page Structure

```
Top Bar (sticky, thin)
 1. Hero + compact form (3 fields)
 2. Trust bar (4 figures)
 3. "Znasz to?" — pain block
 4. Services — 3 cards
 5. Why us — 4 points
 6. Process — 4 steps
 7. Work + before/after slider
 8. Testimonials
 9. FAQ
10. Full form (7 fields)
11. Contact + map
Footer
Sticky CTA bar (mobile only)
```

### 4.1 Per-Block Decisions

**Top Bar.** A thin strip rather than a full navbar, so it does not compete with the hero. Brand, location, clickable `tel:`, PL/EN switcher, compact quote button. At 375px the location collapses; phone and button stay.

**Hero.** Dark (`--ink`), photograph of a completed job, headline and lead on the left, a white form card on the right. On mobile the form moves below the headline. The compact form asks for phone, service type and GDPR consent. The LCP element is the photograph: `fetchpriority="high"`, no `lazy`, no entrance animation.

**Trust bar.** Directly under the hero, before the visitor has invested in reading: years in business · projects completed · years of warranty · "0 subcontractors". Figures are static, with no count-up.

**Pain block.** Three real fears of a Polish customer, each answered by one of our differentiators. Wording lives under `pain` in the dictionaries.

**Services.** Three cards: Bramy / Brukarstwo / Pod klucz. Clicking a card jumps to the full form with `service` pre-selected via a URL parameter or data attribute.

**Why us.** Every point is phrased as an outcome rather than a specification: "Nie rdzewieje. Nigdy." instead of "aluminium is corrosion-resistant".

**Process.** Four steps, each with a duration badge. Defuses the "what happens after I submit" anxiety.

**Work.** A six-item scroll-snap grid plus a dedicated before/after slider for the paving work.

**Testimonials.** Three cards with photo, name and location. **The content is placeholder material** (see §7).

**FAQ.** Eight questions covering price, lead time, coverage area, warranty, whether the survey is chargeable, the payment schedule, earthworks, and "why aluminium".

**Full form.** All seven fields from §5 of the original SPEC.

**Contact + map.** The map loads on click (facade pattern): a static image of the service area that swaps for the interactive map on demand. Saves roughly 500 KB and removes the cookie question.

**Sticky CTA bar.** Mobile only, pinned to the bottom: "Zadzwoń" and "Wycena". Respects `env(safe-area-inset-bottom)`, and `<main>` gets bottom padding so the bar never covers content.

---

## 5. Motion

Every animation answers the question "why does this move?". None are decorative.

### 5.1 Tokens

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--dur-press:  120ms;
--dur-hover:  160ms;
--dur-enter:  300ms;
```

`ease-in` is used nowhere: it stalls at exactly the moment the user is watching most closely. The built-in CSS curves are too weak, hence the custom ones.

### 5.2 Decision Table

| Element | Behaviour | Rationale |
|---|---|---|
| Buttons | `:active { transform: scale(0.97) }`, 120ms | Immediate acknowledgement of the press |
| Hover states | only inside `@media (hover: hover) and (pointer: fine)` | Touch devices fire hover on tap and leave it stuck |
| Sections on scroll | `opacity` + `translateY(10px)` → 0, 300ms, IntersectionObserver, fires once | A soft entrance without jitter |
| Service cards | 50ms stagger between cards | A cascade reads more naturally than everything flashing in at once |
| **Hero** | **not animated** | It is the LCP element: an entrance animation worsens the metric and risks CLS |
| FAQ | `grid-template-rows: 0fr → 1fr`, 200ms `--ease-out` | Animating `height` forces layout on every frame |
| Form submit | button → spinner → checkmark → navigate | State indication plus double-submit protection |
| Form error | appears under the field, 160ms, no shake | The error names the cause and the way to fix it |
| Before/after slider | `setPointerCapture`, damping past the bounds | Real objects decelerate rather than hit an invisible wall |
| Trust figures | static | Decoration without function; the number is needed immediately |

### 5.3 Constraints

- Only `transform` and `opacity` are animated. Nothing runs on the main thread.
- Transitions rather than `@keyframes` anywhere retriggering is possible.
- `prefers-reduced-motion: reduce` keeps opacity and colour, drops movement.
- No parallax, no scroll hijacking.

---

## 6. Performance and Accessibility

The budget from `info/SPEC.md` §7 stands: Performance > 90, SEO > 95, Best Practices > 90, Accessibility > 90, LCP < 2.5s, CLS < 0.1, INP < 200ms.

**Images.** `<picture>` with AVIF and WebP, explicit `width`/`height` on every element, the hero without `lazy` and with `fetchpriority="high"`, everything below the fold `loading="lazy" decoding="async"`. Meaningful localised `alt` text, placeholders included.

**Font.** Self-hosted, `preload` for the primary weight only, `font-display: swap`.

**Forms.** Visible `<label>` elements (never placeholder-as-label), field height ≥44px, `inputmode="tel"`, `type="email"`, `autocomplete="name tel email address-level2"`, validation on blur, focus moved to the first invalid field after submit, errors announced through `aria-live="polite"`.

**Keyboard.** Skip link as the first element, visible focus states (no `outline: none`), tab order matching the visual order.

**Semantics.** `<header> <main> <section> <footer>`, a single `<h1>`, a sequential `h2/h3` hierarchy.

**Schema.org.** `HomeAndConstructionBusiness` with `areaServed: ["Gdańsk", "Pomorskie"]`, structured so that regions can be added without changing the type.

---

## 7. Content

Full Polish and English copy is ready: [`docs/content/pl.json`](../../content/pl.json), [`docs/content/en.json`](../../content/en.json).

Polish is the source language; English is a proper translation rather than a gloss — the idioms are adapted (`«Ekipa zniknęła po zaliczce»` → `"The crew vanished after taking the deposit"`).

### Testimonials Are Placeholders and Must Not Be Published

The `testimonials` section in both dictionaries is marked `"_placeholder": true` and carries a warning.

The reason is not only reputational: **the EU Omnibus Directive explicitly prohibits publishing invented reviews**, with penalties of up to 4% of annual turnover. Replacing them with genuine, consented testimonials is a blocking item on the pre-launch checklist (Step 10), not a nice-to-have.

The same applies to the trust-bar figures and the prices in the FAQ: while `{{PLACEHOLDERS}}` remain, the page cannot go live.

---

## 8. Checks

A minimal set, with no framework scaffolding:

1. **`i18n.test.ts`** — the key sets in `pl.json` and `en.json` match recursively and no value is empty. Catches the most common failure: a block added in PL and forgotten in EN, leaving the switcher showing blanks.
2. **`validate.test.ts`** — the form validator shared by the client and the Function: phone, email, required fields, GDPR, honeypot, exercised on boundary cases.
3. **A `grep` check in CI** — no strings containing Polish diacritics appear in `src/**/*.astro` outside `i18n/`. A cheap way to hold the "no copy in markup" rule.

Manual pass before handover: 375px and landscape, `prefers-reduced-motion`, full keyboard navigation, and a test submission landing in both channels.

---

## 9. Analytics

**Cloudflare Web Analytics** — no cookies, no personal data, no consent banner. Conversions are counted as views of `/dziekujemy` and `/en/thank-you`.

**GA4 arrives later**, once Google Ads actually launches, together with a consent banner. Until then the site carries no banner, and that is a deliberate trade in favour of conversion.

---

## 10. Open Questions

Required from the client before launch:

| Placeholder | What it is |
|---|---|
| `{{TELEFON}}` | Main phone number for `tel:` links and error messages |
| `{{LATA}}` | Years in business |
| `{{REALIZACJE}}` | Projects completed |
| `{{GWARANCJA}}` / `{{GWARANCJA_AUTOMATYKA}}` | Warranty period for the structure and for the automation |
| `{{CENA_BRAMA_OD}}` | "From" price used in the FAQ |
| `{{TERMIN_TYGODNI}}` | Typical lead time |
| `{{NAZWA_FIRMY}}`, `{{ADRES}}`, `{{NIP}}` | Legal details for the footer |
| — | Email address for leads, Telegram chat ID |
| — | Photographs of completed work (shot list in `docs/design/placeholders/README.md`) |
| — | Genuine testimonials with consent to publish |

Separately, the **brand risk** from `info/SPEC.md` §10: the name "ALU3" overlaps with existing paving contractors, and `alu3.pl` is presumed taken. Until a domain is bought the site lives on `*.pages.dev`. A WHOIS and trademark-register check is required before public launch.

Polish copy needs a native-speaker review before launch. The text is grammatically sound, but sales microcopy deserves a live ear.

---

## 11. Acceptance Criteria

All criteria from `info/SPEC.md` §11 stand, plus:

- [ ] A lead from the hero form and from the full form reaches both email and Telegram, and the message shows which form it came from
- [ ] With the honeypot filled, the response is 200 and no message is sent
- [ ] If one channel is down the lead is still counted as successful and the failure is visible in Cloudflare logs
- [ ] If both are down the user sees a phone number, not "something went wrong"
- [ ] `/` serves Polish with no redirect, `/en/` serves English, `hreflang` and `x-default` are in place
- [ ] An English browser on `/` receives a hint about the EN version but is not redirected
- [ ] Page JavaScript does not exceed 6 KB gzipped
- [ ] Every animation is disabled under `prefers-reduced-motion: reduce`
- [ ] No user-visible string lives outside `src/i18n/`
- [ ] No `{{PLACEHOLDER}}` survives into the production build
- [ ] The testimonials section either holds genuine reviews or is hidden entirely
