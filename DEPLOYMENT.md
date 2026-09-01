# Deployment

Target: Vercel free tier (static SPA + global CDN). Render's free/starter static site works the same way if you'd rather keep both services on one platform — swap the steps below for Render's dashboard equivalents; the `web.Dockerfile` in `infrastructure/docker/` exists for that path (or any other container host).

## One-time setup (Vercel)

1. Import this repository into a new Vercel project (vercel.com → Add New → Project → this GitHub repo). Vercel auto-detects `vercel.json` for the build command, output directory, and SPA rewrites — no manual framework config needed.
2. Add Vercel **project environment variables**:
   | Variable | Value |
   |---|---|
   | `API_BASE_URL` | The deployed backend's URL, e.g. `https://api.salesdesk.com` |
   | `GA_MEASUREMENT_ID` | (optional) Your GA4 property's Measurement ID, e.g. `G-XXXXXXXXXX` — found in GA4 Admin → Data Streams → your web stream. Leave unset to ship with analytics disabled. |

   `vercel.json`'s `buildCommand` substitutes these into `src/environments/environment.prod.ts`'s `__API_BASE_URL__` / `__GA_MEASUREMENT_ID__` placeholders before `ng build --configuration production` runs — this is the "static build secret" injection, since a compiled Angular bundle can't read an env var at runtime the way a Node server could.
3. Once connected, Vercel deploys automatically on every push to `main` (production) and creates a preview deployment for every PR — no GitHub Actions step is needed to trigger the deploy itself.
4. If you set `GA_MEASUREMENT_ID`, go into GA4 (Admin → Events, once real traffic has produced them) and mark `landing_view`, `signup_started`, and `first_quote_sent` as **key events** — see `core/services/analytics.service.ts` and `docs/research/TASK-DAY-BY-DAY-MARKET.md` for what each one tracks and where it fires. Marking key events is a GA4-console step, not something the build/deploy pipeline can do for you.

## CI gate

`.github/workflows/deploy-web.yml` runs on every push/PR: `npm ci`, headless-Chrome unit tests, and a production build. Set it as a required status check on `main` (repo Settings → Branches) so a broken build can't merge, independent of what Vercel does with the push.

## Custom domain & TLS

Vercel project → Settings → Domains → add `app.salesdesk.com`, then add the CNAME/A record it gives you at your DNS provider. TLS certificates are issued and renewed automatically once DNS resolves.

## Cost

Vercel's free (Hobby) tier covers a single-team static SPA with this traffic profile at $0/mo — the ~$5–14/mo total budget in TASK-020 is entirely the backend + Postgres.
