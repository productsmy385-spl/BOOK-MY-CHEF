import React from 'react';

export default function PaymentMethodsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sora">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#f8faff] to-[#E3F2FD]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2196F3] text-[22px]">account_balance_wallet</span>
            <div>
              <h3 className="font-bold text-sm text-[#172033]">Payments &amp; Escrow Vault</h3>
              <p className="font-inter text-xs text-[#64748B]">Bank-grade protected settlements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#172033] shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-4 font-inter text-xs">
          {/* Escrow Guarantee Banner */}
          <div className="p-4 rounded-lg bg-[#E3F2FD] border border-[#90CAF9] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#0D47A1]">
              <span className="material-symbols-outlined text-[20px] fill-1">verified_user</span>
              <h4 className="font-sora font-bold text-xs uppercase tracking-wider">
                100% Escrow Protection Protocol
              </h4>
            </div>
            <p className="text-xs text-[#172033] leading-relaxed">
              When you book a chef, caterer, or decorator, your money is securely held in an RBI-compliant escrow account. Funds are only released to the service provider after each milestone checklist is digitally confirmed.
            </p>
          </div>

          {/* Milestone Schedule */}
          <div>
            <h4 className="font-sora font-bold text-xs text-[#172033] mb-2.5">Escrow Release Milestones</h4>
            <div className="flex flex-col gap-2 font-sora">
              <div className="p-3 rounded-md border border-[#E5E7EB] bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#E3F2FD] text-[#0D47A1] text-xs font-bold flex items-center justify-center">1</span>
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Advance Slot Lock</span>
                    <span className="font-inter text-[11px] text-[#64748B]">Paid upon booking confirmation to secure the chef's calendar</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#E3F2FD] text-[#0D47A1] text-xs font-extrabold">30%</span>
              </div>

              <div className="p-3 rounded-md border border-[#E5E7EB] bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#E3F2FD] text-[#0D47A1] text-xs font-bold flex items-center justify-center">2</span>
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Ingredient Sourcing &amp; Prep</span>
                    <span className="font-inter text-[11px] text-[#64748B]">Released when chef uploads grocery &amp; ingredient checklist 24h prior</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#E3F2FD] text-[#0D47A1] text-xs font-extrabold">50%</span>
              </div>

              <div className="p-3 rounded-md border border-[#E5E7EB] bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#E3F2FD] text-[#0D47A1] text-xs font-bold flex items-center justify-center">3</span>
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Post-Event Completion</span>
                    <span className="font-inter text-[11px] text-[#64748B]">Settled after feast completion and host kitchen inspection confirmation</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-extrabold">20%</span>
              </div>
            </div>
          </div>

          {/* Supported Methods */}
          <div>
            <h4 className="font-sora font-bold text-xs text-[#172033] mb-2">Supported Payment Gateways</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 border border-[#E5E7EB] rounded-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2196F3] text-[18px]">smartphone</span>
                <span className="font-medium text-[#172033]">UPI (GPay, PhonePe, Paytm)</span>
              </div>
              <div className="p-2.5 border border-[#E5E7EB] rounded-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2196F3] text-[18px]">credit_card</span>
                <span className="font-medium text-[#172033]">Credit / Debit Cards</span>
              </div>
              <div className="p-2.5 border border-[#E5E7EB] rounded-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2196F3] text-[18px]">account_balance</span>
                <span className="font-medium text-[#172033]">Net Banking (50+ Banks)</span>
              </div>
              <div className="p-2.5 border border-[#E5E7EB] rounded-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2196F3] text-[18px]">security</span>
                <span className="font-medium text-[#172033]">256-Bit SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#0D47A1] text-white text-xs font-bold font-sora hover:bg-[#1565C0] cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
