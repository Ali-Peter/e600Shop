import { TestBed } from '@angular/core/testing';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../config/supabase.config';
import { AuthService } from './auth.service';

/** Minimal stand-in for the Supabase client, recording the calls we assert on. */
interface AuthStub {
  client: SupabaseClient;
  signInWithOAuthCalls: unknown[];
  signOutCalls: number;
  unsubscribeCalls: number;
  emit(event: string, session: Session | null): void;
}

function createAuthStub(
  options: { signInError?: unknown; signOutError?: unknown } = {},
): AuthStub {
  const signInWithOAuthCalls: unknown[] = [];
  let signOutCalls = 0;
  let unsubscribeCalls = 0;
  let listener: ((event: string, session: Session | null) => void) | null = null;

  const client = {
    auth: {
      signInWithOAuth: async (request: unknown) => {
        signInWithOAuthCalls.push(request);
        return { data: { provider: 'google' }, error: options.signInError ?? null };
      },
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
        listener = callback;
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                unsubscribeCalls += 1;
              },
            },
          },
        };
      },
      signOut: async () => {
        signOutCalls += 1;
        return { error: options.signOutError ?? null };
      },
    },
  } as unknown as SupabaseClient;

  return {
    client,
    signInWithOAuthCalls,
    get signOutCalls() {
      return signOutCalls;
    },
    get unsubscribeCalls() {
      return unsubscribeCalls;
    },
    emit(event: string, session: Session | null) {
      listener?.(event, session);
    },
  };
}

const GOOGLE_SESSION = {
  access_token: 'access-token',
  user: {
    id: 'user-1',
    email: 'ada@example.com',
    user_metadata: { full_name: 'Ada Obi', avatar_url: 'https://example.com/ada.png' },
  },
} as unknown as Session;

function setup(client: SupabaseClient | null): { service: AuthService } {
  TestBed.configureTestingModule({
    providers: [{ provide: SUPABASE_CLIENT, useValue: client }],
  });

  return { service: TestBed.inject(AuthService) };
}

describe('AuthService', () => {
  it('is a safe no-op when Supabase is not configured', async () => {
    const { service } = setup(null);

    expect(service.isConfigured).toBe(false);
    expect(service.isSignedIn()).toBe(false);
    expect(service.ready()).toBe(true);
    expect(service.errorMessage()).toContain('not configured');

    await expect(service.signInWithGoogle()).resolves.toBeUndefined();
    await expect(service.signOut()).resolves.toBeUndefined();
    expect(service.loading()).toBe(false);
  });

  it('starts the Google OAuth flow and returns to /login', async () => {
    const stub = createAuthStub();
    const { service } = setup(stub.client);

    await service.signInWithGoogle();

    expect(stub.signInWithOAuthCalls).toHaveLength(1);
    expect(stub.signInWithOAuthCalls[0]).toMatchObject({ provider: 'google' });
    expect(
      (stub.signInWithOAuthCalls[0] as { options: { redirectTo: string } }).options.redirectTo,
    ).toMatch(/\/login$/);
    expect(service.errorMessage()).toBeNull();
  });

  it('surfaces an error when Google sign-in cannot start', async () => {
    const stub = createAuthStub({ signInError: { message: 'provider disabled' } });
    const { service } = setup(stub.client);

    await service.signInWithGoogle();

    expect(service.errorMessage()).toContain('could not start Google sign-in');
    expect(service.loading()).toBe(false);
  });

  it('tracks the signed-in user from auth state changes', async () => {
    const stub = createAuthStub();
    const { service } = setup(stub.client);

    expect(service.isSignedIn()).toBe(false);

    stub.emit('SIGNED_IN', GOOGLE_SESSION);

    expect(service.isSignedIn()).toBe(true);
    expect(service.email()).toBe('ada@example.com');
    expect(service.displayName()).toBe('Ada Obi');
    expect(service.avatarUrl()).toBe('https://example.com/ada.png');
  });

  it('falls back to the email prefix when Google provides no name', () => {
    const stub = createAuthStub();
    const { service } = setup(stub.client);

    stub.emit('SIGNED_IN', {
      user: { id: 'user-2', email: 'buyer@example.com', user_metadata: {} },
    } as unknown as Session);

    expect(service.displayName()).toBe('buyer');
    expect(service.avatarUrl()).toBeNull();
  });

  it('reads the avatar from the picture claim when avatar_url is missing', () => {
    const stub = createAuthStub();
    const { service } = setup(stub.client);

    stub.emit('SIGNED_IN', {
      user: {
        id: 'user-3',
        email: 'zoe@example.com',
        user_metadata: { full_name: 'Zoe Adeyemi', picture: 'https://example.com/zoe.png' },
      },
    } as unknown as Session);

    expect(service.avatarUrl()).toBe('https://example.com/zoe.png');
  });

  it('falls back to the identity data when user_metadata has no avatar', () => {
    const stub = createAuthStub();
    const { service } = setup(stub.client);

    stub.emit('SIGNED_IN', {
      user: {
        id: 'user-4',
        email: 'kim@example.com',
        user_metadata: { full_name: 'Kim Nwosu' },
        identities: [{ identity_data: { picture: 'https://example.com/kim.png' } }],
      },
    } as unknown as Session);

    expect(service.avatarUrl()).toBe('https://example.com/kim.png');
  });

  it('clears the session on sign out', async () => {
    const stub = createAuthStub();
    const { service } = setup(stub.client);

    stub.emit('SIGNED_IN', GOOGLE_SESSION);
    expect(service.isSignedIn()).toBe(true);

    await service.signOut();

    expect(stub.signOutCalls).toBe(1);
    expect(service.isSignedIn()).toBe(false);
    expect(service.loading()).toBe(false);
  });

  it('reports a sign-out failure without clearing the session', async () => {
    const stub = createAuthStub({ signOutError: { message: 'network down' } });
    const { service } = setup(stub.client);

    stub.emit('SIGNED_IN', GOOGLE_SESSION);
    await service.signOut();

    expect(service.errorMessage()).toContain('could not sign you out');
    expect(service.isSignedIn()).toBe(true);
  });

  it('unsubscribes from auth state changes on destroy', () => {
    const stub = createAuthStub();
    const { service } = setup(stub.client);

    expect(service.isConfigured).toBe(true);
    expect(stub.unsubscribeCalls).toBe(0);

    TestBed.resetTestingModule();

    expect(stub.unsubscribeCalls).toBe(1);
  });
});