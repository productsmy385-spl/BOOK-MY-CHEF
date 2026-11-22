import React, { forwardRef } from 'react';

/**
 * PhoneInput - Architectural Standard for Mobile Number Inputs
 * 
 * Solves the critical overlapping bug permanently:
 * - Pure Flexbox layout (no brittle absolute positioning)
 * - Distinct, fixed-width country code badge (+91 🇮🇳 IN) with right border divider
 * - Completely isolated <input> in its own flex cell starting AFTER the divider
 * - Mobile numeric keyboard optimization (inputMode="numeric", pattern="[0-9]*")
 * - Automatic sanitization (only accepts digits, handles pasted numbers)
 * - Sharp Geometry Design System tokens (rounded-md, h-12, #CBD5E1 border, #2196F3 focus)
 */
const PhoneInput = forwardRef(function PhoneInput(
  {
    value = '',
    onChange,
    placeholder = 'Enter 10-digit mobile number',
    required = false,
    disabled = false,
    error = false,
    autoFocus = false,
    className = '',
    id = 'phone-input',
    name = 'phone',
    ...rest
  },
  ref
) {
  // Extract pure 10 digits regardless of whether +91 or spaces were supplied
  const cleanDigits = (typeof value === 'string' ? value : '').replace(/^\+91/, '').replace(/[^0-9]/g, '').slice(0, 10);

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    // Strip everything except numbers, max 10 digits
    const sanitized = rawVal.replace(/[^0-9]/g, '').slice(0, 10);
    // Standardize to E.164 with +91 prefix for the parent form handler
    if (onChange) {
      onChange(`+91${sanitized}`);
    }
  };

  return (
    <div
      className={`flex items-center h-12 w-full bg-white border ${
        error
          ? 'border-red-500 ring-1 ring-red-500'
          : 'border-[#CBD5E1] hover:border-[#94A3B8] focus-within:border-[#2196F3] focus-within:ring-2 focus-within:ring-[#2196F3]/25'
      } rounded-md transition-all overflow-hidden shadow-xs ${disabled ? 'opacity-60 bg-[#F8FAFC] cursor-not-allowed' : ''} ${className}`}
    >
      {/* Isolated Country Code Prefix Container with Crisp Right Border */}
      <div
        className="h-full px-3.5 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center gap-1.5 shrink-0 select-none"
        aria-hidden="true"
      >
        <span className="text-base leading-none" role="img" aria-label="India Flag">
          🇮🇳
        </span>
        <span className="font-sora font-bold text-xs text-[#0D47A1] tracking-wide">
          +91
        </span>
      </div>

      {/* Fully Independent Input Area - Physical Overlap Impossible */}
      <input
        ref={ref}
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        value={cleanDigits}
        onChange={handleInputChange}
        placeholder={placeholder}
        maxLength={10}
        autoComplete="tel-national"
        className="flex-1 h-full px-3.5 bg-transparent border-0 outline-none font-mono font-semibold text-sm text-[#172033] placeholder:text-[#94A3B8] placeholder:font-sans placeholder:font-normal placeholder:text-xs disabled:cursor-not-allowed"
        {...rest}
      />

      {/* Verified Digit Counter Pill (shows 10/10 when complete) */}
      {cleanDigits.length > 0 && (
        <div className="pr-3 shrink-0 select-none">
          <span
            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
              cleanDigits.length === 10
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {cleanDigits.length}/10
          </span>
        </div>
      )}
    </div>
  );
});

export default PhoneInput;
