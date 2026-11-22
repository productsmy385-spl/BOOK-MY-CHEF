import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useClerkOtp } from '../../hooks/useClerkOtp';
import OtpInput6 from '../../components/auth/OtpInput6';
import { formatToE164, isValidIndianMobile } from '../../lib/clerkAuthService';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuthStore();
  const {
    isConfigured,
    isLoading: isClerkLoading,
    errorMessage,
    setErrorMessage,
    sendSignInOtp,
    verifySignInOtp,
  } = useClerkOtp();

  const [step, setStep] = useState('CREDENTIALS'); // 'CREDENTIALS' | 'OTP'
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = isClerkLoading || localLoading;

  // Step 1: Send SMS OTP to Invited Administrator Phone
  const handleSendAdminOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const formattedPhone = formatToE164(mobileNumber);
    if (!isValidIndianMobile(formattedPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (+91 followed by 6, 7, 8, or 9).');
      return;
    }

    // Verify authorized invitation records before requesting OTP
    const authorizedPhones = ['+919876543212', '+919812345678'];
    const authorizedEmails = ['superadmin@atelier.in', 'admin@atelier.in', 'vikram@atelier.in'];

    if (!authorizedPhones.includes(formattedPhone) && !authorizedEmails.includes(email.trim().toLowerCase())) {
      setErrorMessage('Access Denied: No active administrator invitation found for this mobile/email.');
      return;
    }

    if (isConfigured) {
      const res = await sendSignInOtp(formattedPhone);
      if (res.success) {
        setStep('OTP');
      }
    } else {
      setErrorMessage('Clerk authentication is not configured in this environment.');
    }
  };

  // Step 2: Verify Real SMS OTP & Grant Admin Access
  const handleVerifyAdminOtp = async (code) => {
    setErrorMessage('');
    const formattedPhone = formatToE164(mobileNumber);

    if (!isConfigured) {
      setErrorMessage('Clerk authentication is not configured.');
      return;
    }

    const res = await verifySignInOtp(code);
    if (!res.success) return;

    setLocalLoading(true);
    loginAdmin({
      email,
      phone: formattedPhone,
      clerkId: res.clerkUserId,
      sessionToken: res.sessionId,
    });
    setLocalLoading(false);
    navigate('/admin', { replace: true });
  };

  const handleResendAdminOtp = async () => {
    const formattedPhone = formatToE164(mobileNumber);
    if (isConfigured) {
      await sendSignInOtp(formattedPhone);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sora">
      <div className="w-full max-w-md bg-white rounded-lg p-8 shadow-md border border-[#E5E7EB] flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-md bg-[#0D47A1] text-white flex items-center justify-center shadow-sm mb-3">
            <span className="material-symbols-outlined text-[26px] text-[#90CAF9]">shield</span>
          </div>
          <h1 className="font-extrabold text-xl text-[#172033]">Platform Administration</h1>
          <p className="text-xs text-[#64748B] mt-1 font-inter">Culinary &amp; Event Atelier Governance Portal</p>
        </div>

        {/* Invitation-Only Warning Alert (Section 6 Mandate) */}
        <div className="p-3.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 font-inter">
          <span className="material-symbols-outlined text-[18px] text-amber-600 flex-shrink-0 mt-0.5">lock</span>
          <p className="leading-relaxed">
            <strong>Restricted Access:</strong> Administrator accounts require an existing authorization record in PostgreSQL. Public registration is permanently disabled.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && step === 'CREDENTIALS' && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-inter">
            <span className="material-symbols-outlined text-[18px] text-red-500 flex-shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'CREDENTIALS' ? (
          <form onSubmit={handleSendAdminOtp} className="flex flex-col gap-4 text-xs font-inter">
            <div>
              <label className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                Invited Administrator Mobile Number *
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
                  placeholder="98765 43212"
                  className="input-sharp w-full pl-20 font-mono font-bold tracking-wider"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5">
                Authorized Corporate Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@atelier.in"
                className="input-sharp w-full"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Invitation...</span>
                </>
              ) : (
                <>
                  <span>Send Administrator SMS OTP</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <OtpInput6
            phoneNumber={formatToE164(mobileNumber)}
            onVerify={handleVerifyAdminOtp}
            onResend={handleResendAdminOtp}
            onChangeNumber={() => setStep('CREDENTIALS')}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        )}

        <div className="pt-2 text-center">
          <button
            onClick={() => navigate('/auth/welcome')}
            className="btn-ghost w-full text-xs font-semibold"
          >
            ← Return to Atelier Welcome Screen
          </button>
        </div>
      </div>
    </div>
  );
}
