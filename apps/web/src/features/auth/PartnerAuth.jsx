import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useProviderStore } from '../../stores/useProviderStore';
import { useClerkOtp } from '../../hooks/useClerkOtp';
import OtpInput6 from '../../components/auth/OtpInput6';
import { formatToE164, isValidIndianMobile, syncUserWithPostgres } from '../../lib/clerkAuthService';
import { ASSETS } from '../../assets/assetCatalog';

export default function PartnerAuth() {
  const navigate = useNavigate();
  const { loginPartner, registerPartner } = useAuthStore();
  const { updateOnboarding } = useProviderStore();
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
  const [step, setStep] = useState('ROLE_FIRST'); // 'ROLE_FIRST' | 'DETAILS' | 'OTP'
  const [localLoading, setLocalLoading] = useState(false);

  // Form Fields (Clean initial state - zero fake prefilled data)
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');

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
      const res = mode === 'REGISTER'
        ? await sendSignUpOtp(formattedPhone)
        : await sendSignInOtp(formattedPhone);

      if (res.success) {
        setStep('OTP');
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

    const res = mode === 'REGISTER'
      ? await verifySignUpOtp(code)
      : await verifySignInOtp(code);

    if (!res.success) return;

    setLocalLoading(true);

    try {
      const syncResult = await syncUserWithPostgres({
        clerkId: res.clerkUserId,
        phone: formattedPhone,
        email: email || undefined,
        fullName: fullName || undefined,
        intendedRole: 'PROVIDER',
        businessName: businessName || undefined,
        roles: selectedRoles.length > 0 ? selectedRoles : ['PRO_CHEF'],
      });

      if (mode === 'REGISTER') {
        registerPartner({
          id: syncResult?.userId,
          fullName,
          mobileNumber: formattedPhone,
          email,
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
            phone: formattedPhone,
            email,
            serviceLocations: [location],
          },
        });
      } else {
        loginPartner({
          id: syncResult?.userId,
          identifier: formattedPhone,
          phone: formattedPhone,
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
    <div className="min-h-screen bg-white flex flex-col lg:grid lg:grid-cols-12">
      {/* Desktop Left Brand & Editorial Section (Sharp Geometry) */}
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
            <span className="inline-block px-3 py-1 bg-white/10 border border-white/20 text-[#90CAF9] text-xs font-semibold rounded-md uppercase tracking-wider mb-4">
              Service Partner Ecosystem
            </span>
            <h2 className="font-sora font-bold text-3xl leading-snug text-white">
              Direct booking leads, calendar slot locks, and zero-delay escrow payouts.
            </h2>
            <p className="font-inter text-sm text-white/80 mt-4 leading-relaxed max-w-md">
              Whether you are an independent masterchef, a boutique catering kitchen, or a full event styling atelier, manage all your bookings with 100% pricing autonomy.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-8">
          <div className="card-sharp overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-4">
            <h4 className="font-sora font-bold text-sm text-white">Multi-Role Enablement</h4>
            <p className="font-inter text-xs text-[#90CAF9] mt-1 leading-relaxed">
              Operate as a Chef, Caterer, and Event Manager concurrently under one unified atelier profile.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-[#90CAF9] border-t border-white/10 pt-4 font-inter">
            <span>Razorpay Route Escrow Settlements</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">verified</span>
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
              <span>{step === 'OTP' ? 'Change Number' : (step === 'DETAILS' ? 'Change Roles' : 'Back')}</span>
            </button>
            <div className="flex items-center gap-1.5 bg-[#E3F2FD] border border-[#90CAF9] px-3 py-1 rounded-md">
              <span className="material-symbols-outlined text-[14px] text-[#0D47A1]">storefront</span>
              <span className="font-sora text-xs font-bold text-[#0D47A1]">Partner Studio</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-6 mb-5">
            <h1 className="font-sora font-extrabold text-2xl text-[#172033] tracking-tight">
              {step === 'ROLE_FIRST' && mode === 'REGISTER'
                ? 'Select Your Service Categories'
                : step === 'OTP'
                ? 'Verify Partner Mobile Number'
                : mode === 'REGISTER'
                ? 'Partner Profile Details'
                : 'Partner Studio Sign In'}
            </h1>
            <p className="font-inter text-xs text-[#64748B] mt-1.5 leading-relaxed">
              {step === 'ROLE_FIRST' && mode === 'REGISTER'
                ? 'Select your primary role and any additional services you provide. You can configure individual pricing for each.'
                : step === 'OTP'
                ? `Enter the 6-digit SMS verification code delivered to ${mobileNumber}`
                : mode === 'REGISTER'
                ? 'Provide your professional contact details for customer quotation requests and escrow payouts.'
                : 'Enter your registered partner mobile number to receive a secure SMS OTP.'}
            </p>
          </div>

          {/* Tabs: Sign Up / Sign In (Sharp Geometry) */}
          {(step === 'ROLE_FIRST' || step === 'DETAILS') && (
            <div className="flex bg-[#f1f3ff] p-1 mb-6 border border-[#E5E7EB] rounded-md">
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setStep('ROLE_FIRST');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 font-sora text-xs font-bold rounded transition-all ${
                  mode === 'REGISTER'
                    ? 'bg-white text-[#0D47A1] shadow-xs'
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
                    ? 'bg-white text-[#0D47A1] shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Existing Partner Sign In
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 font-inter text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-500 flex-shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STAGE A: Role Selection First (Mandatory Multi-Role Feature) */}
          {mode === 'REGISTER' && step === 'ROLE_FIRST' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 bg-[#E3F2FD] border border-[#90CAF9] rounded-md">
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
                          ? 'bg-[#E3F2FD]/50 border-[#2196F3] shadow-xs'
                          : 'bg-white border-[#E5E7EB] hover:border-[#90CAF9]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-[#0D47A1] text-white' : 'bg-[#f1f3ff] text-[#64748B]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{role.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-sora font-bold text-xs text-[#172033]">{role.label}</span>
                          <span
                            className={`w-4 h-4 rounded-sm flex items-center justify-center text-[11px] ${
                              isSelected ? 'bg-[#2196F3] text-white' : 'border border-[#CBD5E1]'
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

          {/* STAGE B: Professional Details & Mobile Number */}
          {step === 'DETAILS' && (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4 text-xs font-inter">
              {mode === 'REGISTER' && (
                <>
                  <div>
                    <label className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                      Professional Name *
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px]">
                        person
                      </span>
                      <input
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
                    <label className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                      Culinary Brand / Studio Name (Optional)
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px]">
                        storefront
                      </span>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Royal Dakshin Culinary Studio"
                        className="input-sharp w-full pl-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[#64748B] absolute left-3.5 text-[18px]">
                        mail
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="chef@atelier.in"
                        className="input-sharp w-full pl-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                      Operating Base City *
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
                        placeholder="e.g. Jubilee Hills, Hyderabad"
                        className="input-sharp w-full pl-11"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                  Indian Mobile Number *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1.5 border-r border-[#CBD5E1] pr-2">
                    <span className="text-sm">🇮🇳</span>
                    <span className="font-sora font-bold text-xs text-[#0D47A1]">+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={mobileNumber.replace(/^\+91/, '')}
                    onChange={(e) => setMobileNumber(`+91${e.target.value.replace(/[^0-9]/g, '').slice(0, 10)}`)}
                    placeholder="Enter 10-digit mobile number"
                    className="input-sharp w-full pl-20 font-mono font-bold tracking-wider"
                  />
                </div>
                <span className="text-[11px] text-[#64748B] mt-1 block">
                  A genuine SMS OTP code will be sent to this number.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Dispatching SMS OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send SMS Verification Code</span>
                    <span className="material-symbols-outlined text-[18px]">sms</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STAGE C: 6-Box Individual Digit OTP Verification */}
          {step === 'OTP' && (
            <OtpInput6
              phoneNumber={formatToE164(mobileNumber)}
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
            Customer Mobile Sign In →
          </button>
        </div>
      </div>
    </div>
  );
}
