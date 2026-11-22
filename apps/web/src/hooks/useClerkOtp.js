import { useState, useTransition } from 'react';
import { useSignUp, useSignIn, useClerk } from '@clerk/react';
import { getClerkPublishableKey } from '../components/auth/ClerkAuthProvider';

/**
 * Custom Hook: useClerkOtp
 * Production-ready Clerk custom flows for:
 * 1. Email OTP (Verification code sent to email inbox)
 * 2. Password Sign-In (Instant password-based login)
 * 3. Dual factor resolution
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
    const rawMsg =
      err?.errors?.[0]?.longMessage ||
      err?.errors?.[0]?.message ||
      err?.message ||
      '';
    const code = err?.errors?.[0]?.code || '';

    // Error 1: Email already in use
    if (code === 'form_identifier_exists' || rawMsg.includes('already exists') || rawMsg.includes('taken')) {
      return 'An account with this email address already exists. Please switch to "Sign In" to continue.';
    }

    // Error 2: Identifier invalid / Account not found on sign-in
    if (
      code === 'form_identifier_not_found' ||
      code === 'identifier_invalid' ||
      rawMsg.includes('Identifier is invalid') ||
      rawMsg.includes('Couldn\'t find your account')
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
      return 'Incorrect password. Please try again or switch to "Sign In via Email OTP".';
    }

    // Error 6: Password too weak
    if (code === 'form_password_pwned' || code === 'form_password_length_too_short' || rawMsg.includes('password')) {
      return rawMsg || 'Password must be at least 8 characters long.';
    }

    // Error 7: Rate limit
    if (code === 'too_many_requests' || rawMsg.includes('Too many requests')) {
      return 'Too many attempts. Please wait 60 seconds before trying again.';
    }

    return rawMsg || defaultMsg;
  };

  /**
   * 1. Send Email Verification Code for Sign-Up
   */
  const sendSignUpEmailOtp = async (email, password = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signUpHook?.signUp) {
        throw new Error(
          'Authentication service is not configured. Please verify Clerk Publishable Key in environment.'
        );
      }

      const { signUp } = signUpHook;

      // Prepare payload with emailAddress and optional password
      const payload = {
        emailAddress: email.trim().toLowerCase(),
      };
      if (password && password.trim().length >= 8) {
        payload.password = password.trim();
      }

      await signUp.create(payload);

      // Trigger Clerk Email Verification Code
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

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
   */
  const verifySignUpEmailOtp = async (code) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signUpHook?.signUp) {
        throw new Error('Clerk authentication is not initialized.');
      }

      const { signUp, setActive } = signUpHook;

      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setIsLoading(false);
        return {
          success: true,
          clerkUserId: result.createdUserId || clerk?.user?.id,
          sessionId: result.createdSessionId,
        };
      } else {
        throw new Error(`Sign-up incomplete (status: ${result.status})`);
      }
    } catch (err) {
      const msg = formatClerkError(err, 'Invalid or expired verification code. Please check your email and try again.', 'VERIFY_SIGN_UP');
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * 3. Send Email OTP Code for Sign-In
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

      // Initiate sign-in with email identifier
      const signInAttempt = await signIn.create({
        identifier: normalizedEmail,
      });

      // Find the email_code first factor
      const emailFactor = signInAttempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );

      if (!emailFactor) {
        throw new Error(
          'Email code verification factor is not available for this account. Ensure email code is enabled in Clerk Dashboard.'
        );
      }

      // Dispatch genuine Clerk Email OTP
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      const msg = formatClerkError(err, 'Could not initiate email sign-in. Ensure this email address is already registered.', 'SIGN_IN');
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * 4. Verify Email OTP Code for Sign-In
   */
  const verifySignInEmailOtp = async (code) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signInHook?.signIn) {
        throw new Error('Clerk authentication is not initialized.');
      }

      const { signIn, setActive } = signInHook;

      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: code.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
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

      const result = await signIn.create({
        identifier: normalizedEmail,
        password: password.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
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
      const msg = formatClerkError(err, 'Sign-in failed. Please check your credentials.', 'SIGN_IN_PASSWORD');
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  // Backward-compatibility wrappers
  const sendSignUpOtp = (identifier, password) => sendSignUpEmailOtp(identifier, password);
  const verifySignUpOtp = (code) => verifySignUpEmailOtp(code);
  const sendSignInOtp = (identifier) => sendSignInEmailOtp(identifier);
  const verifySignInOtp = (code) => verifySignInEmailOtp(code);

  return {
    isConfigured: hasClerkKey,
    isLoading,
    errorMessage,
    setErrorMessage,
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
