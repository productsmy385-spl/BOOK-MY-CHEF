import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../stores/useBookingStore';

export default function BookingStep3Quotation() {
  const navigate = useNavigate();
  const { provider, step1Requirements, step2Preferences, quotation } = useBookingStore();

  return (
    <div className="flex flex-col w-full min-h-screen pb-32 pt-2 bg-white">
      {/* Step Header & Progress */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-sora font-semibold text-[#64748B] hover:text-[#172033]">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back</span>
        </button>
        <span className="font-sora text-xs font-bold text-[#0D47A1]">Step 3 of 5: Quotation</span>
        <div className="w-16 h-1.5 rounded-full bg-[#f1f3ff] overflow-hidden">
          <div className="w-3/5 h-full bg-[#2196F3] rounded-full"></div>
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4">
        {/* Provider Brief */}
        <div className="p-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#90CAF9] flex-shrink-0">
              <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-sora font-bold text-sm text-[#172033]">{provider.name}</h4>
              <p className="font-sora text-xs text-[#2196F3] font-semibold">{provider.cuisines}</p>
            </div>
          </div>
          <span className="text-[11px] font-sora font-bold px-2.5 py-1 rounded-full bg-white text-[#0D47A1] shadow-xs">
            Verified Chef
          </span>
        </div>

        {/* Event Parameters Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-2.5">
          <span className="font-sora font-bold text-xs text-[#0D47A1] uppercase tracking-wider">Event Summary</span>
          <div className="grid grid-cols-2 gap-3 text-xs font-sora pt-1 border-t border-[#E5E7EB]">
            <div>
              <span className="text-[#64748B] block text-[10px]">Occasion:</span>
              <span className="font-semibold text-[#172033]">{step1Requirements.eventType}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px]">Date &amp; Time:</span>
              <span className="font-semibold text-[#172033]">{step1Requirements.eventDate} • {step1Requirements.timeSlot}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px]">Guest Count:</span>
              <span className="font-semibold text-[#172033]">{step1Requirements.guestCount} Guests ({step2Preferences.dietary})</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px]">Delivery Mode:</span>
              <span className="font-semibold text-[#172033]">
                {step2Preferences.serviceMode === 'CHEF_VISITS_HOME' ? 'Chef Visits Home' : 'Cook & Deliver'}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Quotation Breakdown (Stitch Exact Architecture) */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
              Itemized Quotation
            </span>
            <span className="font-sora text-[10px] text-[#2196F3] font-bold">Transparent Rates</span>
          </div>

          <div className="flex flex-col gap-2.5 text-xs font-sora pt-2 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Chef Base Visiting &amp; Prep Fee:</span>
              <span className="font-bold text-[#172033]">₹{quotation.baseVisitingFee.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">
                Catering &amp; Ingredients ({step1Requirements.guestCount} × ₹{provider.perPersonRate}):
              </span>
              <span className="font-bold text-[#172033]">
                ₹{(step1Requirements.guestCount * provider.perPersonRate).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Travel &amp; Logistics (Jubilee Hills):</span>
              <span className="font-bold text-[#172033]">₹{quotation.travelLogistics.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Escrow Protection &amp; Hygiene Pledge:</span>
              <span className="font-bold text-[#172033]">₹{quotation.platformServiceFee.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-sm">
              <span className="font-sora font-bold text-[#172033]">Total Booking Value:</span>
              <span className="font-sora font-extrabold text-[#0D47A1] text-base">
                ₹{(quotation.baseVisitingFee + (step1Requirements.guestCount * provider.perPersonRate) + quotation.travelLogistics + quotation.platformServiceFee).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Advance vs Balance Split (Escrow Guarantee) */}
        <div className="p-4 rounded-2xl bg-[#E3F2FD] border border-[#90CAF9] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0D47A1] text-[20px]">shield</span>
            <span className="font-sora font-bold text-xs text-[#0D47A1]">Escrow Advance Payment Schedule</span>
          </div>
          <div className="flex items-center justify-between text-xs font-sora mt-1">
            <div>
              <span className="text-[#64748B] block text-[10px]">Due Now (30% Advance):</span>
              <span className="font-bold text-[#172033] text-sm">
                ₹{Math.round((quotation.baseVisitingFee + (step1Requirements.guestCount * provider.perPersonRate) + quotation.travelLogistics + quotation.platformServiceFee) * 0.3).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#64748B] block text-[10px]">Due on Event Completion:</span>
              <span className="font-bold text-[#64748B] text-sm">
                ₹{Math.round((quotation.baseVisitingFee + (step1Requirements.guestCount * provider.perPersonRate) + quotation.travelLogistics + quotation.platformServiceFee) * 0.7).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <p className="font-sora text-[10px] text-[#0D47A1] mt-1 leading-relaxed">
            *Your 30% advance locks Chef Raghavendra's calendar slot and funds fresh grocery procurement. Funds remain safely in platform escrow until host confirms event completion.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Checkout Action */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB] p-4 shadow-nav pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-sora text-[10px] text-[#64748B]">Payable Advance</span>
            <span className="font-sora font-extrabold text-lg text-[#0D47A1]">
              ₹{Math.round((quotation.baseVisitingFee + (step1Requirements.guestCount * provider.perPersonRate) + quotation.travelLogistics + quotation.platformServiceFee) * 0.3).toLocaleString('en-IN')}
            </span>
          </div>
          <button
            onClick={() => navigate('/booking/step-4')}
            className="flex-1 py-3 px-6 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Proceed to Secure Checkout</span>
            <span className="material-symbols-outlined text-[16px]">lock</span>
          </button>
        </div>
      </div>
    </div>
  );
}
