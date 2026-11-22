import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useClerkOtp } from '../../hooks/useClerkOtp';
import OtpInput6 from '../../components/auth/OtpInput6';
import { formatToE164, isValidIndianMobile, syncUserWithPostgres } from '../../lib/clerkAuthService';

export default function CustomerAuth() {
  const navigate = useNavigate();
  const { loginCustomer, registerCustomer } = useAuthStore();
  const {
    isConfigured,
    isLoading: isClerkLoading,
    errorMessage,
    setErrorMessage,
    sendSignUpOtp,
    verifySignUpOtp,
    sendSignInOtp,
    verifySignInOtp,
  } = useClerkOtp();

  const [mode, setMode] = useState('REGISTER'); // 'REGISTER' | 'LOGIN'
  const [step, setStep] = useState('PHONE_ENTRY'); // 'PHONE_ENTRY' | 'OTP_VERIFY'
  const [localLoading, setLocalLoading] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('Ananya Rao');
  const [mobileNumber, setMobileNumber] = useState('+919876543210');
  const [email, setEmail] = useState('ananya.rao@example.com');
  const [location, setLocation] = useState('Jubilee Hills, Hyderabad');

  const isLoading = isClerkLoading || localLoading;

  // Step 1: Send Real Clerk SMS OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const formattedPhone = formatToE164(mobileNumber);
    if (!isValidIndianMobile(formattedPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (+91 followed by 6, 7, 8, or 9).');
      return;
    }

    if (isConfigured) {
      // Dispatches actual SMS OTP via Clerk
      const res = mode === 'REGISTER'
        ? await sendSignUpOtp(formattedPhone)
        : await sendSignInOtp(formattedPhone);

      if (res.success) {
        setStep('OTP_VERIFY');
      }
    } else {
      // Fallback if Clerk publishable key is not yet configured in environment
      setLocalLoading(true);
      setTimeout(() => {
        setLocalLoading(false);
        setStep('OTP_VERIFY');
      }, 700);
    }
  };

  // Step 2: Verify Real Clerk SMS OTP Code & Synchronize with PostgreSQL
  const handleVerifyOtp = async (code) => {
    setErrorMessage('');
    const formattedPhone = formatToE164(mobileNumber);

    if (isConfigured) {
      // Verify with Clerk backend
      const res = mode === 'REGISTER'
        ? await verifySignUpOtp(code)
        : await verifySignInOtp(code);

      if (!res.success) return;

      setLocalLoading(true);

      // Synchronize verified Clerk identity with internal PostgreSQL database
      const syncResult = await syncUserWithPostgres({
        clerkId: res.clerkUserId,
        phone: formattedPhone,
        email,
        fullName: mode === 'REGISTER' ? fullName : undefined,
        intendedRole: 'CUSTOMER',
      });

      // Update local state and session
      if (mode === 'REGISTER') {
        registerCustomer({
          fullName,
          mobileNumber: formattedPhone,
          email,
          location,
        });
      } else {
        loginCustomer({
          identifier: formattedPhone,
          otp: code,
        });
      }

      setLocalLoading(false);
      // Automatic Redirect to Customer Home
      navigate('/customer/home', { replace: true });
    } else {
      // Offline/Local dev fallback
      setLocalLoading(true);
      setTimeout(() => {
        if (mode === 'REGISTER') {
          registerCustomer({
            fullName,
            mobileNumber: formattedPhone,
            email,
            location,
          });
        } else {
          loginCustomer({
            identifier: formattedPhone,
            otp: code,
          });
        }
        setLocalLoading(false);
        navigate('/customer/home', { replace: true });
      }, 600);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    const formattedPhone = formatToE164(mobileNumber);
    if (isConfigured) {
      if (mode === 'REGISTER') {
        await sendSignUpOtp(formattedPhone);
      } else {
        await sendSignInOtp(formattedPhone);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between max-w-lg mx-auto p-6 font-sora shadow-xl">
      <div>
        {/* Top Header & Back Button */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <button
            onClick={() =>
              step === 'OTP_VERIFY' ? setStep('PHONE_ENTRY') : navigate('/auth/welcome')
            }
            className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033]"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{step === 'OTP_VERIFY' ? 'Change Mobile Number' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-1.5 bg-[#E3F2FD] border border-[#90CAF9] px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-[14px] text-[#2196F3]">person</span>
            <span className="text-[11px] font-bold text-[#0D47A1]">Customer Account</span>
          </div>
        </div>

        {/* Brand & Heading */}
        <div className="mt-6 mb-6">
          <h1 className="font-extrabold text-2xl text-[#172033] tracking-tight">
            {step === 'OTP_VERIFY'
              ? 'Enter Verification Code'
              : mode === 'REGISTER'
              ? 'Customer Registration'
              : 'Customer Mobile Sign In'}
          </h1>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
            {step === 'OTP_VERIFY'
              ? 'Verify your mobile number via Clerk SMS OTP to secure your gourmet account.'
              : mode === 'REGISTER'
              ? 'Sign up with your mobile number to discover chefs, book catering, and track events.'
              : 'Enter your registered mobile number to receive a secure SMS verification code.'}
          </p>
        </div>

        {/* Tab Switcher: Register / Sign In */}
        {step === 'PHONE_ENTRY' && (
          <div className="flex rounded-xl bg-[#f1f3ff] p-1 mb-6 border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'REGISTER'
                  ? 'bg-white text-[#0D47A1] shadow-sm'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Customer Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'LOGIN'
                  ? 'bg-white text-[#0D47A1] shadow-sm'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Sign In via SMS
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && step === 'PHONE_ENTRY' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px] text-red-500 flex-shrink-0">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Phone Entry & Details */}
        {step === 'PHONE_ENTRY' ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4 text-xs">
            {mode === 'REGISTER' && (
              <div>
                <label className="block text-[#172033] font-bold uppercase text-[10px] mb-1.5">
                  Full Name *
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ananya Rao"
                    className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] text-[#172033] font-semibold text-sm outline-none focus:ring-2 focus:ring-[#90CAF9] focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[#172033] font-bold uppercase text-[10px] mb-1.5">
                Indian Mobile Number *
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1.5 border-r border-[#CBD5E1] pr-2">
                  <span className="text-sm">🇮🇳</span>
                  <span className="font-bold text-xs text-[#0D47A1]">+91</span>
                </div>
                <input
                  type="tel"
                  required
                  value={mobileNumber.replace(/^\+91/, '')}
                  onChange={(e) => setMobileNumber(`+91${e.target.value.replace(/[^0-9]/g, '').slice(0, 10)}`)}
                  placeholder="98765 43210"
                  className="w-full h-12 pl-20 pr-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] text-[#172033] font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-[#90CAF9] focus:bg-white tracking-wider"
                />
              </div>
              <span className="text-[10px] text-[#64748B] mt-1 block">
                Real SMS verification code will be dispatched to this number.
              </span>
            </div>

            {mode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-[#172033] font-bold uppercase text-[10px] mb-1.5">
                    Email Address (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px]">
                      mail
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ananya.rao@example.com"
                      className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] text-[#172033] font-semibold text-sm outline-none focus:ring-2 focus:ring-[#90CAF9] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#172033] font-bold uppercase text-[10px] mb-1.5">
                    Host City / Location *
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px]">
                      location_on
                    </span>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Jubilee Hills, Hyderabad"
                      className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] text-[#172033] font-semibold text-sm outline-none focus:ring-2 focus:ring-[#90CAF9] focus:bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full py-4 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#0D47A1]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Requesting Real SMS OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Real SMS OTP Code</span>
                  <span className="material-symbols-outlined text-[18px]">sms</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: 6-Box Individual Digit OTP Verification */
          <OtpInput6
            phoneNumber={formatToE164(mobileNumber)}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onChangeNumber={() => setStep('PHONE_ENTRY')}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        )}
      </div>

      {/* Switch to Service Partner CTA */}
      <div className="pt-6 border-t border-[#E5E7EB] text-center text-xs text-[#64748B]">
        <span>Are you a culinary or event professional? </span>
        <button
          onClick={() => navigate('/auth/partner')}
          className="font-bold text-[#0D47A1] hover:underline"
        >
          Join as Service Partner →
        </button>
      </div>
    </div>
  );
}
