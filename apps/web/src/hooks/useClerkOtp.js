import { useState, useTransition } from 'react';
import { useSignUp, useSignIn, useClerk } from '@clerk/react';
import { getClerkPublishableKey } from '../components/auth/ClerkAuthProvider';

/**
 * Custom Hook: useClerkOtp
 * Production-ready Clerk custom flow for Phone SMS OTP verification
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
    // Thrown if rendered outside ClerkProvider
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

    // Error 1: Phone number disabled in Clerk Dashboard
    if (
      rawMsg.includes('phone_number is not a valid parameter') ||
      rawMsg.includes('phoneNumber is not a valid parameter') ||
      rawMsg.includes('form_param_unknown') ||
      code === 'form_param_unknown'
    ) {
      return 'Phone number authentication is not enabled in your Clerk Dashboard. Go to Clerk Dashboard → User & authentication → Email, Phone, Username and enable "Phone number" and "SMS verification code".';
    }

    // Error 2: Identifier invalid / Account not found on sign-in
    if (
      rawMsg.includes('Identifier is invalid') ||
      code === 'form_identifier_not_found' ||
      code === 'identifier_invalid'
    ) {
      return 'No registered account found with this mobile number. Please switch to "Sign Up" to register your account first.';
    }

    // Error 3: SMS country restriction / allowlist
    if (rawMsg.includes('SMS country') || rawMsg.includes('country code') || code === 'sms_country_not_allowed') {
      return 'SMS OTP delivery is restricted for this country code. Ensure India (+91) is enabled in Clerk Dashboard → SMS → Settings.';
    }

    // Error 4: Invalid verification code
    if (rawMsg.includes('verification code') || code === 'form_code_incorrect') {
      return 'Incorrect verification code. Please check your SMS and enter the 6-digit code again.';
    }

    // Error 5: Code expired
    if (rawMsg.includes('expired') || code === 'verification_expired') {
      return 'This verification code has expired. Please click "Resend OTP" to receive a new code.';
    }

    // Error 6: Rate limit
    if (code === 'too_many_requests' || rawMsg.includes('Too many requests')) {
      return 'Too many verification attempts. Please wait 60 seconds before trying again.';
    }

    return rawMsg || defaultMsg;
  };

  /**
   * 1. Send SMS OTP for Sign-Up
   */
  const sendSignUpOtp = async (formattedPhone) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!hasClerkKey || !signUpHook?.signUp) {
        throw new Error(
          'Authentication service is not configured. Please verify Clerk Publishable Key in environment.'
        );
      }

      const { signUp } = signUpHook;

      // Create sign up with normalized E.164 phone number
      await signUp.create({
        phoneNumber: formattedPhone,
      });

      // Prepare phone code verification (dispatches genuine Clerk SMS OTP)
      if (signUp.verifications?.sendPhoneCode) {
        const sendRes = await signUp.verifications.sendPhoneCode({ strategy: 'phone_code' });
        if (sendRes?.error) throw sendRes.error;
      } else if (typeof signUp.preparePhoneNumberVerification === 'function') {
        await signUp.preparePhoneNumberVerification({
          strategy: 'phone_code',
        });
      }

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      const msg = formatClerkError(err, 'Failed to send SMS OTP. Please check your mobile number and try again.', 'SIGN_UP');
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
        throw new Error('Clerk authentication is not initialized.');
      }

      const { signUp, setActive } = signUpHook;
      let result;

      // Verify using available SDK method
      if (signUp.verifications?.verifyPhoneCode) {
        const verifyRes = await signUp.verifications.verifyPhoneCode({ code });
        if (verifyRes?.error) throw verifyRes.error;
        result = signUp;
      } else if (typeof signUp.attemptVerification === 'function') {
        result = await signUp.attemptVerification({
          strategy: 'phone_code',
          code,
        });
      } else if (typeof signUp.attemptPhoneNumberVerification === 'function') {
        result = await signUp.attemptPhoneNumberVerification({
          code,
        });
      } else {
        throw new Error('No supported phone verification method found on Clerk signUp resource.');
      }

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
      const msg = formatClerkError(err, 'Invalid or expired verification code. Please check SMS and try again.', 'VERIFY_SIGN_UP');
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
          'Authentication service is not configured. Please verify Clerk Publishable Key in environment.'
        );
      }

      const { signIn } = signInHook;

      // Initiate sign-in with phone number identifier
      const signInAttempt = await signIn.create({
        identifier: formattedPhone,
      });

      // Find the phone_code factor
      const phoneCodeFactor = signInAttempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'phone_code'
      );

      if (!phoneCodeFactor) {
        throw new Error(
          'SMS verification factor is not available for this account. Ensure phone sign-in is enabled in Clerk Dashboard.'
        );
      }

      // Dispatch real SMS OTP via Clerk
      await signIn.prepareFirstFactor({
        strategy: 'phone_code',
        phoneNumberId: phoneCodeFactor.phoneNumberId,
      });

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      const msg = formatClerkError(err, 'Could not initiate SMS sign-in. Ensure this mobile number is already registered.', 'SIGN_IN');
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
        throw new Error('Clerk authentication is not initialized.');
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
      const msg = formatClerkError(err, 'Invalid or expired verification code. Please check SMS and try again.', 'VERIFY_SIGN_IN');
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
