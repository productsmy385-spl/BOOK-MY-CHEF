import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useProviderStore } from '../../stores/useProviderStore';
import { useClerkOtp } from '../../hooks/useClerkOtp';
import OtpInput6 from '../../components/auth/OtpInput6';
import { formatToE164, isValidIndianMobile, syncUserWithPostgres } from '../../lib/clerkAuthService';

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
  const [step, setStep] = useState('DETAILS'); // 'DETAILS' | 'OTP' | 'ROLE_SELECTION'
  const [localLoading, setLocalLoading] = useState(false);
  const [clerkUserId, setClerkUserId] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('Chef Raghavendra Rao');
  const [mobileNumber, setMobileNumber] = useState('+919876543211');
  const [email, setEmail] = useState('chef.raghavendra@atelier.in');
  const [businessName, setBusinessName] = useState('Royal Dakshin Culinary Studio');
  const [location, setLocation] = useState('Banjara Hills, Hyderabad');

  // Multi-Role Selection (Section 4: 12 authoritative roles)
  const [selectedRoles, setSelectedRoles] = useState(['PRO_CHEF', 'CATERER', 'EVENT_MANAGER']);

  const ALL_PARTNER_ROLES = [
    { id: 'HOME_CHEF', label: 'Home Chef', icon: 'soup_kitchen', desc: 'Regional, traditional family recipes' },
    { id: 'PRO_CHEF', label: 'Professional Chef', icon: 'restaurant', desc: 'Hotel & haute cuisine leadership' },
    { id: 'PERSONAL_CHEF', label: 'Personal Chef', icon: 'person', desc: 'Exclusive villa or private dining' },
    { id: 'CATERER', label: 'Caterer', icon: 'room_service', desc: 'Large scale banquets (50 to 500+ guests)' },
    { id: 'EVENT_PLANNER', label: 'Event Planner', icon: 'event_note', desc: 'End-to-end event planning & coordination' },
    { id: 'EVENT_MANAGER', label: 'Event Manager', icon: 'supervisor_account', desc: 'On-ground operational management' },
    { id: 'DECORATOR', label: 'Decorator', icon: 'filter_vintage', desc: 'Mandap, floral styling & theme lighting' },
    { id: 'PHOTOGRAPHER', label: 'Photographer', icon: 'photo_camera', desc: 'High-res event & candid memories' },
    { id: 'VIDEOGRAPHER', label: 'Videographer', icon: 'videocam', desc: 'Cinematic 4K reels & ceremony video' },
    { id: 'BARTENDER', label: 'Bartender', icon: 'local_bar', desc: 'Curated mixology & cocktail artistry' },
    { id: 'SERVER', label: 'Server', icon: 'room_service', desc: 'Uniformed hospitality serving staff' },
    { id: 'KITCHEN_ASSISTANT', label: 'Kitchen Assistant', icon: 'skillet', desc: 'Mise en place, prep & cleanup support' },
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
      setLocalLoading(true);
      setTimeout(() => {
        setLocalLoading(false);
        setStep('OTP');
      }, 700);
    }
  };

  // Step 2: Verify Real Clerk SMS OTP
  const handleVerifyOtp = async (code) => {
    setErrorMessage('');
    const formattedPhone = formatToE164(mobileNumber);

    if (isConfigured) {
      const res = mode === 'REGISTER'
        ? await verifySignUpOtp(code)
        : await verifySignInOtp(code);

      if (!res.success) return;

      if (res.clerkUserId) {
        setClerkUserId(res.clerkUserId);
      }

      if (mode === 'REGISTER') {
        // Move to Role Selection screen
        setStep('ROLE_SELECTION');
      } else {
        // Existing partner login -> direct redirect to Provider Dashboard
        setLocalLoading(true);
        await syncUserWithPostgres({
          clerkId: res.clerkUserId,
          phone: formattedPhone,
          intendedRole: 'PROVIDER',
        });
        loginPartner({
          identifier: formattedPhone,
          otp: code,
        });
        setLocalLoading(false);
        navigate('/provider/dashboard', { replace: true });
      }
    } else {
      setLocalLoading(true);
      setTimeout(() => {
        setLocalLoading(false);
        if (mode === 'REGISTER') {
          setStep('ROLE_SELECTION');
        } else {
          loginPartner({
            identifier: formattedPhone,
            otp: code,
          });
          navigate('/provider/dashboard', { replace: true });
        }
      }, 600);
    }
  };

  // Step 3: Complete Partner Registration with Selected Multiple Professional Roles
  const handleCompletePartnerRegistration = async () => {
    if (selectedRoles.length === 0) {
      alert('Please select at least one professional service role.');
      return;
    }

    setLocalLoading(true);
    const formattedPhone = formatToE164(mobileNumber);

    // Save in PostgreSQL via sync endpoint
    await syncUserWithPostgres({
      clerkId: clerkUserId || undefined,
      phone: formattedPhone,
      email,
      fullName,
      intendedRole: 'PROVIDER',
      businessName,
      roles: selectedRoles,
    });

    // Save in store with account_type = 'PROVIDER'
    registerPartner({
      fullName,
      mobileNumber: formattedPhone,
      email,
      businessName,
      location,
      roles: selectedRoles,
    });

    updateOnboarding({
      roles: selectedRoles,
      basicInfo: {
        fullName,
        brandName: businessName,
        primaryPhone: formattedPhone,
        email,
        city: location,
      },
    });

    setLocalLoading(false);
    navigate('/provider/dashboard', { replace: true });
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
    <div className="min-h-screen bg-white flex flex-col justify-between max-w-lg mx-auto p-6 font-sora shadow-xl">
      <div>
        {/* Top Header & Back Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <button
            onClick={() => {
              if (step === 'ROLE_SELECTION') setStep('OTP');
              else if (step === 'OTP') setStep('DETAILS');
              else navigate('/auth/welcome');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033]"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{step === 'OTP' ? 'Change Mobile Number' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-1.5 bg-[#E3F2FD] border border-[#90CAF9] px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-[14px] text-[#0D47A1]">soup_kitchen</span>
            <span className="text-[11px] font-bold text-[#0D47A1]">Service Partner Portal</span>
          </div>
        </div>

        {/* Heading */}
        <div className="mt-6 mb-6">
          <h1 className="font-extrabold text-2xl text-[#172033] tracking-tight">
            {step === 'ROLE_SELECTION'
              ? 'Which services do you provide?'
              : step === 'OTP'
              ? 'Verify Partner Mobile Number'
              : mode === 'REGISTER'
              ? 'Service Partner Registration'
              : 'Partner Studio Sign In'}
          </h1>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
            {step === 'ROLE_SELECTION'
              ? 'Select all applicable roles. You can operate across multiple categories (e.g. Chef + Caterer + Event Manager) under one partner account.'
              : step === 'OTP'
              ? 'Enter the 6-digit SMS verification code delivered to your device via Clerk.'
              : mode === 'REGISTER'
              ? 'Register with your verified mobile number to list culinary services and receive escrow bookings.'
              : 'Sign in to access your culinary schedule, bookings, and escrow payouts.'}
          </p>
        </div>

        {/* Tab Switcher: Register / Sign In */}
        {step === 'DETAILS' && (
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
              Partner Registration
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
              Partner SMS Sign In
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && step === 'DETAILS' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px] text-red-500 flex-shrink-0">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Details & Phone */}
        {step === 'DETAILS' && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4 text-xs">
            {mode === 'REGISTER' && (
              <div>
                <label className="block text-[#172033] font-bold uppercase text-[10px] mb-1.5">
                  Professional / Full Name *
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
                    placeholder="Chef Raghavendra Rao"
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
                  placeholder="98765 43211"
                  className="w-full h-12 pl-20 pr-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] text-[#172033] font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-[#90CAF9] focus:bg-white tracking-wider"
                />
              </div>
              <span className="text-[10px] text-[#64748B] mt-1 block">
                Clerk will dispatch an authentic SMS verification code to this mobile.
              </span>
            </div>

            {mode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-[#172033] font-bold uppercase text-[10px] mb-1.5">
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
                      placeholder="chef.raghavendra@atelier.in"
                      className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] text-[#172033] font-semibold text-sm outline-none focus:ring-2 focus:ring-[#90CAF9] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#172033] font-bold uppercase text-[10px] mb-1.5">
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
                      placeholder="Royal Dakshin Culinary Studio"
                      className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] text-[#172033] font-semibold text-sm outline-none focus:ring-2 focus:ring-[#90CAF9] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#172033] font-bold uppercase text-[10px] mb-1.5">
                    Base Operational City *
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
                      placeholder="Banjara Hills, Hyderabad"
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
                  <span>Dispatching Real SMS OTP...</span>
                </>
              ) : (
                <>
                  <span>Request Real SMS Verification OTP</span>
                  <span className="material-symbols-outlined text-[18px]">sms</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: 6-Box Individual Digit OTP Verification */}
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

        {/* STEP 3: Multi-Role Selection (Section 4 Requirement) */}
        {step === 'ROLE_SELECTION' && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#E3F2FD] border border-[#90CAF9] flex items-center justify-between">
              <span className="font-bold text-[#0D47A1] text-xs">
                {selectedRoles.length} Service Role{selectedRoles.length > 1 ? 's' : ''} Selected
              </span>
              <span className="text-[10px] bg-white text-[#0D47A1] font-bold px-2.5 py-1 rounded-full shadow-xs">
                Multi-Role Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {ALL_PARTNER_ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#E3F2FD] border-[#2196F3] ring-1 ring-[#2196F3] shadow-sm'
                        : 'bg-white border-[#E5E7EB] hover:bg-[#f1f3ff]'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#0D47A1] text-white shadow-xs'
                          : 'bg-[#f1f3ff] text-[#64748B]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{role.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#172033] truncate">
                          {role.label}
                        </span>
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[12px] ${
                            isSelected
                              ? 'bg-[#2196F3] text-white'
                              : 'border border-[#CBD5E1]'
                          }`}
                        >
                          {isSelected && '✓'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#64748B] mt-0.5 line-clamp-1">
                        {role.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCompletePartnerRegistration}
              disabled={isLoading || selectedRoles.length === 0}
              className="mt-3 w-full py-4 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#0D47A1]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Roles to PostgreSQL...</span>
                </>
              ) : (
                <>
                  <span>Save Roles &amp; Enter Studio Dashboard</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Switch to Customer CTA */}
      <div className="pt-6 border-t border-[#E5E7EB] text-center text-xs text-[#64748B]">
        <span>Looking to book a chef or catering for an event? </span>
        <button
          onClick={() => navigate('/auth/customer')}
          className="font-bold text-[#0D47A1] hover:underline"
        >
          Customer Mobile Sign In →
        </button>
      </div>
    </div>
  );
}
