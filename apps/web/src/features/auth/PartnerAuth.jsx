import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useProviderStore } from '../../stores/useProviderStore';
import { useClerkOtp } from '../../hooks/useClerkOtp';
import OtpInput6 from '../../components/auth/OtpInput6';
import { syncUserWithPostgres } from '../../lib/clerkAuthService';

export default function PartnerAuth() {
  const navigate = useNavigate();
  const { loginPartner, registerPartner } = useAuthStore();
  const { updateOnboarding } = useProviderStore();
  const {
    isConfigured,
    isLoading: isClerkLoading,
    errorMessage,
    setErrorMessage,
    sendSignUpEmailOtp,
    verifySignUpEmailOtp,
    sendSignInEmailOtp,
    verifySignInEmailOtp,
    signInWithPassword,
  } = useClerkOtp();

  const [mode, setMode] = useState('REGISTER'); // 'REGISTER' | 'LOGIN'
  const [loginMethod, setLoginMethod] = useState('OTP'); // 'OTP' | 'PASSWORD'
  const [step, setStep] = useState('ROLE_FIRST'); // 'ROLE_FIRST' | 'DETAILS' | 'OTP'
  const [localLoading, setLocalLoading] = useState(false);

  // Form Fields (Clean initial state - zero fake prefilled data)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 12 Authoritative Roles
  const [selectedRoles, setSelectedRoles] = useState([]);

  const ALL_PARTNER_ROLES = [
    { id: 'HOME_CHEF', label: 'Home Chef', icon: 'soup_kitchen', desc: 'Regional, traditional family recipes' },
    { id: 'PRO_CHEF', label: 'Professional Chef', icon: 'restaurant', desc: 'Hotel & fine-dining banquet leadership' },
    { id: 'PERSONAL_CHEF', label: 'Personal Chef', icon: 'person', desc: 'Exclusive villa, farm or private dining' },
    { id: 'CATERER', label: 'Caterer', icon: 'room_service', desc: 'Grand feasts & live counters (50-500+ guests)' },
    { id: 'EVENT_PLANNER', label: 'Event Planner', icon: 'event_note', desc: 'End-to-end theme curation & schedule' },
    { id: 'EVENT_MANAGER', label: 'Event Manager', icon: 'supervisor_account', desc: 'On-ground operational logistics & execution' },
    { id: 'DECORATOR', label: 'Decorator', icon: 'filter_vintage', desc: 'Mandap, floral styling & mood lighting' },
    { id: 'PHOTOGRAPHER', label: 'Photographer', icon: 'photo_camera', desc: 'High-res event & candid guest memories' },
    { id: 'VIDEOGRAPHER', label: 'Videographer', icon: 'videocam', desc: 'Cinematic 4K reels & ceremony highlights' },
    { id: 'BARTENDER', label: 'Bartender', icon: 'local_bar', desc: 'Curated mixology & cocktail artistry' },
    { id: 'SERVER', label: 'Server', icon: 'room_service', desc: 'Uniformed hospitality table & banquet staff' },
    { id: 'KITCHEN_ASSISTANT', label: 'Kitchen Assistant', icon: 'skillet', desc: 'Prep work, live counter & cleanup support' },
  ];

  const toggleRole = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const isLoading = isClerkLoading || localLoading;

  // Step 1: Submit Form (Registration Email OTP, Login Email OTP, or Login Password)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'REGISTER') {
      if (!password || password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }
      if (selectedRoles.length === 0) {
        setErrorMessage('Please select at least one role.');
        return;
      }
    }

    if (!isConfigured) {
      setErrorMessage('Authentication service is not configured. Please verify Clerk Publishable Key in environment.');
      return;
    }

    if (mode === 'REGISTER') {
      // Send Email OTP for Partner Registration
      const res = await sendSignUpEmailOtp(normalizedEmail, password);
      if (res.success) {
        setStep('OTP');
      }
    } else {
      // LOGIN MODE
      if (loginMethod === 'PASSWORD') {
        if (!password) {
          setErrorMessage('Please enter your password.');
          return;
        }
        const res = await signInWithPassword(normalizedEmail, password);
        if (res.success) {
          await finalizePartnerLogin(res, normalizedEmail);
        }
      } else {
        // LOGIN VIA EMAIL OTP
        const res = await sendSignInEmailOtp(normalizedEmail);
        if (res.success) {
          setStep('OTP');
        }
      }
    }
  };

  // Step 2: Verify Real Clerk Email OTP Code & Synchronize with PostgreSQL
  const handleVerifyOtp = async (code) => {
    setErrorMessage('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!isConfigured) {
      setErrorMessage('Clerk authentication is not configured.');
      return;
    }

    const res = mode === 'REGISTER'
      ? await verifySignUpEmailOtp(code)
      : await verifySignInEmailOtp(code);

    if (!res.success) return;

    await finalizePartnerLogin(res, normalizedEmail);
  };

  const finalizePartnerLogin = async (res, normalizedEmail) => {
    setLocalLoading(true);

    try {
      const syncResult = await syncUserWithPostgres({
        clerkId: res.clerkUserId,
        email: normalizedEmail,
        fullName: fullName || undefined,
        intendedRole: 'PROVIDER',
        businessName: businessName || undefined,
        roles: selectedRoles.length > 0 ? selectedRoles : ['PRO_CHEF'],
      });

      if (mode === 'REGISTER') {
        registerPartner({
          id: syncResult?.userId,
          fullName,
          email: normalizedEmail,
          businessName,
          location,
          roles: selectedRoles,
          clerkId: res.clerkUserId,
          sessionToken: res.sessionId,
        });

        updateOnboarding({
          roles: selectedRoles,
          basicInfo: {
            fullName,
            brandName: businessName,
            email: normalizedEmail,
            serviceLocations: [location],
          },
        });
      } else {
        loginPartner({
          id: syncResult?.userId,
          identifier: normalizedEmail,
          email: normalizedEmail,
          name: syncResult?.fullName || 'Service Partner',
          clerkId: res.clerkUserId,
          sessionToken: res.sessionId,
        });
      }

      setLocalLoading(false);
      navigate('/provider/dashboard', { replace: true });
    } catch (err) {
      console.error('Provider sync failed:', err);
      setLocalLoading(false);
      navigate('/provider/dashboard', { replace: true });
    }
  };

  const handleResendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (isConfigured) {
      if (mode === 'REGISTER') {
        await sendSignUpEmailOtp(normalizedEmail, password);
      } else {
        await sendSignInEmailOtp(normalizedEmail);
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
              <span className="material-symbols-outlined text-[#90CAF9] text-[24px]">soup_kitchen</span>
            </div>
            <div>
              <span className="font-sora font-extrabold text-xl tracking-tight text-white block">
                BOOK MY CHEF
              </span>
              <span className="font-inter text-[11px] text-[#90CAF9] uppercase tracking-widest font-semibold block">
                Partner Studio &amp; Atelier
              </span>
            </div>
          </div>

          <div className="mt-16">
            <span className="inline-block px-3 py-1 bg-white/15 border border-white/30 text-[#E3F2FD] text-xs font-semibold rounded-md uppercase tracking-wider mb-4">
              Service Partner Ecosystem
            </span>
            <h2 className="heading-1 text-white leading-tight">
              Direct booking leads, calendar slot locks, and zero-delay escrow payouts.
            </h2>
            <p className="font-inter text-sm text-[#E3F2FD] mt-4 leading-relaxed max-w-md">
              Whether you are an independent masterchef, a boutique catering kitchen, or a full event styling atelier, manage all your bookings with 100% pricing autonomy.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-8">
          <div className="card-on-navy rounded-lg p-5">
            <h4 className="font-sora font-bold text-sm text-white">Multi-Role Enablement</h4>
            <p className="font-inter text-xs text-[#E3F2FD] mt-1 leading-relaxed">
              Operate as a Chef, Caterer, and Event Manager concurrently under one unified atelier profile.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-[#E3F2FD] border-t border-white/20 pt-4 font-inter">
            <span>Razorpay Route Escrow Settlements</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-[#90CAF9]">verified</span>
              FSSAI Verified Network
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Form Container (Desktop & Mobile) */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-2xl mx-auto w-full">
        <div>
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <button
              onClick={() => {
                if (step === 'OTP') setStep('DETAILS');
                else if (step === 'DETAILS') setStep('ROLE_FIRST');
                else navigate('/auth/welcome');
              }}
              className="btn-ghost"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{step === 'OTP' ? 'Change Email' : (step === 'DETAILS' ? 'Change Roles' : 'Back')}</span>
            </button>
            <div className="badge-sharp bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1]">
              <span className="material-symbols-outlined text-[14px] text-[#0D47A1]">storefront</span>
              <span>Partner Studio</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-6 mb-5">
            <h1 className="heading-2">
              {step === 'ROLE_FIRST' && mode === 'REGISTER'
                ? 'Select Your Service Categories'
                : step === 'OTP'
                ? 'Verify Partner Email Address'
                : mode === 'REGISTER'
                ? 'Partner Profile Details'
                : 'Partner Studio Sign In'}
            </h1>
            <p className="body-sm mt-1.5">
              {step === 'ROLE_FIRST' && mode === 'REGISTER'
                ? 'Select your primary role and any additional services you provide. You can configure individual pricing for each.'
                : step === 'OTP'
                ? `Enter the 6-digit email verification code sent to ${email}`
                : mode === 'REGISTER'
                ? 'Provide your professional contact details for customer quotation requests and escrow payouts.'
                : 'Sign in to access your dashboard, incoming bookings, and culinary catalog.'}
            </p>
          </div>

          {/* Tabs: Sign Up / Sign In */}
          {(step === 'ROLE_FIRST' || step === 'DETAILS') && (
            <div className="flex bg-[#F8FAFC] p-1 mb-4 border border-[#E5E7EB] rounded-md">
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setStep('ROLE_FIRST');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 font-sora text-xs font-bold rounded transition-all ${
                  mode === 'REGISTER'
                    ? 'bg-white text-[#0D47A1] shadow-xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                New Partner Registration
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setStep('DETAILS');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 font-sora text-xs font-bold rounded transition-all ${
                  mode === 'LOGIN'
                    ? 'bg-white text-[#0D47A1] shadow-xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Existing Partner Sign In
              </button>
            </div>
          )}

          {/* Secondary Sub-Tabs for LOGIN Mode: Email OTP vs Password */}
          {step === 'DETAILS' && mode === 'LOGIN' && (
            <div className="flex items-center gap-2 mb-6 p-1 bg-[#F1F5F9] rounded-md text-xs font-inter">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('OTP');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 px-3 rounded font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  loginMethod === 'OTP'
                    ? 'bg-white text-[#0D47A1] shadow-2xs font-semibold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                <span>Sign in with Email OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('PASSWORD');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 px-3 rounded font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  loginMethod === 'PASSWORD'
                    ? 'bg-white text-[#0D47A1] shadow-2xs font-semibold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">key</span>
                <span>Sign in with Password</span>
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && step !== 'OTP' && (
            <div className="mb-4 p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 font-inter text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-[18px] text-red-500 flex-shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STAGE A: Role Selection First (Mandatory Multi-Role Feature) */}
          {mode === 'REGISTER' && step === 'ROLE_FIRST' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3.5 bg-[#E3F2FD] border border-[#90CAF9] rounded-md">
                <span className="font-sora text-xs font-bold text-[#0D47A1]">
                  {selectedRoles.length} Service Role{selectedRoles.length === 1 ? '' : 's'} Selected
                </span>
                <span className="font-inter text-[11px] text-[#2196F3] font-semibold">
                  Multi-Category Enabled
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {ALL_PARTNER_ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={`p-3.5 border rounded-md text-left transition-all flex items-start gap-3 active:scale-[0.99] ${
                        isSelected
                          ? 'bg-[#E3F2FD]/60 border-[#2196F3] shadow-xs ring-1 ring-[#2196F3]'
                          : 'bg-white border-[#E5E7EB] hover:border-[#90CAF9]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-[#0D47A1] text-white' : 'bg-[#F8FAFC] text-[#64748B]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{role.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-sora font-bold text-xs text-[#172033]">{role.label}</span>
                          <span
                            className={`w-4 h-4 rounded-sm flex items-center justify-center text-[11px] ${
                              isSelected ? 'bg-[#2196F3] text-white font-bold' : 'border border-[#CBD5E1]'
                            }`}
                          >
                            {isSelected && '✓'}
                          </span>
                        </div>
                        <p className="font-inter text-[11px] text-[#64748B] mt-0.5 line-clamp-1">{role.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (selectedRoles.length === 0) {
                    setErrorMessage('Please select at least one primary role to proceed.');
                    return;
                  }
                  setErrorMessage('');
                  setStep('DETAILS');
                }}
                className="btn-primary w-full py-3.5 mt-2"
              >
                <span>Continue to Profile Details ({selectedRoles.length} Selected)</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          )}

          {/* STAGE B: Professional Details & Email */}
          {step === 'DETAILS' && (
            <form onSubmit={handleSubmitForm} className="flex flex-col gap-4 text-xs font-inter">
              {mode === 'REGISTER' && (
                <>
                  <div>
                    <label htmlFor="partner-name" className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                      Professional Name *
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px] pointer-events-none">
                        person
                      </span>
                      <input
                        id="partner-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Chef Raghavendra Rao"
                        className="input-sharp w-full pl-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="partner-brand" className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                      Culinary Brand / Studio Name (Optional)
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px] pointer-events-none">
                        storefront
                      </span>
                      <input
                        id="partner-brand"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Royal Dakshin Culinary Studio"
                        className="input-sharp w-full pl-11"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="partner-email" className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                  Email Address *
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px] pointer-events-none">
                    mail
                  </span>
                  <input
                    id="partner-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="chef@atelier.in"
                    className="input-sharp w-full pl-11"
                  />
                </div>
                {mode === 'REGISTER' && (
                  <span className="text-[11px] text-[#64748B] mt-1.5 block">
                    A 6-digit verification code will be sent to this email address.
                  </span>
                )}
              </div>

              {/* Password Field (Required on REGISTER and on LOGIN with Password) */}
              {(mode === 'REGISTER' || (mode === 'LOGIN' && loginMethod === 'PASSWORD')) && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="partner-password" className="block text-[#172033] font-sora font-bold uppercase text-[10px]">
                      {mode === 'REGISTER' ? 'Create Password *' : 'Password *'}
                    </label>
                    {mode === 'REGISTER' && (
                      <span className="text-[10px] text-[#64748B]">Min 8 characters</span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px] pointer-events-none">
                      lock
                    </span>
                    <input
                      id="partner-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'REGISTER' ? 'At least 8 characters' : 'Enter your password'}
                      className="input-sharp w-full pl-11 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-[#64748B] hover:text-[#172033] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {mode === 'REGISTER' && (
                <div>
                  <label htmlFor="partner-location" className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                    Operating Base City *
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px] pointer-events-none">
                      location_on
                    </span>
                    <input
                      id="partner-location"
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Jubilee Hills, Hyderabad"
                      className="input-sharp w-full pl-11"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>
                      {mode === 'REGISTER'
                        ? 'Sending Email OTP...'
                        : loginMethod === 'PASSWORD'
                        ? 'Signing In...'
                        : 'Sending Email OTP...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'REGISTER'
                        ? 'Send Email Verification Code'
                        : loginMethod === 'PASSWORD'
                        ? 'Sign In with Password'
                        : 'Send Email Verification Code'}
                    </span>
                    <span className="material-symbols-outlined text-[18px]">
                      {loginMethod === 'PASSWORD' && mode === 'LOGIN' ? 'arrow_forward' : 'mail'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STAGE C: 6-Box Individual Digit Email OTP Verification */}
          {step === 'OTP' && (
            <OtpInput6
              email={email.trim().toLowerCase()}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onChangeNumber={() => setStep('DETAILS')}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
          )}
        </div>

        {/* Switch to Customer CTA */}
        <div className="pt-6 border-t border-[#E5E7EB] text-center text-xs font-inter text-[#64748B]">
          <span>Looking to book a chef or catering for your event? </span>
          <button
            onClick={() => navigate('/auth/customer')}
            className="font-sora font-bold text-[#0D47A1] hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            Customer Sign In →
          </button>
        </div>
      </div>
    </div>
  );
}
