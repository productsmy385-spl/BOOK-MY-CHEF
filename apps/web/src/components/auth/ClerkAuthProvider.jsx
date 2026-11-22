import React, { useState } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

export const CLERK_KEY_STORAGE = 'book_my_chef_clerk_pub_key';

export function getClerkPublishableKey() {
  return (
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
    window.localStorage.getItem(CLERK_KEY_STORAGE) ||
    ''
  );
}

export function saveClerkPublishableKey(key) {
  if (key) {
    window.localStorage.setItem(CLERK_KEY_STORAGE, key.trim());
  } else {
    window.localStorage.removeItem(CLERK_KEY_STORAGE);
  }
}

/**
 * ClerkAuthProvider: Wraps app in ClerkProvider when publishableKey is configured.
 * Provides runtime key configuration dialog if not yet defined.
 */
export default function ClerkAuthProvider({ children }) {
  const [pubKey, setPubKey] = useState(getClerkPublishableKey());

  if (!pubKey) {
    // If Clerk key is not yet configured, render children with top guidance bar
    return (
      <>
        <div className="bg-[#0D47A1] text-white text-[11px] font-sora py-2 px-4 flex items-center justify-between z-50 relative border-b border-[#2196F3]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-300">key</span>
            <span>
              <strong>Clerk SMS OTP Config:</strong> Add <code className="bg-black/20 px-1.5 py-0.5 rounded font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> in <code className="bg-black/20 px-1.5 py-0.5 rounded font-mono">apps/web/.env</code> to enable live SMS OTP delivery.
            </span>
          </div>
          <button
            onClick={() => {
              const entered = prompt('Enter your Clerk Publishable Key (pk_test_... or pk_live_...):', pubKey);
              if (entered && entered.trim()) {
                saveClerkPublishableKey(entered);
                setPubKey(entered.trim());
                window.location.reload();
              }
            }}
            className="px-2.5 py-1 bg-[#2196F3] hover:bg-[#1E88E5] text-white rounded-md font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm ml-2 flex-shrink-0"
          >
            Set Key
          </button>
        </div>
        {children}
      </>
    );
  }

  return (
    <ClerkProvider publishableKey={pubKey}>
      {children}
    </ClerkProvider>
  );
}
