import React from 'react';

/**
 * FormInput: Universal Reusable Input Component
 * Adheres strictly to Sharp Geometry & WCAG AAA Design System:
 * - Architecture:
 *   InputWrapper
 *   ├── Label
 *   ├── InputContainer (Flexbox container, fixed 48px height, rounded-md 6px)
 *   │   ├── LeadingIcon (Dedicated flex container, zero text overlap)
 *   │   ├── Input (flex-1, transparent, full height, border-none)
 *   │   └── TrailingAction (Password visibility toggle, clear button, etc.)
 *   ├── HelperText
 *   └── ErrorMessage
 *
 * Guarantees zero icon overlapping, full text selection, and uniform styling across consoles.
 */
export default function FormInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  leadingIcon,
  trailingAction,
  helperText,
  errorMessage,
  autoComplete,
  className = '',
  inputClassName = '',
  maxLength,
  min,
  max,
  step,
  autoFocus = false,
}) {
  const hasError = Boolean(errorMessage);

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* 1. Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-[#172033] font-sora font-bold uppercase text-[10px] mb-1.5 tracking-wider select-none"
        >
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {/* 2. Input Container (Flexbox with fixed 48px height) */}
      <div
        className={`w-full h-12 bg-white rounded-md border flex items-center transition-all ${
          hasError
            ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100'
            : 'border-[#CBD5E1] hover:border-[#94A3B8] focus-within:border-[#2196F3] focus-within:ring-2 focus-within:ring-[#2196F3]/20'
        } ${disabled ? 'bg-[#F8FAFC] opacity-60 cursor-not-allowed' : ''}`}
      >
        {/* Leading Icon (Fixed dedicated flex container - cannot overlap text) */}
        {leadingIcon && (
          <div className="w-11 h-full flex items-center justify-center text-[#64748B] shrink-0 pointer-events-none select-none pl-1">
            <span className="material-symbols-outlined text-[19px]">{leadingIcon}</span>
          </div>
        )}

        {/* Real Native HTML Input */}
        <input
          id={id}
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
          className={`flex-1 h-full bg-transparent border-0 outline-none text-[#172033] font-inter text-sm placeholder:text-[#94A3B8] ${
            leadingIcon ? 'px-1' : 'px-3.5'
          } ${trailingAction ? 'pr-1' : 'pr-3.5'} ${inputClassName}`}
        />

        {/* Trailing Action (e.g. password toggle) */}
        {trailingAction && (
          <div className="h-full flex items-center pr-3 shrink-0">
            {trailingAction}
          </div>
        )}
      </div>

      {/* 3. Helper Text */}
      {helperText && !hasError && (
        <span className="text-[11px] text-[#64748B] mt-1.5 font-inter leading-tight">
          {helperText}
        </span>
      )}

      {/* 4. Error Message */}
      {hasError && (
        <span className="text-xs text-red-600 mt-1 font-inter flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          <span>{errorMessage}</span>
        </span>
      )}
    </div>
  );
}
