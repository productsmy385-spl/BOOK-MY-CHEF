import React, { useState, useRef, useEffect } from 'react';

/**
 * OtpInput6: 6-Box Individual Digit OTP Input Component
 * Adheres strictly to Section 7:
 * - 6 individual digit input boxes
 * - Automatic focus movement
 * - Backspace navigation
 * - Paste support (6-digit clipboard parse)
 * - Mobile numeric keyboard optimization (inputMode="numeric", one-time-code)
 * - 60-second resend cooldown timer
 * - Stitch Design System palette (#0D47A1, #2196F3, #E3F2FD)
 */
export default function OtpInput6({
  phoneNumber,
  onVerify,
  onResend,
  onChangeNumber,
  isLoading,
  errorMessage,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(60);
  const inputRefs = useRef([]);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // 60-Second Resend Countdown
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle digit typing & auto focus progression
  const handleChange = (index, value) => {
    const char = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto-advance to next input if digit entered
    if (char && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-submit if all 6 digits filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      onVerify(fullCode);
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle Clipboard Paste (e.g. 6-digit SMS OTP copied)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);

    const focusIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }

    if (pastedData.length === 6) {
      onVerify(pastedData);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length === 6) {
      onVerify(code);
    }
  };

  const handleResendClick = () => {
    if (cooldown === 0) {
      setCooldown(60);
      setDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
      onResend();
    }
  };

  // Masked Phone Number display: +91 XXXXX 43210
  const formattedDisplayPhone = () => {
    if (!phoneNumber) return '+91 XXXXX XXXXX';
    const clean = phoneNumber.replace(/[^0-9+]/g, '');
    if (clean.length >= 10) {
      const last4 = clean.slice(-4);
      return `+91 XXXXX ${last4}`;
    }
    return phoneNumber;
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <div className="flex flex-col gap-6 font-sora">
      {/* Verification Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#E3F2FD] border border-[#90CAF9]/60 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#2196F3] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
          <span className="material-symbols-outlined text-[20px]">sms</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#0D47A1] text-xs">Verify your mobile number</h3>
          <p className="text-[11px] text-[#172033] mt-0.5 leading-relaxed">
            We have sent a 6-digit verification code to{' '}
            <strong className="text-[#0D47A1] font-extrabold">{formattedDisplayPhone()}</strong>.
          </p>
          <button
            type="button"
            onClick={onChangeNumber}
            className="text-[11px] font-bold text-[#2196F3] hover:underline mt-1 inline-flex items-center gap-1"
          >
            <span>Change Mobile Number</span>
            <span className="material-symbols-outlined text-[13px]">edit</span>
          </button>
        </div>
      </div>

      {/* Error Message Display */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px] text-red-500 flex-shrink-0">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 6 Individual OTP Digit Inputs */}
      <form onSubmit={handleManualSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-[#172033] font-bold uppercase text-[10px] mb-3 text-center tracking-wider">
            Enter 6-Digit SMS Code
          </label>
          <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isLoading}
                className={`w-11 h-14 sm:w-13 sm:h-16 text-center font-mono text-2xl font-extrabold rounded-2xl border-2 outline-none transition-all ${
                  digit
                    ? 'border-[#2196F3] bg-[#E3F2FD] text-[#0D47A1] shadow-sm'
                    : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#172033] hover:border-[#90CAF9]'
                } focus:border-[#0D47A1] focus:ring-4 focus:ring-[#90CAF9]/40 focus:bg-white`}
              />
            ))}
          </div>
        </div>

        {/* Resend OTP Cooldown */}
        <div className="flex items-center justify-between text-xs px-2 text-[#64748B]">
          <span>Didn't receive the SMS code?</span>
          {cooldown > 0 ? (
            <span className="font-semibold text-[#0D47A1] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] animate-spin">schedule</span>
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendClick}
              disabled={isLoading}
              className="font-bold text-[#2196F3] hover:text-[#0D47A1] hover:underline transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              <span>Resend OTP</span>
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isComplete || isLoading}
          className={`w-full py-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
            isComplete && !isLoading
              ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-emerald-500/20 active:scale-95'
              : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Verifying Code with Clerk...</span>
            </>
          ) : (
            <>
              <span>Verify &amp; Continue</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
