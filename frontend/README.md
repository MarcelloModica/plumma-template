# Frontend (React + Vite + TanStack)

SPA React del template. Stack: **Vite**, **TanStack Router** (file-based), **TanStack Query**,
**Tailwind** + componenti shadcn/ui, **i18next** (IT/EN).

## Sviluppo

```bash
npm install
npm run dev        # http://localhost:3000
```

Il dev server proxa `/api`, `/token`, `/services` verso il backend su `http://localhost:8080`
(sovrascrivibile con `VITE_BACKEND_URL`). Vedi `vite.config.ts`.

## Autenticazione

`src/lib/AuthService.ts` gestisce la sessione JWT (login username/password via `POST /token`,
OAuth Google/Microsoft 365 via redirect e callback su `/oauth/callback`). Il token e le info
utente sono in `localStorage`.

Rotte principali (`src/routes/`):
- `login.tsx` — login username/password + Google + Microsoft 365
- `oauth/callback.tsx` — riceve il token OAuth dal backend
- `_authenticated.tsx` — guard delle rotte protette (header + logout)
- `_authenticated/dashboard.tsx` — esempio CRUD collegato a `/api/items`
- `registerMe.tsx` — placeholder onboarding per utenti OAuth non ancora a DB

## API

`src/lib/api.ts` (`apiFetch`) aggiunge automaticamente l'header `Authorization: Bearer` e gestisce
il 401/redirect al login. Base URL in `src/lib/api-base.ts`: relativa in dev/prod (stesso origin),
sovrascrivibile con `VITE_API_BASE_URL`.

## i18n

Traduzioni in `src/i18n/locales/{it,en}.json`, selettore lingua nell'header e nella pagina di login.

## Build

```bash
npm run build      # genera dist/, copiata nel WAR dal modulo backend
```

Di norma non serve buildare a mano: `./mvnw clean package` dalla root compila il frontend e lo
include nel WAR.
