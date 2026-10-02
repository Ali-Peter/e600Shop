import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../config/supabase.config';

const NOT_CONFIGURED_MESSAGE =
  'Google sign-in is unavailable because the Supabase URL or anon key is not configured.';
const SIGN_IN_ERROR_MESSAGE = 'We could not start Google sign-in. Please try again.';
const SIGN_OUT_ERROR_MESSAGE = 'We could not sign you out. Please try again.';

/** Reads a non-empty string out of Supabase user metadata. */
function readMetadataString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

/**
 * Google authentication backed by Supabase Auth.
 *
 * State is exposed as signals, matching CartService/ProductService. The session
 * is persisted by Supabase (local storage + token auto-refresh), so it survives
 * page reloads.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly sessionState = signal<Session | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly readyState = signal(false);

  readonly session = this.sessionState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly errorMessage = this.errorState.asReadonly();

  /** True once the initial session lookup has finished. */
  readonly ready = this.readyState.asReadonly();

  /** False when the Supabase project URL/key are missing. */
  readonly isConfigured = this.client !== null;

  readonly user = computed<User | null>(() => this.sessionState()?.user ?? null);

  readonly isSignedIn = computed(() => this.user() !== null);

  readonly email = computed(() => this.user()?.email ?? null);

  readonly displayName = computed<string | null>(() => {
    const currentUser = this.user();
    if (!currentUser) {
      return null;
    }

    const metadata = currentUser.user_metadata as Record<string, unknown> | undefined;
    const fullName =
      readMetadataString(metadata, 'full_name') ?? readMetadataString(metadata, 'name');
    if (fullName) {
      return fullName;
    }

    const email = currentUser.email;
    return email ? email.split('@')[0] : 'Signed in';
  });

  /**
   * Avatar URL carried by the Google session. Supabase stores the provider
   * picture in `user_metadata.avatar_url` (Google's raw `picture` claim is
   * mapped there too); depending on project configuration it can live on the
   * identity record instead, so both locations are checked.
   */
  readonly avatarUrl = computed<string | null>(() => {
    const user = this.user();
    if (!user) {
      return null;
    }

    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const fromMetadata =
      readMetadataString(metadata, 'avatar_url') ?? readMetadataString(metadata, 'picture');
    if (fromMetadata) {
      return fromMetadata;
    }

    for (const identity of user.identities ?? []) {
      const identityData = identity.identity_data as Record<string, unknown> | undefined;
      const fromIdentity =
        readMetadataString(identityData, 'avatar_url') ??
        readMetadataString(identityData, 'picture');
      if (fromIdentity) {
        return fromIdentity;
      }
    }

    return null;
  });

  constructor() {
    const client = this.client;

    if (!client) {
      this.errorState.set(NOT_CONFIGURED_MESSAGE);
      this.readyState.set(true);
      return;
    }

    // Tracks whether an auth event has already delivered the authoritative
    // session, so a slower getSession() resolution cannot overwrite it.
    let authEventReceived = false;

    // Keeps the signals in sync with sign-in, sign-out, token refresh and the
    // session exchanged from the OAuth redirect.
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      this.sessionState.set(session);
      this.readyState.set(true);
    });

    this.destroyRef.onDestroy(() => data.subscription.unsubscribe());

    // Restores an existing session immediately on startup.
    void client.auth
      .getSession()
      .then(({ data: sessionData }) => {
        if (!authEventReceived) {
          this.sessionState.set(sessionData.session);
        }
        this.readyState.set(true);
      })
      .catch(() => {
        this.readyState.set(true);
      });
  }

  /** Starts the Google OAuth flow, returning to `/login` afterwards. */
  async signInWithGoogle(): Promise<void> {
    const client = this.client;

    if (!client) {
      this.errorState.set(NOT_CONFIGURED_MESSAGE);
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${globalThis.location.origin}/login` },
      });

      if (error) {
        this.errorState.set(SIGN_IN_ERROR_MESSAGE);
        this.loadingState.set(false);
      }
      // On success Supabase redirects the browser to Google, so `loading` stays
      // true until the page unloads and nothing further is required here.
    } catch {
      this.errorState.set(SIGN_IN_ERROR_MESSAGE);
      this.loadingState.set(false);
    }
  }

  async signOut(): Promise<void> {
    const client = this.client;

    if (!client) {
      this.errorState.set(NOT_CONFIGURED_MESSAGE);
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const { error } = await client.auth.signOut();

      if (error) {
        this.errorState.set(SIGN_OUT_ERROR_MESSAGE);
        return;
      }

      this.sessionState.set(null);
    } catch {
      this.errorState.set(SIGN_OUT_ERROR_MESSAGE);
    } finally {
      this.loadingState.set(false);
    }
  }
}