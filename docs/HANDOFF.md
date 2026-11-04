# Handoff — ALU3 landing page

**Date:** 2026-08-14
**Branch:** `main` is the trunk and the default branch; feature work branches off it.
Historical note: this file was first written on `feat/landing-mvp` at `6b49be4`, before that
branch was merged and retired.
**Other branches:** `redesign-wip` (`3c6bd3f`, the imported Custo reference)

---

## 2026-09-18 — gallery grouped by project

"Realizacje" now shows whole jobs, not a flat grid. The newest job leads as a wide feature: a cover,
what was installed, and a strip of its other shots. The rest follow as two-up cards. Every photo
opens a shared lightbox (`Lightbox.astro`, `src/scripts/lightbox.ts`) scoped to its own project. The
lightbox is a native `<dialog>` with a scroll-snap track, ←/→ keys and Esc. Each link's `href` is
the full-size image, so without JavaScript a click still opens the photo. The gallery deliberately
stays on the landing page. Once there are about six projects, add a `/realizacje` page (and a page
per project, for local SEO) and show only the newest four here. The data model already supports
this.

Language hint bar removed; the header switch carries a globe icon.

**How to add a project**

1. Create `src/assets/projects/<slug>/` and put the photos in it as `01.jpg`, `02.jpg`, and so on.
   Filename order is display order, and `01` is the cover.
2. Add an entry with `"id": "<slug>"` to `gallery.projects` in **both** `src/i18n/pl.json` and
   `en.json`: `title`, `summary`, `scope[]`, and `photoAlts[]` with exactly one alt per photo, in
   file order. The position in the array is the position on the page, so put the newest job first
   and keep `inne` last.
3. `npm run build` fails with "Gallery projects are out of sync" if a folder has no entry, an entry
   has no folder, or the alt count is wrong. `tests/projects.test.ts` checks the same thing.

## 2026-09-18 — ALU3 change request

The page was rebuilt to `change-requests/alu3_mockup_v13-1.html`. The brand is now
**ALU3** ("a brand of ALU3 Sp. z o.o."), and the offer is aluminium gates and fences,
glass railings and glass canopies. Block paving and earthworks are gone.

- _Structure:_ header → hero with a stats strip → services (snap row) → full-bleed
  gallery → objections → why us → process → FAQ → safe contract → contact with the
  form → footer. `Objections.astro`, `WhyUs.astro` and `Contact.astro` are new.
  `Arguments`, `Promises`, `QuickQuote`, `FormSection` and `Contacts` have been deleted,
  along with the map facade, the hero form and the mobile quick form.
- _Kept:_ the lead form with every field it had before (name, phone, service, town,
  optional email and message, GDPR consent, honeypot, UTM/gclid tracking),
  `/api/lead` → Web3Forms + Telegram, the thank-you redirect, service pre-selection from
  the service cards, the sticky mobile bar, the PL/EN locales and the language hint.
- _Before/after slider:_ `BeforeAfter.astro` ("Podjazd przed i po") was restored under the
  gallery at the client's request, with the original driveway copy and the old stock
  pair, and it is always rendered. **Before launch:** replace `before-driveway.jpg` and
  `after-driveway.jpg` with a genuine pair from one site, shot from the same position.
  The current pair is two unrelated photographs (see `CREDITS.md`).
- _Service values_ (`src/lib/services.ts`) are now `brama-przesuwna`,
  `brama-skrzydlowa`, `furtka`, `ogrodzenie`, `automatyka`, `balustrada`, `zadaszenie`
  and `nie-wiem`. The Telegram markers follow them.
- _Where this departs from the mockup, and why:_ accent text on dark bands uses a light
  tint, because the mockup's value fails contrast; form fields keep visible labels; the
  field underline is lighter so it clears 3:1. See `CLAUDE.md`.
- _Unconfirmed values:_ the phone `+48 510 318 834`, the email `biuro@alu3.pl`, the
  figures, the prices and the NIP are taken as the mockup shows them. `_meta.demo` stays
  `true`.

## 2026-08-18 — conversion and design pass

