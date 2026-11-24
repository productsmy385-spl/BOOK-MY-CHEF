import { useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/react';
import { useAuthStore } from '../../stores/useAuthStore';

/** Publishable key from runtime config (Docker/Railway) or the Vite build. Never a secret key. */
export function getClerkPublishableKey() {
  const runtime = typeof window !== 'undefined' && window.__ENV__?.VITE_CLERK_PUBLISHABLE_KEY;
  if (runtime && !runtime.startsWith('${') && runtime.trim()) return runtime.trim();
  const build = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  return build && build.trim() && !build.includes('YOUR_') ? build.trim() : '';
}

export const isClerkConfigured = () => /^pk_(test|live)_/.test(getClerkPublishableKey());

/** Keeps the account store in step with the Clerk session. */
function AuthBootstrap() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const refresh = useAuthStore((s) => s.refresh);
  const setSignedOut = useAuthStore((s) => s.setSignedOut);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) refresh();
    else setSignedOut();
  }, [isLoaded, isSignedIn, userId, refresh, setSignedOut]);

  return null;
}

export default function ClerkAuthProvider({ children }) {
  const key = getClerkPublishableKey();
  const setSignedOut = useAuthStore((s) => s.setSignedOut);
  const refresh = useAuthStore((s) => s.refresh);

  useEffect(() => {
    if (!isClerkConfigured()) {
      // Sign-in screens explain that sign-in is unavailable; browsing still works.
      // A session object injected by an automated test harness is still honoured;
      // the API verifies every token regardless.
      if (window.Clerk?.session) refresh();
      else {
        console.error('[config] VITE_CLERK_PUBLISHABLE_KEY is missing; sign-in is disabled.');
        setSignedOut();
      }
    }
  }, [setSignedOut, refresh]);

  if (!isClerkConfigured()) return children;
  return (
    <ClerkProvider publishableKey={key} afterSignOutUrl="/">
      <AuthBootstrap />
      {children}
    </ClerkProvider>
  );
}
