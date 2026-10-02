import { InjectionToken } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase project used for Google authentication.
 *
 * The anon / publishable key is safe to ship in a browser bundle by design — it
 * only grants what Row Level Security allows. The service-role key must NEVER be
 * placed here or anywhere else in the frontend.
 *
 * TODO: move these into environment files if build targets are introduced later.
 */
export const SUPABASE_URL = 'https://twzyqznaqllardqboxtz.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_POJ1oJzmiyhN6wKJx4KGGA_MTj7ff57';

/** True when both a plausible project URL and a key are present. */
export function isSupabaseConfigured(): boolean {
  return (
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_URL.length > 'https://'.length &&
    SUPABASE_ANON_KEY.trim().length > 0
  );
}

/**
 * Builds the Supabase browser client, or returns `null` when the project is not
 * configured. It never throws: the auth control lives in the site header, which
 * renders on every page, so a throwing dependency would break the whole app.
 *
 * The client is memoised so a browser context only ever has a single GoTrue
 * instance sharing one storage key.
 */
export function createSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  cachedClient = buildSupabaseClient();
  return cachedClient;
}

let cachedClient: SupabaseClient | null | undefined;

function buildSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // PKCE is the recommended flow for browser apps and keeps the session
        // in local storage so the user stays signed in across reloads.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        // Lets Supabase exchange the ?code= returned by Google automatically.
        detectSessionInUrl: true,
      },
    });
  } catch {
    return null;
  }
}

/** Injectable Supabase client. Resolves to `null` when unconfigured. */
export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient | null>('SUPABASE_CLIENT', {
  providedIn: 'root',
  factory: createSupabaseClient,
});