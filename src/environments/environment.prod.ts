/**
 * Production build settings — applied by `ng build` via the `fileReplacements`
 * entry on the `production` configuration in angular.json.
 *
 * `apiBaseUrl` is intentionally empty: no production URL is invented in source.
 *  - Empty -> requests are same-origin (`/api/...`), correct when the API is
 *    served behind the same domain / reverse proxy as the static frontend.
 *  - Separate API host -> set the real origin here before building, or leave
 *    this empty and set `window.__E600SHOP_API_BASE_URL__` in the built
 *    index.html at deploy time (no rebuild required).
 *
 * Public configuration only — never put secrets in the frontend.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://e600shopapi.onrender.com',
};
