# e600Shop — Angular storefront

Angular 21 storefront for the e600Shop task: product catalogue with search and
category filters, cart, guest checkout with **server-side pricing**, order
confirmation e-mail (**Mailgun**), and **Google sign-in via Supabase Auth**
(session survives a page refresh; the Google profile avatar is shown in the
header and on the login card).

Backend: ASP.NET Core API in [`../e600ShopApi`](../e600ShopApi/README.md) — see
that README for all backend, database and production configuration values.

## Local development

```bash
npm install
npm start   # ng serve → http://localhost:4200
```

Run the API separately (`dotnet run --project ../e600ShopApi/e600ShopApi`); it
listens on `http://localhost:5264` (`Properties/launchSettings.json`).

## API base URL configuration

`src/app/core/config/api.config.ts` is the only place the API origin is defined —
no other file may hard-code it. Resolution order (first non-empty value wins):

1. **Runtime override — configure during deployment, no rebuild needed:** set
   `window.__E600SHOP_API_BASE_URL__` in `index.html` before the app bundle:

   ```html
   <script>
     window.__E600SHOP_API_BASE_URL__ = 'https://api.example.com';
   </script>
   ```

2. **Build-time value** from `src/environments/`, swapped by the `production`
   `fileReplacements` configuration in `angular.json`:
   - `environment.ts` (development — `ng serve` / `ng test`):
     `http://localhost:5264`
   - `environment.prod.ts` (`ng build`): empty by default. Leave it empty when
     the API is served **same-origin** behind a reverse proxy (`/api/...`), or
     fill in the real API origin at build time. No production URL is invented,
     and **no secrets ever go in the frontend** — only public URLs.

## Supabase / Google sign-in (frontend)

- `src/app/core/config/supabase.config.ts` contains only the public Supabase
  project URL and the **publishable (anon) key** — safe in browsers by design.
  Never add the `service_role` key or OAuth client secrets.
- Google Cloud OAuth, the Supabase Google provider, the OAuth callback URL and
  the `/login` redirect URLs are external console settings documented in the
  backend README — no code changes are required to deploy them.

## Build

```bash
npm run build   # production build → dist/e600Shop
```

## Unit tests (Vitest)

```bash
npx ng test --watch=false
```

End-to-end tests: `ng e2e` (no framework installed by default — pick one if
you need them).

## Additional resources

For more information on the Angular CLI, see the
[Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).

