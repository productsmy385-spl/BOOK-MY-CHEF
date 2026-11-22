import React from 'react';

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sora">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#f8faff] to-[#E3F2FD]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2196F3] text-[22px]">policy</span>
            <div>
              <h3 className="font-bold text-sm text-[#172033]">Terms, Privacy &amp; Escrow Policy</h3>
              <p className="font-inter text-xs text-[#64748B]">Platform regulations and host guarantees</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#172033] shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-4 font-inter text-xs leading-relaxed text-[#172033]">
          <div>
            <h4 className="font-sora font-bold text-xs text-[#0D47A1] uppercase tracking-wider mb-1">
              1. Escrow Protection &amp; Milestone Billing
            </h4>
            <p className="text-[#64748B]">
              All host payments made on BOOK MY CHEF are routed into a secure, bank-regulated escrow holding vault. The chef or caterer does not receive full funds until you inspect and verify the feast completion.
            </p>
          </div>

          <div>
            <h4 className="font-sora font-bold text-xs text-[#0D47A1] uppercase tracking-wider mb-1">
              2. Cancellation &amp; Refund Policy
            </h4>
            <p className="text-[#64748B]">
              • <strong>More than 48 hours prior to event:</strong> 100% full refund of total booking fee.<br />
              • <strong>24 to 48 hours prior:</strong> 70% refund (30% retained for perishable ingredient acquisition).<br />
              • <strong>Under 24 hours:</strong> 50% refund to compensate booked culinary artisans.
            </p>
          </div>

          <div>
            <h4 className="font-sora font-bold text-xs text-[#0D47A1] uppercase tracking-wider mb-1">
              3. Kitchen Hygiene &amp; FSSAI Standards
            </h4>
            <p className="text-[#64748B]">
              All chefs and kitchen assistants operating through BOOK MY CHEF adhere to strict FSSAI food hygiene norms, temperature-controlled transit, and sanitized cooking aprons.
            </p>
          </div>

          <div>
            <h4 className="font-sora font-bold text-xs text-[#0D47A1] uppercase tracking-wider mb-1">
              4. Data Privacy
            </h4>
            <p className="text-[#64748B]">
              Your venue address and personal phone number are masked and shared solely with your assigned service provider 24 hours prior to event time for logistics.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#0D47A1] text-white text-xs font-bold font-sora hover:bg-[#1565C0] cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
