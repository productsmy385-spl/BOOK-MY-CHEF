import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useClerkOtp } from '../../hooks/useClerkOtp';
import OtpInput6 from '../../components/auth/OtpInput6';
import PhoneInput from '../../components/common/PhoneInput';
import { formatToE164, isValidIndianMobile, syncUserWithPostgres } from '../../lib/clerkAuthService';
import { ASSETS } from '../../assets/assetCatalog';

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

  // Form Fields (Clean initial state - zero fake prefilled data)
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isLoading = isClerkLoading || localLoading;

  // Step 1: Send Real Clerk SMS OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'REGISTER' && !termsAccepted) {
      setErrorMessage('Please accept the Terms of Service and Privacy Policy to register.');
      return;
    }

    const formattedPhone = formatToE164(mobileNumber);
    if (!isValidIndianMobile(formattedPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (+91 followed by 6, 7, 8, or 9).');
      return;
    }

    if (isConfigured) {
      const res = mode === 'REGISTER'
        ? await sendSignUpOtp(formattedPhone)
        : await sendSignInOtp(formattedPhone);

      if (res.success) {
        setStep('OTP_VERIFY');
      }
    } else {
      setErrorMessage('Clerk authentication is not configured in this environment. Please check VITE_CLERK_PUBLISHABLE_KEY.');
    }
  };

  // Step 2: Verify Real Clerk SMS OTP Code & Synchronize with PostgreSQL
  const handleVerifyOtp = async (code) => {
    setErrorMessage('');
    const formattedPhone = formatToE164(mobileNumber);

    if (!isConfigured) {
      setErrorMessage('Clerk authentication is not configured.');
      return;
    }

    // Verify with Clerk backend
    const res = mode === 'REGISTER'
      ? await verifySignUpOtp(code)
      : await verifySignInOtp(code);

    if (!res.success) return;

    setLocalLoading(true);

    try {
      // Synchronize verified Clerk identity with internal PostgreSQL database
      const syncResult = await syncUserWithPostgres({
        clerkId: res.clerkUserId,
        phone: formattedPhone,
        email: email || undefined,
        fullName: mode === 'REGISTER' ? fullName : undefined,
        intendedRole: 'CUSTOMER',
      });

      // Update local state and session with genuine verified identity
      if (mode === 'REGISTER') {
        registerCustomer({
          id: syncResult?.userId,
          fullName,
          mobileNumber: formattedPhone,
          email,
          location,
          clerkId: res.clerkUserId,
          sessionToken: res.sessionId,
        });
      } else {
        loginCustomer({
          id: syncResult?.userId,
          identifier: formattedPhone,
          phone: formattedPhone,
          email,
          name: syncResult?.fullName || 'Customer',
          clerkId: res.clerkUserId,
          sessionToken: res.sessionId,
        });
      }

      setLocalLoading(false);
      navigate('/customer/home', { replace: true });
    } catch (err) {
      console.error('PostgreSQL sync failed:', err);
      setLocalLoading(false);
      navigate('/customer/home', { replace: true });
    }
  };

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
    <div className="min-h-screen bg-white flex flex-col lg:grid lg:grid-cols-12 font-sora">
      {/* Desktop Left Brand & Editorial Section (Sharp Geometry + WCAG AAA High Contrast) */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#0D47A1] text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-md flex items-center justify-center">
              <span className="material-symbols-outlined text-[#90CAF9] text-[24px]">restaurant_menu</span>
            </div>
            <div>
              <span className="font-sora font-extrabold text-xl tracking-tight text-white block">
                BOOK MY CHEF
              </span>
              <span className="font-inter text-[11px] text-[#90CAF9] uppercase tracking-widest font-semibold block">
                Culinary &amp; Event Atelier
              </span>
            </div>
          </div>

          <div className="mt-16">
            <span className="inline-block px-3 py-1 bg-white/15 border border-white/30 text-[#E3F2FD] text-xs font-semibold rounded-md uppercase tracking-wider mb-4">
              Premium Host Experience
            </span>
            <h2 className="heading-1 text-white leading-tight">
              Discover verified masterchefs, caterers &amp; event artisans for your private celebrations.
            </h2>
            <p className="font-inter text-sm text-[#E3F2FD] mt-4 leading-relaxed max-w-md">
              From traditional home-style banana leaf banquets to luxury five-course plated dinners, book top-tier culinary artists with escrow-protected payments.
            </p>
          </div>
        </div>

        {/* High-Contrast Information Card & Trust Signals */}
        <div className="relative z-10 mt-8">
          <div className="card-on-navy rounded-lg p-5">
            <div className="flex items-center gap-3.5">
              <img
                src={ASSETS.chefRaghavendraStudio}
                alt="Chef Raghavendra"
                className="w-12 h-12 rounded-md object-cover border-2 border-white/50 shrink-0"
              />
              <div>
                <h4 className="font-sora font-bold text-sm text-white">100% Background-Verified</h4>
                <p className="font-inter text-xs text-[#E3F2FD] mt-0.5 leading-snug">
                  FSSAI certified cooks, strict kitchen hygiene pledge &amp; verified background checks.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-[#E3F2FD] border-t border-white/20 pt-4 font-inter">
            <span>© 2026 BOOK MY CHEF Technologies</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-[#90CAF9]">lock</span>
              Bank-Grade 256-Bit SSL
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Form Container (Desktop & Mobile) */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-16 max-w-xl mx-auto w-full">
        <div>
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <button
              onClick={() => step === 'OTP_VERIFY' ? setStep('PHONE_ENTRY') : navigate('/auth/welcome')}
              className="btn-ghost"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{step === 'OTP_VERIFY' ? 'Change Number' : 'Back'}</span>
            </button>
            <div className="badge-sharp bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1]">
              <span className="material-symbols-outlined text-[14px] text-[#2196F3]">person</span>
              <span>Customer Account</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-8 mb-6">
            <h1 className="heading-2">
              {step === 'OTP_VERIFY'
                ? 'Enter Verification Code'
                : mode === 'REGISTER'
                ? 'Create Customer Account'
                : 'Customer Sign In'}
            </h1>
            <p className="body-sm mt-1.5">
              {step === 'OTP_VERIFY'
                ? `Enter the 6-digit SMS verification code dispatched to ${mobileNumber}`
                : mode === 'REGISTER'
                ? 'Register with your verified mobile number to discover chefs, book catering, and track events.'
                : 'Enter your registered mobile number to receive a secure SMS OTP.'}
            </p>
          </div>

          {/* Tabs: Sign Up / Sign In (Sharp Geometry) */}
          {step === 'PHONE_ENTRY' && (
            <div className="flex bg-[#F8FAFC] p-1 mb-6 border border-[#E5E7EB] rounded-md">
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 font-sora text-xs font-bold rounded transition-all ${
                  mode === 'REGISTER'
                    ? 'bg-white text-[#0D47A1] shadow-xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Host Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 font-sora text-xs font-bold rounded transition-all ${
                  mode === 'LOGIN'
                    ? 'bg-white text-[#0D47A1] shadow-xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Sign In via SMS
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && step === 'PHONE_ENTRY' && (
            <div className="mb-4 p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 font-inter text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-500 flex-shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Phone Entry & Details */}
          {step === 'PHONE_ENTRY' ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4 text-xs font-inter">
              {mode === 'REGISTER' && (
                <div>
                  <label htmlFor="customer-name" className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px] pointer-events-none">
                      badge
                    </span>
                    <input
                      id="customer-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="input-sharp w-full pl-11"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="customer-phone" className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                  Indian Mobile Number *
                </label>
                {/* Architectural Standard: PhoneInput (pure flexbox, zero overlap) */}
                <PhoneInput
                  id="customer-phone"
                  required
                  value={mobileNumber}
                  onChange={setMobileNumber}
                  placeholder="Enter 10-digit mobile number"
                />
                <span className="text-[11px] text-[#64748B] mt-1.5 block">
                  A genuine SMS OTP code will be sent to this number.
                </span>
              </div>

              {mode === 'REGISTER' && (
                <>
                  <div>
                    <label htmlFor="customer-email" className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                      Email Address (Optional)
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px] pointer-events-none">
                        mail
                      </span>
                      <input
                        id="customer-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com (optional)"
                        className="input-sharp w-full pl-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="customer-location" className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                      Host City / Location *
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px] pointer-events-none">
                        location_on
                      </span>
                      <input
                        id="customer-location"
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Jubilee Hills, Hyderabad"
                        className="input-sharp w-full pl-11"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-[#CBD5E1] text-[#2196F3] focus:ring-[#2196F3]"
                    />
                    <label htmlFor="terms" className="text-xs text-[#64748B] leading-tight cursor-pointer">
                      I agree to the <span className="text-[#0D47A1] font-semibold hover:underline">Terms of Service</span> and <span className="text-[#0D47A1] font-semibold hover:underline">Privacy Policy</span>.
                    </label>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending SMS OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send SMS Verification Code</span>
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
        <div className="pt-6 border-t border-[#E5E7EB] text-center text-xs font-inter text-[#64748B]">
          <span>Are you a chef, caterer, or event professional? </span>
          <button
            onClick={() => navigate('/auth/partner')}
            className="font-sora font-bold text-[#0D47A1] hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            Join as Service Partner →
          </button>
        </div>
      </div>
    </div>
  );
}
