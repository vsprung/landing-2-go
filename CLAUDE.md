# landing-2-go — ALU3 landing page

Lead-generation landing page for ALU3, an aluminium gates, railings and glass canopies contractor in Gdańsk, Poland.

## Documents

- [`info/SPEC.md`](info/SPEC.md) — original product specification
- [`docs/superpowers/specs/2026-08-13-ALU3-landing-design.md`](docs/superpowers/specs/2026-08-13-ALU3-landing-design.md) — current design spec; supersedes parts of `info/SPEC.md`
- [`docs/content/`](docs/content/) — PL and EN copy drafts
- [`docs/design/placeholders/`](docs/design/placeholders/) — image placeholders and photographer shot list

## Stack

Astro (static) + TypeScript + Tailwind CSS, no React.
Hosting: Cloudflare Pages. Lead delivery: Cloudflare Pages Function → Web3Forms (email) + Telegram Bot API.
Locales: `/` = Polish (default), `/en/` = English.

## Commands

```bash
npm run dev          # Astro dev server
npm run build        # static build into dist/
npm run preview      # wrangler pages dev dist — needed to exercise /api/lead
npm test             # vitest
npm run lint         # eslint + astro check
npm run check:copy   # fails if Polish diacritics appear outside src/i18n/
```

## Conventions

- Write all documentation, code comments and commit messages in English.
- Reply to the user in Russian.
- No user-visible string may live outside `src/i18n/`.
- Animate only `transform` and `opacity`; never use `ease-in` for UI motion.
- The visual system follows the ALU3 change request, `change-requests/alu3_mockup_v13-1.html`. Its tokens live in `src/styles/global.css`: ink `#15181b`, graphite `#1c2024`, paper `#eef0f1`, paper-dim `#e2e5e6`, white, steel, and one indigo accent `#3b4e8c`. Headings are Archivo and body text is IBM Plex Sans, both self-hosted through `@fontsource`. Edges are square and structure comes from hairline rules, not cards.
- The accent measures 2.07:1 on graphite, so on dark bands any accent text or marker uses `--color-accent-light` (`#8fa3e0`, 6.62:1). Kickers on light bands use `--color-accent-dim`.
- The primary action is `.btn-primary`, filled in the accent and darkening to accent-dim on hover. Beside it on dark bands sits `.btn-ghost`; on light bands the secondary action is `.btn-outline`. Red appears only on form errors, and on the graphite band errors use `--color-error-on-dark`.
- Shadows are banned everywhere, including the lead form: it sits on the graphite contact band with underlined fields. The underline uses `--color-field` (3.39:1), not the mockup's hairline (1.56:1).
- Every section opens with `SectionHeading.astro` (kicker, `h2`, optional lead). Pass `tone="dark"` on graphite bands.
- Text never sits directly on a photograph. The before/after labels and the gallery's "+N" overlay sit on an ink plate. If you change a plate's opacity, re-check the contrast against a white pixel: Lighthouse does not evaluate contrast over photographs.
- Gallery photos live in `src/assets/projects/<slug>/`, one folder per job. Every folder needs a `gallery.projects` entry in both dictionaries, with one alt per photo; the build fails otherwise. See "How to add a project" in `docs/HANDOFF.md`.
- Never publish invented testimonials or unresolved `{{PLACEHOLDER}}` values.
