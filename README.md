# SalesDesk Frontend

Standalone Angular SPA for SalesDesk. This repository contains no backend code or C# dependencies — it talks to [salesdesk-backend](../salesdesk-backend) exclusively over its REST API.

## Running locally

```bash
npm install
npm start
```

`npm start` runs `ng serve --proxy-config proxy.conf.json`, which forwards any `/api/*` request to `http://localhost:5187` (the backend's default local port — see `proxy.conf.json`). Point it at a different backend by editing that file; nothing in application code hardcodes a backend port (see below).

## How the API base URL works

No component or service ever hardcodes `localhost:<port>`. Every HTTP call goes through `environment.apiBaseUrl`:

- **`src/environments/environment.ts`** (dev, used by `ng serve`) — `apiBaseUrl: ''`, so calls resolve to relative `/api/...` URLs and go through the dev-server proxy above.
- **`src/environments/environment.prod.ts`** (production, swapped in via `angular.json`'s `fileReplacements` on `ng build --configuration production`) — `apiBaseUrl` starts as the literal placeholder `__API_BASE_URL__`, which the deploy pipeline replaces with the real backend URL at build time (Angular's equivalent of Vite's `VITE_API_BASE_URL` / Next's `NEXT_PUBLIC_API_URL`, since Angular has no built-in `.env` support — see [DEPLOYMENT.md](DEPLOYMENT.md)).

Every service under `src/app/core/services/` builds its request URL from `` `${environment.apiBaseUrl}/api/...` ``.

## Auth

`src/app/core/interceptors/auth.interceptor.ts` attaches the stored bearer token to every outgoing request automatically and logs out + redirects to `/login` on a 401 — no per-call auth wiring needed in services.

## Tests

```bash
npm test
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Vercel setup and how the production API URL gets injected.
