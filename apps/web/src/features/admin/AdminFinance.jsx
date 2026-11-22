import React, { useState } from 'react';

export default function AdminFinance() {
  const [commissionRate, setCommissionRate] = useState(10.0);
  const [payoutsProcessed, setPayoutsProcessed] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  const handleDisburseBatch = () => {
    setPayoutsProcessed(true);
    setTimeout(() => setPayoutsProcessed(false), 4000);
  };

  const handleSaveCommission = (e) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 3000);
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-sora font-extrabold text-2xl text-[#172033]">Financial Settlements &amp; Commission Policy</h1>
        <p className="font-sora text-xs text-[#64748B]">Manage platform escrow, automated provider payouts, and dynamic take-rates.</p>
      </div>

      {payoutsProcessed && (
        <div className="p-3.5 rounded-2xl bg-[#10B981]/15 border border-[#10B981] text-[#047857] font-sora text-xs font-bold">
          ✓ Batch of 28 provider payouts (₹3,12,000) successfully dispatched via Razorpay Route!
        </div>
      )}

      {savedSettings && (
        <div className="p-3.5 rounded-2xl bg-[#2196F3]/15 border border-[#2196F3] text-[#0D47A1] font-sora text-xs font-bold">
          ✓ Base commission rate updated to {commissionRate}% across new bookings.
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle">
          <span className="font-sora text-[10px] text-[#64748B] uppercase font-bold">Total Platform Escrow Held</span>
          <span className="font-sora font-extrabold text-2xl text-[#0D47A1] block mt-1">₹18,40,000</span>
          <span className="font-sora text-[11px] text-[#10B981] font-semibold mt-1 block">184 active event reservations</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle">
          <span className="font-sora text-[10px] text-[#64748B] uppercase font-bold">Pending Provider Payouts</span>
          <span className="font-sora font-extrabold text-2xl text-[#172033] block mt-1">₹3,12,000</span>
          <span className="font-sora text-[11px] text-[#64748B] mt-1 block">28 completed events awaiting transfer</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle">
          <span className="font-sora text-[10px] text-[#64748B] uppercase font-bold">Monthly Net Commission</span>
          <span className="font-sora font-extrabold text-2xl text-[#10B981] block mt-1">₹5,82,348</span>
          <span className="font-sora text-[11px] text-[#64748B] mt-1 block">Average take rate: 12.0%</span>
        </div>
      </div>

      {/* Batch Payout Action Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0D47A1] to-[#2196F3] text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-sora font-bold text-base text-white">Execute Weekly Provider Settlement Batch</h3>
          <p className="font-sora text-xs text-[#90CAF9] mt-0.5">
            Disburse 28 verified completion events directly to provider bank accounts via Razorpay Route API.
          </p>
        </div>
        <button
          onClick={handleDisburseBatch}
          className="px-6 py-3 bg-white text-[#0D47A1] hover:bg-[#E3F2FD] rounded-full font-sora text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center gap-2 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>Execute Payouts (₹3,12,000)</span>
        </button>
      </div>

      {/* Commission Configuration Form */}
      <form onSubmit={handleSaveCommission} className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-4">
        <h3 className="font-sora font-bold text-sm text-[#172033]">Platform Commission Rate Configuration</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sora">
          <div>
            <label className="block text-[#64748B] font-bold mb-1">Master Chefs Take-Rate (%)</label>
            <input
              type="number"
              step="0.5"
              value={commissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
              className="w-full h-11 px-3 rounded-xl bg-[#f1f3ff] border border-[#E5E7EB] font-bold text-[#0D47A1] outline-none"
            />
          </div>
          <div>
            <label className="block text-[#64748B] font-bold mb-1">Home Chefs Rate (%)</label>
            <input
              type="number"
              defaultValue={8.0}
              className="w-full h-11 px-3 rounded-xl bg-[#f1f3ff] border border-[#E5E7EB] font-bold text-[#0D47A1] outline-none"
            />
          </div>
          <div>
            <label className="block text-[#64748B] font-bold mb-1">Catering Providers (%)</label>
            <input
              type="number"
              defaultValue={12.0}
              className="w-full h-11 px-3 rounded-xl bg-[#f1f3ff] border border-[#E5E7EB] font-bold text-[#0D47A1] outline-none"
            />
          </div>
          <div>
            <label className="block text-[#64748B] font-bold mb-1">Event Planners &amp; Decor (%)</label>
            <input
              type="number"
              defaultValue={15.0}
              className="w-full h-11 px-3 rounded-xl bg-[#f1f3ff] border border-[#E5E7EB] font-bold text-[#0D47A1] outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-bold shadow-sm transition-all"
          >
            Save Commission Rates
          </button>
        </div>
      </form>
    </div>
  );
}
