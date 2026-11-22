import { useState, useTransition } from 'react';
import { useSignUp, useSignIn, useClerk } from '@clerk/clerk-react';
import { getClerkPublishableKey } from '../components/auth/ClerkAuthProvider';

/**
 * Custom Hook: useClerkOtp
 * Implements Clerk custom flow for Phone SMS OTP verification
 */
export function useClerkOtp() {
  const hasClerkKey = Boolean(getClerkPublishableKey());

  // Safe invocation of Clerk hooks
  let signUpHook = null;
  let signInHook = null;
  let clerk = null;

  try {
    signUpHook = useSignUp();
    signInHook = useSignIn();
    clerk = useClerk();
  } catch (e) {
    // Thrown if rendered outside ClerkProvider
  }

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  /**
   * 1. Send SMS OTP for Sign-Up
   */
  const sendSignUpOtp = async (formattedPhone) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signUpHook?.signUp) {
        throw new Error(
          'Clerk publishable key not configured. Please add VITE_CLERK_PUBLISHABLE_KEY to apps/web/.env'
        );
      }

      const { signUp } = signUpHook;

      // Create sign up with phone number
      await signUp.create({
        phoneNumber: formattedPhone,
      });

      // Prepare phone code verification (Dispatches actual SMS OTP via Clerk)
      await signUp.preparePhoneNumberVerification({
        strategy: 'phone_code',
      });

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Clerk sendSignUpOtp error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Failed to send SMS OTP. Verify phone number and Clerk SMS settings.';
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * 2. Verify SMS OTP for Sign-Up
   */
  const verifySignUpOtp = async (code) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signUpHook?.signUp) {
        throw new Error('Clerk not initialized.');
      }

      const { signUp, setActive } = signUpHook;

      // Attempt phone number verification with the received SMS code
      const result = await signUp.attemptPhoneNumberVerification({
        code,
      });

      if (result.status === 'complete') {
        // Establish authenticated session with Clerk
        await setActive({ session: result.createdSessionId });
        setIsLoading(false);
        return {
          success: true,
          clerkUserId: result.createdUserId,
          sessionId: result.createdSessionId,
        };
      } else {
        throw new Error(`Sign-up incomplete (status: ${result.status})`);
      }
    } catch (err) {
      console.error('Clerk verifySignUpOtp error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid or expired verification code. Please check SMS and try again.';
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * 3. Send SMS OTP for Sign-In
   */
  const sendSignInOtp = async (formattedPhone) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signInHook?.signIn) {
        throw new Error(
          'Clerk publishable key not configured. Please add VITE_CLERK_PUBLISHABLE_KEY to apps/web/.env'
        );
      }

      const { signIn } = signInHook;

      // Initiate sign-in with phone number identifier
      const { supportedFirstFactors } = await signIn.create({
        identifier: formattedPhone,
      });

      // Find the phone_code factor
      const phoneCodeFactor = supportedFirstFactors?.find(
        (factor) => factor.strategy === 'phone_code'
      );

      if (!phoneCodeFactor) {
        throw new Error('SMS verification is not enabled for this phone number factor in Clerk.');
      }

      // Dispatch real SMS OTP via Clerk
      await signIn.prepareFirstFactor({
        strategy: 'phone_code',
        phoneNumberId: phoneCodeFactor.phoneNumberId,
      });

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Clerk sendSignInOtp error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Could not initiate SMS sign-in. Ensure this mobile number is already registered.';
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * 4. Verify SMS OTP for Sign-In
   */
  const verifySignInOtp = async (code) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signInHook?.signIn) {
        throw new Error('Clerk not initialized.');
      }

      const { signIn, setActive } = signInHook;

      const result = await signIn.attemptFirstFactor({
        strategy: 'phone_code',
        code,
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
      console.error('Clerk verifySignInOtp error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid or expired verification code. Please check SMS and try again.';
      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  return {
    isConfigured: hasClerkKey,
    isLoading,
    errorMessage,
    setErrorMessage,
    sendSignUpOtp,
    verifySignUpOtp,
    sendSignInOtp,
    verifySignInOtp,
  };
}
