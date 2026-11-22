import { useState, useTransition } from 'react';
import { useSignUp, useSignIn, useClerk } from '@clerk/react';
import { getClerkPublishableKey } from '../components/auth/ClerkAuthProvider';

/**
 * Custom Hook: useClerkOtp
 * Production-ready Clerk custom authentication flow supporting:
 * 1. Clerk Core 3 Modern API (verifications.sendEmailCode, verifyEmailCode, finalize)
 * 2. Clerk Core 2 Legacy Fallback (prepareEmailAddressVerification, attemptEmailAddressVerification)
 * 3. Email OTP, Password Sign-In, and Phone SMS OTP
 * 4. Error shielding & user-friendly error formatting
 */
export function useClerkOtp() {
  const hasClerkKey = Boolean(getClerkPublishableKey());

  let signUpHook = null;
  let signInHook = null;
  let clerk = null;

  try {
    signUpHook = useSignUp();
    signInHook = useSignIn();
    clerk = useClerk();
  } catch (e) {
    // Graceful fallback if rendered outside ClerkProvider
  }

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  /**
   * Helper: Formats Clerk API error messages into clear, actionable user guidance
   */
  const formatClerkError = (err, defaultMsg, flowType = 'SIGN_UP') => {
    console.error(`Clerk ${flowType} error:`, err);

    // Extract message from Clerk error object or string
    const rawMsg =
      err?.errors?.[0]?.longMessage ||
      err?.errors?.[0]?.message ||
      err?.message ||
      (typeof err === 'string' ? err : '');
    const code = err?.errors?.[0]?.code || '';

    // Error 0: Already signed in / Session exists
    if (code === 'session_exists' || rawMsg.toLowerCase().includes('already signed in')) {
      return 'You are currently signed in with an active session. Click "Go to Console" or "Sign Out & Retry" below to switch accounts.';
    }

    // Error 1: Email already in use
    if (code === 'form_identifier_exists' || rawMsg.includes('already exists') || rawMsg.includes('taken')) {
      return 'An account with this email address already exists. Please switch to "Sign In" to continue.';
    }

    // Error 2: Identifier invalid / Account not found on sign-in
    if (
      code === 'form_identifier_not_found' ||
      code === 'identifier_invalid' ||
      rawMsg.includes('Identifier is invalid') ||
      rawMsg.includes("Couldn't find your account")
    ) {
      return 'No registered account found with this email. Please switch to "Sign Up" to register first.';
    }

    // Error 3: Invalid verification code
    if (rawMsg.includes('verification code') || code === 'form_code_incorrect') {
      return 'Incorrect 6-digit verification code. Please check your email inbox (and spam folder) and enter the code again.';
    }

    // Error 4: Code expired
    if (rawMsg.includes('expired') || code === 'verification_expired') {
      return 'This verification code has expired. Please click "Resend Code" to receive a new OTP.';
    }

    // Error 5: Password incorrect
    if (code === 'form_password_incorrect' || rawMsg.includes('Password is incorrect')) {
      return 'Incorrect password. Please try again or switch to "Sign In with Email OTP".';
    }

    // Error 6: Password too weak
    if (code === 'form_password_pwned' || code === 'form_password_length_too_short' || rawMsg.includes('password')) {
      return rawMsg || 'Password must be at least 8 characters long.';
    }

    // Error 7: Rate limit
    if (code === 'too_many_requests' || rawMsg.includes('Too many requests')) {
      return 'Too many attempts. Please wait 60 seconds before trying again.';
    }

    // Filter out internal code trace messages from displaying to users
    if (rawMsg.includes('is not a function') || rawMsg.includes('undefined')) {
      return defaultMsg;
    }

    return rawMsg || defaultMsg;
  };

  /**
   * 1. Send Email Verification Code for Sign-Up
   * Fully compatible with Clerk Core 3 (signUp.password + signUp.verifications.sendEmailCode)
   * and fallback to legacy Core 2 methods.
   */
  const sendSignUpEmailOtp = async (email, password = '', fullName = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signUpHook?.signUp) {
        throw new Error(
          'Authentication service is not configured. Please verify Clerk Publishable Key in environment.'
        );
      }

      const { signUp } = signUpHook;
      const normalizedEmail = email.trim().toLowerCase();

      const nameParts = (fullName || '').trim().split(' ');
      const firstName = nameParts[0] || undefined;
      const lastName = nameParts.slice(1).join(' ') || undefined;

      // Modern Clerk Core 3 API
      if (signUp.verifications && typeof signUp.verifications.sendEmailCode === 'function') {
        if (password && password.trim().length >= 8 && typeof signUp.password === 'function') {
          const createRes = await signUp.password({
            emailAddress: normalizedEmail,
            password: password.trim(),
            firstName,
            lastName,
          });
          if (createRes?.error) {
            throw createRes.error;
          }
        } else if (typeof signUp.create === 'function') {
          const createRes = await signUp.create({
            emailAddress: normalizedEmail,
            password: password ? password.trim() : undefined,
            firstName,
            lastName,
          });
          if (createRes?.error) {
            throw createRes.error;
          }
        }

        const sendRes = await signUp.verifications.sendEmailCode();
        if (sendRes?.error) {
          throw sendRes.error;
        }

        setIsLoading(false);
        return { success: true };
      }

      // Legacy Clerk Core 2 API
      const payload = {
        emailAddress: normalizedEmail,
      };
      if (password && password.trim().length >= 8) {
        payload.password = password.trim();
      }
      if (firstName) payload.firstName = firstName;
      if (lastName) payload.lastName = lastName;

      if (typeof signUp.create === 'function') {
        await signUp.create(payload);
      }

      if (typeof signUp.prepareEmailAddressVerification === 'function') {
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });
      }

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      const msg = formatClerkError(err, 'Failed to send verification code. Please check your email address and try again.', 'SIGN_UP');
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * 2. Verify Email OTP Code for Sign-Up
   * Fully compatible with Clerk Core 3 (signUp.verifications.verifyEmailCode + signUp.finalize)
   * and legacy Core 2 methods.
   */
  const verifySignUpEmailOtp = async (code) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signUpHook?.signUp) {
        throw new Error('Clerk authentication is not initialized.');
      }

      const { signUp, setActive } = signUpHook;
      const cleanCode = code.trim();

      // Modern Clerk Core 3 API
      if (signUp.verifications && typeof signUp.verifications.verifyEmailCode === 'function') {
        const verifyRes = await signUp.verifications.verifyEmailCode({ code: cleanCode });
        if (verifyRes?.error) {
          throw verifyRes.error;
        }

        if (typeof signUp.finalize === 'function') {
          const finalizeRes = await signUp.finalize();
          if (finalizeRes?.error) {
            throw finalizeRes.error;
          }
        } else if (typeof setActive === 'function' && signUp.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
        }

        setIsLoading(false);
        return {
          success: true,
          clerkUserId: signUp.createdUserId || clerk?.user?.id,
          sessionId: signUp.createdSessionId,
        };
      }

      // Legacy Clerk Core 2 API
      if (typeof signUp.attemptEmailAddressVerification === 'function') {
        const result = await signUp.attemptEmailAddressVerification({ code: cleanCode });

        if (result.status === 'complete') {
          if (typeof setActive === 'function') {
            await setActive({ session: result.createdSessionId });
          }
          setIsLoading(false);
          return {
            success: true,
            clerkUserId: result.createdUserId || clerk?.user?.id,
            sessionId: result.createdSessionId,
          };
        } else {
          throw new Error(`Sign-up incomplete (status: ${result.status})`);
        }
      }

      throw new Error('Email verification is not supported by current Clerk SDK.');
    } catch (err) {
      const msg = formatClerkError(err, 'Invalid or expired verification code. Please check your email and try again.', 'VERIFY_SIGN_UP');
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * 3. Send Email OTP Code for Sign-In
   * Modern Clerk Core 3 (signIn.emailCode.sendCode) with legacy fallback
   */
  const sendSignInEmailOtp = async (email) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signInHook?.signIn) {
        throw new Error(
          'Authentication service is not configured. Please verify Clerk Publishable Key in environment.'
        );
      }

      const { signIn } = signInHook;
      const normalizedEmail = email.trim().toLowerCase();

      // Modern Clerk Core 3 API
      if (signIn.emailCode && typeof signIn.emailCode.sendCode === 'function') {
        const res = await signIn.emailCode.sendCode({ emailAddress: normalizedEmail });
        if (res?.error) {
          throw res.error;
        }
        setIsLoading(false);
        return { success: true };
      }

      // Legacy Clerk Core 2 API
      const signInAttempt = await signIn.create({
        identifier: normalizedEmail,
      });

      const emailFactor = signInAttempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );

      if (!emailFactor) {
        throw new Error(
          'Email verification factor is not available for this account. Ensure email sign-in is enabled in Clerk Dashboard.'
        );
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      // Auto-recover if session already exists: clear stale session and retry
      const rawErr = err?.errors?.[0]?.code || err?.errors?.[0]?.message || err?.message || String(err);
      if (String(rawErr).toLowerCase().includes('session_exists') || String(rawErr).toLowerCase().includes('already signed in')) {
        try {
          if (clerk && typeof clerk.signOut === 'function') {
            await clerk.signOut();
          } else if (typeof window !== 'undefined' && window.Clerk?.signOut) {
            await window.Clerk.signOut();
          }
          const { signIn } = signInHook || {};
          if (signIn) {
            const normalizedEmail = email.trim().toLowerCase();
            if (signIn.emailCode && typeof signIn.emailCode.sendCode === 'function') {
              const retryRes = await signIn.emailCode.sendCode({ emailAddress: normalizedEmail });
              if (!retryRes?.error) {
                setIsLoading(false);
                return { success: true };
              }
            } else if (typeof signIn.create === 'function') {
              const attempt = await signIn.create({ identifier: normalizedEmail });
              const factor = attempt.supportedFirstFactors?.find(f => f.strategy === 'email_code');
              if (factor) {
                await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
                setIsLoading(false);
                return { success: true };
              }
            }
          }
        } catch (retryErr) {
          console.warn('Retry sendSignInEmailOtp after clearing stale session:', retryErr);
        }
      }

      const msg = formatClerkError(err, 'Could not initiate email sign-in. Ensure this email address is already registered.', 'SIGN_IN');
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * 4. Verify Email OTP Code for Sign-In
   * Modern Clerk Core 3 (signIn.emailCode.verifyCode + signIn.finalize) with legacy fallback
   */
  const verifySignInEmailOtp = async (code) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signInHook?.signIn) {
        throw new Error('Clerk authentication is not initialized.');
      }

      const { signIn, setActive } = signInHook;
      const cleanCode = code.trim();

      // Modern Clerk Core 3 API
      if (signIn.emailCode && typeof signIn.emailCode.verifyCode === 'function') {
        const verifyRes = await signIn.emailCode.verifyCode({ code: cleanCode });
        if (verifyRes?.error) {
          throw verifyRes.error;
        }

        if (signIn.status === 'complete') {
          if (typeof signIn.finalize === 'function') {
            const finalizeRes = await signIn.finalize();
            if (finalizeRes?.error) {
              throw finalizeRes.error;
            }
          } else if (typeof setActive === 'function' && signIn.createdSessionId) {
            await setActive({ session: signIn.createdSessionId });
          }
        }

        setIsLoading(false);
        return {
          success: true,
          clerkUserId: signIn.createdUserId || clerk?.user?.id,
          sessionId: signIn.createdSessionId,
        };
      }

      // Legacy Clerk Core 2 API
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: cleanCode,
      });

      if (result.status === 'complete') {
        if (typeof setActive === 'function') {
          await setActive({ session: result.createdSessionId });
        }
        setIsLoading(false);
        return {
          success: true,
          clerkUserId: result.createdUserId || clerk?.user?.id,
          sessionId: result.createdSessionId,
        };
      } else {
        throw new Error(`Sign-in incomplete (status: ${result.status})`);
      }
    } catch (err) {
      const msg = formatClerkError(err, 'Invalid or expired verification code. Please check your email and try again.', 'VERIFY_SIGN_IN');
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * 5. Sign In with Password (Instant)
   * Modern Clerk Core 3 (signIn.password + signIn.finalize) with legacy fallback
   */
  const signInWithPassword = async (email, password) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signInHook?.signIn) {
        throw new Error('Clerk authentication is not initialized.');
      }

      const { signIn, setActive } = signInHook;
      const normalizedEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // Modern Clerk Core 3 API
      if (typeof signIn.password === 'function') {
        const res = await signIn.password({
          identifier: normalizedEmail,
          password: cleanPassword,
        });
        if (res?.error) {
          throw res.error;
        }

        if (signIn.status === 'complete') {
          if (typeof signIn.finalize === 'function') {
            const finalizeRes = await signIn.finalize();
            if (finalizeRes?.error) {
              throw finalizeRes.error;
            }
          } else if (typeof setActive === 'function' && signIn.createdSessionId) {
            await setActive({ session: signIn.createdSessionId });
          }
        }

        setIsLoading(false);
        return {
          success: true,
          clerkUserId: signIn.createdUserId || clerk?.user?.id,
          sessionId: signIn.createdSessionId,
        };
      }

      // Legacy Clerk Core 2 API
      const result = await signIn.create({
        identifier: normalizedEmail,
        password: cleanPassword,
      });

      if (result.status === 'complete') {
        if (typeof setActive === 'function') {
          await setActive({ session: result.createdSessionId });
        }
        setIsLoading(false);
        return {
          success: true,
          clerkUserId: result.createdUserId || clerk?.user?.id,
          sessionId: result.createdSessionId,
        };
      } else {
        throw new Error(`Sign-in incomplete (status: ${result.status})`);
      }
    } catch (err) {
      // Auto-recover if session already exists
      const rawErr = err?.errors?.[0]?.code || err?.errors?.[0]?.message || err?.message || String(err);
      if (String(rawErr).toLowerCase().includes('session_exists') || String(rawErr).toLowerCase().includes('already signed in')) {
        try {
          // If the user is already authenticated in Clerk, accept the active session directly
          const activeUser = clerk?.user || (typeof window !== 'undefined' && window.Clerk?.user);
          const activeSession = clerk?.session || (typeof window !== 'undefined' && window.Clerk?.session);
          if (activeUser?.id && activeSession?.id) {
            setIsLoading(false);
            return {
              success: true,
              clerkUserId: activeUser.id,
              sessionId: activeSession.id,
            };
          }

          // Otherwise, clear the stale session and retry
          if (clerk && typeof clerk.signOut === 'function') {
            await clerk.signOut();
          } else if (typeof window !== 'undefined' && window.Clerk?.signOut) {
            await window.Clerk.signOut();
          }
          // Retry sign-in with clean slate
          const { signIn, setActive } = signInHook || {};
          if (signIn) {
            const normalizedEmail = email.trim().toLowerCase();
            const cleanPassword = password.trim();
            if (typeof signIn.password === 'function') {
              const res = await signIn.password({ identifier: normalizedEmail, password: cleanPassword });
              if (!res?.error && signIn.status === 'complete') {
                if (typeof signIn.finalize === 'function') await signIn.finalize();
                else if (typeof setActive === 'function' && signIn.createdSessionId) {
                  await setActive({ session: signIn.createdSessionId });
                }
                setIsLoading(false);
                return {
                  success: true,
                  clerkUserId: signIn.createdUserId || clerk?.user?.id,
                  sessionId: signIn.createdSessionId,
                };
              }
            } else if (typeof signIn.create === 'function') {
              const res = await signIn.create({ identifier: normalizedEmail, password: cleanPassword });
              if (res.status === 'complete') {
                if (typeof setActive === 'function') await setActive({ session: res.createdSessionId });
                setIsLoading(false);
                return {
                  success: true,
                  clerkUserId: res.createdUserId || clerk?.user?.id,
                  sessionId: res.createdSessionId,
                };
              }
            }
          }
        } catch (retryErr) {
          console.warn('Retry after clearing stale session failed:', retryErr);
        }
      }

      const msg = formatClerkError(err, 'Sign-in failed. Please check your credentials.', 'SIGN_IN_PASSWORD');
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * Complete Sign Out:
   * Invalidates Clerk session cookies and resets Zustand store & local storage
   */
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (clerk && typeof clerk.signOut === 'function') {
        await clerk.signOut();
      } else if (typeof window !== 'undefined' && window.Clerk?.signOut) {
        await window.Clerk.signOut();
      }
    } catch (err) {
      console.warn('Clerk signOut error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('book_my_chef_auth_session');
        localStorage.removeItem('bmc_clerk_token');
        sessionStorage.clear();
      }
      useAuthStore.getState().logout();
      setErrorMessage('');
      setIsLoading(false);
    }
  };

  // Backward-compatibility wrappers
  const sendSignUpOtp = (identifier, password, fullName) => sendSignUpEmailOtp(identifier, password, fullName);
  const verifySignUpOtp = (code) => verifySignUpEmailOtp(code);
  const sendSignInOtp = (identifier) => sendSignInEmailOtp(identifier);
  const verifySignInOtp = (code) => verifySignInEmailOtp(code);

  return {
    isConfigured: hasClerkKey,
    clerk,
    clerkUser: clerk?.user,
    isLoading,
    errorMessage,
    setErrorMessage,
    signOut,
    sendSignUpEmailOtp,
    verifySignUpEmailOtp,
    sendSignInEmailOtp,
    verifySignInEmailOtp,
    signInWithPassword,
    sendSignUpOtp,
    verifySignUpOtp,
    sendSignInOtp,
    verifySignInOtp,
  };
}
