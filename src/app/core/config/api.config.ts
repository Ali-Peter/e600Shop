import { environment } from '../../../environments/environment';

/**
 * Base URL of the ASP.NET Core Product API — the single place it is defined;
 * no other file may hard-code the API host.
 *
 * Resolution order (first non-empty value wins; trailing slashes stripped):
 *  1. `window.__E600SHOP_API_BASE_URL__` — optional runtime override so a
 *     deployment can point the already-built bundle at its API without
 *     rebuilding (add a <script> tag in index.html before the app bundle).
 *  2. `environment.apiBaseUrl` — swapped per build configuration in
 *     angular.json (`fileReplacements`):
 *       - development (`ng serve` / `ng test`): http://localhost:5264
 *       - production (`ng build`): environments/environment.prod.ts — empty by
 *         default (same-origin `/api/...`); fill in the real API origin at
 *         build time. No production URL is invented here, and no secrets
 *         ever belong in the frontend.
 */
const runtimeOverride = (globalThis as { __E600SHOP_API_BASE_URL__?: string })
  .__E600SHOP_API_BASE_URL__;

export const API_BASE_URL = (runtimeOverride || environment.apiBaseUrl).replace(/\/+$/, '');