The client's verdict on the Custo-derived design was that the page read as a product
card rather than a landing page. A marketing audit and a design audit were run against
the built page (both are with the client, in Russian). Two sprints of the resulting plan
are in the tree; the audits' remaining items are listed at the foot of this file.

**Direction chosen by the client:** "Baltic contractor" — paper white and sand `#f1efec`,
one dark anchor, accent petrol `#14424c`, Inter at 400/600/700, documentary photography.
The gunmetal canvas and the all-achromatic rule are gone; see `CLAUDE.md`.

**What changed**

- _The first screen._ The photograph runs at full strength behind `.hero-scrim` instead of
  a flat 20% veil, so there is a gate on the page again. Two actions — the quote pill and
  the telephone — plus a four-figure proof line. The 19vw wordmark is gone. The band fell
  from 1009px to 834px, and the whole page from 10 505px to 9 722px.
- _Every quote button resolves to the nearest rendered form_ (`src/scripts/quote-cta.ts`).
  They all used to point at `#formularz` at the foot of the page, including the two beside
  the hero form. The href stays as the no-JS fallback.
- _The sticky mobile bar_ stays out of the way until the first screen is behind the visitor
  and hides again whenever a form is on screen. It used to cover the foot of the hero card
  it was pointing at.
- _`TrustBar` was folded into the hero_ and the services block's promise strip became
  `Promises.astro`, a 115px ledge under the hero — the free measurement, the lead time and
  the warranty are now the first thing the page says after the offer.
- _`Pain` and `WhyUs` became `Arguments.astro`_ on sand. They argued the same three points
  in two bands a screen apart with the services block wedged between them.
- _Service cards_ lost the card border and the hairline spec table: 4:3 photograph, price,
  scope as chips, an arrow link each, and one filled action for the whole block.
- _The form section is two columns_ (`FormSection.astro`): arguments and the telephone on
  the left, the card on the right with paired fields and the page's only shadow. 1286px → 1069px.
- _`QuickQuote.astro`_ puts a two-field form under the services block on mobile only. The
  first form a phone visitor met used to be at 12 000px; it is now at 3 763px.
- _Campaign attribution_ (`src/scripts/tracking.ts`): `utm_*`, `gclid` and the landing URL
  are captured first-touch into `sessionStorage`, carried as hidden fields, and reach both
  the email and the Telegram message. Without `gclid` there are no offline conversions in
  Google Ads and no readable A/B results. Nothing is written to a cookie, so the consent
  position is unchanged.
- _Header_ is 64px with the number set at 17px/600 rather than 14px grey.

- _Section headings_ moved into `SectionHeading.astro`: a full-width petrol band with the
  kicker above the heading, inverted to a white wash on the graphite sections. The label in
  a 280px rail plus a narrow heading measure was naming the section rather than selling it,
  and `text-wrap: balance` on `.t-h2` was pulling every heading into a five-line block about
  430px wide — both are gone. The two argument headings were rewritten from descriptions
  ("three things we hear most often") into promises ("we will not vanish with your deposit…").

- _Contacts_ opens on the same heading band as every other section, the telephone is the
  largest object in it, and the map facade says what it is instead of showing a black
  rectangle with a button floating in it. Watch the `<dl>` here: every `dt`/`dd` pair has to
  be a _direct_ child group, and a second level of div nesting fails WCAG 1.3.1 (axe:
  `dlitem`). White at 75% over the facade's own wash measures 4.34:1 and fails; plain white
  on it is 6.54:1.
- _Footer_ wordmark dropped from 57px to 24px — it was larger than the logo in the header —
  and the band lost the ~180px of empty space under it. 571px → 480px.
