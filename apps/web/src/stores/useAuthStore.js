import { create } from 'zustand';
import { api } from '../services/api';

/**
 * Signed-in account state. The source of truth is the Clerk session plus the
 * backend's /auth/me — nothing is persisted to localStorage, so a stale or
 * hand-edited local value can never grant access.
 *
 * status:
 *   'loading'   – Clerk or the account is still loading
 *   'signedOut' – no Clerk session
 *   'needsSync' – Clerk session exists but the account is not set up yet
 *   'blocked'   – account suspended
 *   'error'     – server unreachable
 *   'ready'     – account loaded
 */
export const useAuthStore = create((set, get) => ({
  status: 'loading',
  account: null,
  error: null,

  /** Load the account for the current Clerk session. */
  async refresh() {
    try {
      const account = await api.auth.me();
      set({ status: 'ready', account, error: null });
      return account;
    } catch (e) {
      // A sign-in screen may have completed /auth/sync while this request was in flight.
      if (get().account) return get().account;
      if (e.status === 404) set({ status: 'needsSync', account: null, error: null });
      else if (e.status === 403) set({ status: 'blocked', account: null, error: e.message });
      else if (e.status === 401) set({ status: 'signedOut', account: null, error: null });
      else set({ status: 'error', account: null, error: e.message });
      return null;
    }
  },

  /** Create or load the account after Clerk verified the user. Throws on failure. */
  async completeSignIn(payload) {
    const account = await api.auth.sync(payload);
    set({ status: 'ready', account, error: null });
    return account;
  },

  patchAccount(patch) {
    set((s) => ({ account: s.account ? { ...s.account, ...patch } : s.account }));
  },

  setSignedOut() {
    set({ status: 'signedOut', account: null, error: null });
  },

  async logout() {
    try {
      await window.Clerk?.signOut();
    } catch {
      /* already signed out */
    }
    try {
      // Remove values written by earlier versions of the app.
      ['book_my_chef_auth_session', 'bmc_clerk_token', 'token'].forEach((k) => localStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
    set({ status: 'signedOut', account: null, error: null });
  },
}));

/** Console home for an account type. */
export function homeFor(userType) {
  if (userType === 'PROVIDER') return '/provider/dashboard';
  if (userType === 'ADMIN') return '/admin';
  return '/customer/home';
}
