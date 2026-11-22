import React, { useState } from 'react';
import { ClerkProvider } from '@clerk/react';

export const CLERK_KEY_STORAGE = 'book_my_chef_clerk_pub_key';

/**
 * Retrieves the Clerk Publishable Key in order of precedence:
 * 1. Runtime environment injected by Docker/Railway (window.__ENV__)
 * 2. Build-time environment variable (import.meta.env)
 * 3. Local development storage override (Dev only)
 */
export function getClerkPublishableKey() {
  const runtimeKey = typeof window !== 'undefined' && 
    (window.__ENV__?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || window.__ENV__?.VITE_CLERK_PUBLISHABLE_KEY);
  if (runtimeKey && !runtimeKey.startsWith('${') && runtimeKey.trim() !== '') {
    return runtimeKey.trim();
  }

  const buildTimeKey = import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (buildTimeKey && buildTimeKey.trim() !== '' && !buildTimeKey.includes('YOUR_CLERK_PUBLISHABLE_KEY')) {
    return buildTimeKey.trim();
  }

  // Allow developer override in local development mode only
  if (import.meta.env.DEV) {
    const localKey = window.localStorage.getItem(CLERK_KEY_STORAGE);
    if (localKey && localKey.trim() !== '') {
      return localKey.trim();
    }
  }

  return '';
}

export function saveClerkPublishableKey(key) {
  if (key && key.trim() !== '') {
    window.localStorage.setItem(CLERK_KEY_STORAGE, key.trim());
  } else {
    window.localStorage.removeItem(CLERK_KEY_STORAGE);
  }
}

/**
 * ClerkAuthProvider:
 * Securely initializes ClerkProvider with validated keys.
 * Adheres strictly to Phase 2 & Phase 13:
 * - In Production: Never leaks internal file paths or exposes prompt dialogs to customers.
 * - In Development: Provides clean diagnostic state.
 */
export default function ClerkAuthProvider({ children }) {
  const [pubKey] = useState(getClerkPublishableKey());
  const isDev = import.meta.env.DEV;

  // Case 1: Valid Publishable Key is present
  if (pubKey && (pubKey.startsWith('pk_test_') || pubKey.startsWith('pk_live_'))) {
    return (
      <ClerkProvider publishableKey={pubKey}>
        {children}
      </ClerkProvider>
    );
  }

  // Case 2: Missing key in Development
  if (isDev) {
    console.warn(
      '[DEV NOTICE] Clerk Publishable Key is not yet configured. Provide VITE_CLERK_PUBLISHABLE_KEY in apps/web/.env to enable live Clerk SMS delivery.'
    );
  } else {
    // Case 3: Missing key in Production (Diagnostic logged securely without leaking secrets)
    console.error(
      '[AUTH CONFIG] VITE_CLERK_PUBLISHABLE_KEY is not configured in production environment. Verify Railway service variables.'
    );
  }

  // In production, render cleanly without any intrusive debug banners or internal path disclosure
  return <>{children}</>;
}