- _Copy._ Four section headings were rewritten from descriptions into promises: the two
  argument bands, the services band ("Brama, kostka i roboty ziemne — jedna ekipa, jeden
  termin.") and the gallery ("Zobacz, jak to wygląda po odbiorze."). PL and EN together.

**Unused after this pass and safe to delete:** `src/components/Pain.astro`,
`src/components/WhyUs.astro`, `src/components/TrustBar.astro`.

**The hero contrast probe.** The scrim replaced the opacity veil, so the old measurements do
not apply. The procedure: hide the hero's text layer, screenshot the band, and take the
brightest pixel under each text bounding box at 360, 390, 414, 768, 1024, 1280, 1440 and
1780px. Exclude anything inside `.lead-form` — the card is paper white and gives false
failures. Worst case as measured: **6.97:1** against a 4.5:1 floor. Re-run it after any
change to the photograph, the band colour or the scrim stops.

### Later the same day

- _`Safety.astro`_ — "Bezpieczna umowa" above the form: contract with a date, payment in
  stages, warranty in writing, registered company. Nothing in it is new information; the
  four facts were scattered across a card, two collapsed FAQ rows and the footer. The
  strongest objection in this trade is not price, it is "they will take the deposit and
  disappear", and it now has an answer standing where the visitor decides.
- _The phone page lost a third of its height_ — 15 072px → 13 685px. The four process steps
  became a horizontal snap row (1472px → 703px; the row is `tabindex="0"` so it scrolls from
  a keyboard too), the service photographs use a 16:10 crop below `sm`, the form section
  hides its three bullets on mobile because `Safety` says the same thing one section above,
  and the argument bands lost a step of vertical rhythm.
- _The first screen's copy was cut in half_ — the headline from 61 characters to 43, the lead
  from 162 to 90. The band is 721px on desktop (from 834) and 756px on mobile (from 868), so
  the proof line and the promise ledge now sit above the fold at 1440×900.
- _The hero image gained 480w and 800w variants_ so a phone fetches ~23kB instead of ~55kB.

**Lighthouse after the pass** (`dist/` over plain HTTP, headless Chromium, two runs):
desktop 100 / 100 / 100 / 100, LCP 0.7s, TBT 0ms; mobile 97–98 / 100 / 100 / 100, LCP
2.4–2.5s, TBT 0ms, CLS 0. The English page measures the same as the Polish one. Mobile
performance moves a point between runs on this machine — treat 97 and 98 as the same
number, and always compare against a freshly measured baseline rather than these figures.

One trap found while measuring. The hero image briefly carried `decoding="sync"`, on the
theory that the LCP element should not wait for an async decode. It cost 3 points and
110ms of blocking time: style and layout went from ~150ms to 849ms and the document
produced a 413ms long task, because a synchronous decode of a full-bleed photograph runs
on the main thread. `loading="eager"` with `fetchpriority="high"` is the whole of what the
LCP element needs; do not add `decoding` to it.

**Verification at the end of the pass:** `astro check` 0 errors, build 6 pages, `check:copy`
clean, vitest 25 passed with the one intentional demo-data failure.

---

## Where the project stands

The site is functionally complete and visually mid-redesign.

**Working and verified:** bilingual Polish/English static build (six pages), lead form with client and server validation posting to a Cloudflare Pages Function that fans out to Web3Forms and Telegram, honeypot spam trap, scroll reveals, language hint, before/after slider, sitemap, robots, JSON-LD, and a CI guard that fails if Polish copy appears outside `src/i18n/`.

**Lighthouse:** 100 / 100 / 100 / 100 on desktop. On mobile, accessibility, best practices and SEO are 100 and performance measures 98 (LCP 2.4s, CLS 0, TBT 0ms). The hero photograph is the LCP element and the dark workshop shot that replaced the brick wall is the reason for the last point: sparks are the worst case a codec can be handed, and even at quality 30 with `sizes` pinned to 800px it is 36kB against the wall's 11kB. Reverting to a flatter hero image is the lever if that point ever matters.

All of it is measured against `dist/` served over plain HTTP on this machine. The section rebuild itself cost nothing — the commit before it measures identically — and the 100 / 1.7s in earlier notes came from a different serving setup and does not reproduce here. Compare against a freshly measured baseline, never against the number in this file.

**Test suite:** 21 pass, 1 fails on purpose (`carry no invented demo data`). That failure is the pre-launch gate; see below.

## Commands

```bash
npm run dev          # Astro dev server
npm run build        # static build into dist/
npm run preview      # wrangler pages dev dist — needed to exercise /api/lead
npm test             # vitest
npm run lint         # eslint + astro check
npm run check:copy   # fails if Polish diacritics appear outside src/i18n/
```

---

## Open item 1 — a responsive report that does not reproduce

The client reports the layout "does not narrow" and that there is effectively one fixed container.

Two rounds of measurement now say otherwise.

**Round one** (spot widths): the container is `max-w-page` (1280px), correctly centred, and `document.documentElement.scrollWidth === clientWidth` at 1024, 1280, 1440, 1780 and 375px.

**Round two** (the VS Code preview pane hypothesis): the preview pane is an iframe, so the page was loaded into an iframe and the iframe resized — the same rendering path the client's screenshot came through. The container tracks the frame exactly (420px frame → 420px container, 600 → 600, 900 → 900, 1100 → 1100), and a sweep from 320 to 1920px in 32px steps found no width with horizontal overflow. The layout reflows correctly inside an embedded pane.

So the page is not the cause. What remains is the viewing environment — most likely the pane's own zoom level, which changes the CSS-pixel viewport without changing the visible pane width and makes a wide pane render the narrow layout (or the reverse).

**Before changing any layout code, get:**

- the exact viewport width where it breaks, and the browser
- whether it reproduces in a standalone Chrome/Safari window as well as the editor preview
- a screenshot with devtools open showing the viewport size

Do not "fix" this speculatively. Changing breakpoints without a reproduction risks breaking the widths that currently work.

## Open item 2 — aligning the page with the Custo reference (done)

The reference is `redesign/DESIGN.md` plus `tokens.json`, `variables.css`, `theme.css`. Read it first.

The design system in `src/styles/global.css` and the hero (`Hero.astro`, `TopBar.astro`) were rebuilt on it: gunmetal canvas `#9ea29f`, obsidian type, the 57 → 15px scale with tracking left alone, 8px radii, pill primary button.

The remaining sections have now been recomposed on it too:

- **`.section` and `.split`** in `global.css` carry the reference's 110px band gap (76px below `lg`) and its two-column text block — a 280px caption rail, heading and body beside it, 24px apart. Both are single knobs; change them there, not per section.
- `TrustBar`, `Pain`, `WhyUs`, `Services`, `Gallery`, `Process`, `Contacts` all open with that block: the section's `title` string is the caption, its `lead` string is the `h2`. No new copy was needed for the change.
- `Services` sits on a gunmetal band with each photograph in a paper card at 20px padding — the reference's product image card — instead of bleeding into the section.
- `Gallery` is a three-up card grid (one column on mobile). It replaced a horizontal snap-scroller that hid four of the six photographs behind a gesture.
- `Process` and `Contacts` are graphite `#4b514d`, not black; every rule and muted tone on them is a white alpha.
- `Footer` went the other way, to paper white with a hairline top rule, which is what the reference specifies and stops the page ending in one unbroken dark tail.
- `--color-bg` (`#f2f2f0`) and `--color-ink-soft` are gone. The first was not one of the reference's three surfaces and nothing referenced the second any more.

Then, at the client's direction:

- **The orange is gone.** The reference has no chromatic colour at all, so there was nothing to swap it for; the filled primary action is obsidian, darkening to graphite on hover. On the graphite bands it inverts to `.btn-paper`, because a black pill there sits at 2.59:1 against its own background — legible inside, but the shape itself falls below the 3:1 floor for a control. Red survives only on form errors, where the alternative costs more than the rule.
- **The hero photograph is the band's background again**, and the band itself is now graphite with reversed paper-white type. Neither the veil nor the type colour is a free dial — see the third contrast rule below.
- **The white mats around the service photographs are gone.** They sit on the canvas at 8px, like the gallery cards.
- **The hero form is the reference's input**: an 8px box behind an aluminium hairline that deepens to obsidian in use, declared once in `.lead-form` rather than as a class string repeated on nine fields. The card lost its shadow, which the reference bans.

**Three contrast rules that override the reference and are not negotiable:**

- White text on gunmetal is 2.58:1 and fails. Gunmetal takes black type only. Black at 75% opacity on it is 5.59:1 and is fine; at 60% it is 3.98:1 and is not.
- Graphite `#4b514d` on black is 2.09:1. Do not use it for text on the dark sections.
- **The hero band is graphite, its type is paper white, and the photograph behind it is held at 20%.** The three are one rule. The client asked for the reference's reversed type; on the gunmetal canvas that is 2.58:1 and fails both the 4.5:1 and the 3:1 floors, so the band moved to graphite, where white is 8.12:1. 20% is then the ceiling on the photograph: white at 20% over graphite is 4.76:1, at 25% it is 4.21:1 and the 19px lead fails. Measured across eight widths, worst case 4.76:1, nothing below the floor. `TopBar`'s overlay variant counts as hero and inherits all of it.

Axe cannot catch any of this — contrast over a photograph is not something it evaluates — so changing the band colour, the type colour or the veil means re-running the pixel probe, not trusting Lighthouse's 100.

## Open item 3 — demo data must be replaced before launch

`src/i18n/{pl,en}.json` carry values that have not been confirmed: the trust figures (12 years, 380 projects, 5-year warranty, 100% in-house production), the phone `+48 510 318 834`, the email `biuro@alu3.pl`, the company name and address, and the three service prices (from 12 000 zł, 6 000 zł and 2 500 zł). All of them come from the ALU3 mockup. The NIP is deliberately impossible (`000-000-00-00`), so it cannot collide with a real company.

`_meta.demo: true` marks this, and `tests/i18n.test.ts` fails while it is true. Replace the values, set the flag to `false`, and the suite goes green. Do not clear the flag while the values are still invented.

The hardcoded `phone` and `email` constants in the six page files need updating alongside.

## Open item 4 — photography

`src/assets/photos/` holds ten licensed Unsplash images with attribution in `CREDITS.md`. They are a stopgap; the shot list for the real photographer is in `docs/design/placeholders/README.md`.

Two specific problems recorded in `CREDITS.md`:

- **The before/after pair is two different locations.** The slider claims one site photographed twice. That is fabricated evidence of work and must not ship — this is the one image slot where stock is not an acceptable stopgap.
- `gates.jpg` is a locked security shutter, not a driveway gate. It is deliberately unused; either re-source it or delete it.

## Open item 5 — Cloudflare deployment

**The step-by-step runbook is [`docs/DEPLOY.md`](DEPLOY.md)** — project creation, the three
secrets, the live lead-path check, Git deploys, domain, analytics and the pre-launch list.

Deferred at the client's request until the site was finished locally. `wrangler.toml` exists and `npm run preview` runs the Function locally.

Still to do, in the Cloudflare dashboard:

1. Connect the GitHub repository to a Pages project. Build command `npm run build`, output directory `dist`.
2. Add `WEB3FORMS_ACCESS_KEY`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as **secrets**, for Production and Preview.
3. Add `PUBLIC_CF_BEACON_TOKEN` once Web Analytics is enabled. The beacon is omitted entirely when the variable is unset, so nothing breaks before then.

**The lead delivery path has never been tested end to end** — no credentials exist yet. The honeypot path (200, nothing sent) and the validation path (422 with per-field codes) were verified against a local `wrangler pages dev`. Once the secrets are in place, submit a real test lead and confirm it arrives in both the inbox and the Telegram chat.

---

## Traps that have already cost time

**Tailwind 4 arbitrary values.** `rounded-[--radius-card]` and `max-w-[--page-max]` do not work — in v4 that syntax declares a custom property rather than reading one. Use the generated utility (`rounded-card`, `max-w-page`, from `--radius-*` and `--container-*` in `@theme`) or `var()` explicitly. This silently produced square corners and a full-width container twice.

**Custom CSS must live in `@layer components`.** At top level it comes after Tailwind's utilities in source order and overrides them. `.media { position: relative }` beat an `absolute` utility and pushed the entire hero content a thousand pixels down the page, leaving the first screen apparently empty.

**Scroll reveals need dwell time to verify.** A fast synthetic scroll skips the IntersectionObserver threshold and reports elements as hidden. Scroll in ~300px steps with ~250ms pauses before concluding anything is broken.

**The copy guard only catches Polish diacritics.** A hardcoded English string passes it. Keep user-visible text in `src/i18n/` by discipline, not by relying on the check.
