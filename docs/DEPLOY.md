# Deploying to Cloudflare Pages

Everything here has been prepared but never run: no Cloudflare project exists yet and the
lead delivery path has never worked end to end. Locally only two branches of it are proven —
the honeypot (200, nothing sent) and validation (422 with per-field codes).

`wrangler.toml` already names the project `ALU3` and points at `dist`, so most commands
below take no arguments. The Function in `functions/api/lead.ts` ships with the static files
automatically.

---

## 1. First deploy, from a terminal

Direct upload. No dashboard, no Git connection, a live URL in about a minute.

```bash
cd path/to/landing-2-go
npm run build
npx wrangler login
npx wrangler pages project create ALU3 --production-branch=main
npx wrangler pages deploy
```

`wrangler login` opens a browser to authorise. The last command prints the project URL
(`https://alu3.pages.dev`) and a per-deployment URL.

The form will fail at this point. That is expected — the Function has nowhere to send a lead
until the secrets exist.

## 2. The three secrets

| Variable               | Where it comes from                                                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WEB3FORMS_ACCESS_KEY` | web3forms.com, enter the address leads should reach; the key arrives by email. Free tier is 250 emails a month                                                                                       |
| `TELEGRAM_BOT_TOKEN`   | `@BotFather` in Telegram → `/newbot` → a token like `7123456789:AAH…`                                                                                                                                |
| `TELEGRAM_CHAT_ID`     | message the bot (or add it to the group and post there), then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and read `chat.id`. A group id is negative — the minus sign is part of the value |

```bash
npx wrangler pages secret put WEB3FORMS_ACCESS_KEY --project-name ALU3
npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name ALU3
npx wrangler pages secret put TELEGRAM_CHAT_ID --project-name ALU3

npx wrangler pages deploy
```

**The second deploy is not optional.** Pages only picks up environment variables on a new
deployment, and skipping it is the usual reason for "I set everything and the form still
returns 502".

Preview environments need the same three secrets of their own — add `--environment preview`
to each command — or the form will work in production and fail on every branch preview.

## 3. Prove the lead path, once, on the live site

1. Submit a real enquiry from the hero form: telephone and service.
2. Confirm it arrives **both** in the Web3Forms inbox and in the Telegram chat.
3. Open the site with `?utm_source=test&gclid=TEST123` and submit again. The Telegram message
   must carry `Źródło: test · gclid: TEST123`. Without that line, attribution is not reaching
   the Function and no lead can ever be tied back to the click that paid for it.
4. Submit with an empty telephone: the field should go red with a message, not a blank page.
5. A successful submit must land on `/dziekujemy` — that page is the analytics goal.

If one channel arrives and the other does not, the Function answers 200 with `partial: true`
and logs the reason: Workers & Pages → project → Logs.

## 4. Automatic deploys from GitHub

Workers & Pages → `ALU3` → Settings → Builds & deployments → Connect to Git.

| Setting           | Value                                                      |
| ----------------- | ---------------------------------------------------------- |
| Repository        | `forevord/landing-2-go`                                    |
| Production branch | `main`                                                     |
| Framework preset  | None                                                       |
| Build command     | `npm run build`                                            |
| Output directory  | `dist`                                                     |
| Node version      | set `NODE_VERSION = 22` if the build picks something older |

## 5. Domain

The temporary address is hard-coded in two places: `site` in `astro.config.mjs` (canonical
and hreflang depend on it) and the `Sitemap:` line in `public/robots.txt`.

1. Project → Custom domains → add the domain; Cloudflare issues the certificate.
2. Change the address in both files, rebuild, redeploy.
3. Check `/sitemap.xml` and `<link rel="canonical">` on both locales.

The name "ALU3" still needs a domain and trademark check before launch — a risk recorded
in the original spec.

## 6. Analytics

Analytics & Logs → Web Analytics → Add a site, then take the beacon token.

`PUBLIC_CF_BEACON_TOKEN` is a **build-time** variable, not a runtime one. With Git deploys it
belongs in the project's environment variables; with direct upload from a laptop it belongs
in a local `.env` before `npm run build`. While it is unset the beacon script is omitted from
the page entirely, so nothing breaks before then.

## 7. When it goes wrong

| Symptom                              | Cause                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Form returns 502                     | No secrets in the environment being tested, or no redeploy after adding them                                 |
| Email arrives, Telegram silent       | Wrong `chat_id`, or the bot was never added to the group. Re-check `getUpdates`; keep the minus sign         |
| Build fails on Cloudflare            | Node version — set `NODE_VERSION = 22`                                                                       |
| 404 on every page but the homepage   | Output directory is not `dist`                                                                               |
| `/api/lead` returns 404              | `wrangler pages deploy` was run from somewhere other than the project root, so `functions/` was not uploaded |
| wrangler complains about permissions | `npx wrangler logout`, then `npx wrangler login` again                                                       |

## 8. Before any traffic is sent at the site

- [ ] Demo values in `src/i18n/{pl,en}.json` replaced and `_meta.demo` set to `false`. While
      it is `true` the `carry no invented demo data` test fails on purpose — that is the
      pre-launch gate.
- [ ] The hardcoded `phone` and `email` constants updated in the six page files.
- [ ] The before/after pair reshot from one position. Two different sites is fabricated
      evidence of work and must not ship.
- [ ] Testimonials: the section stays out of the DOM while `testimonials._placeholder` is
      `true`. Publishing invented reviews breaches the EU Omnibus Directive.
- [ ] The live lead path proven (section 3).
- [ ] Domain connected and the address corrected in both files.
- [ ] Web Analytics enabled and the beacon token set.

## 9. Local commands

```bash
npm run dev        # Astro dev server
npm run build      # static build into dist/
npm run preview    # wrangler pages dev dist — the only way to exercise /api/lead locally
npm test           # vitest; one test fails on purpose, see the gate above
npm run lint       # eslint + astro check
npm run check:copy # fails if Polish copy appears outside src/i18n/
```

Local Function secrets go in `.dev.vars` at the project root (git-ignored):

```
WEB3FORMS_ACCESS_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```
