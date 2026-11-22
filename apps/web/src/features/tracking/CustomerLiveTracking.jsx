import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';
import { useBookingStore } from '../../stores/useBookingStore';

export default function CustomerLiveTracking() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { provider, step1Requirements, activeBooking } = useBookingStore();
  const [currentStep, setCurrentStep] = useState(2); // 2 = In Transit

  const steps = [
    { id: 1, title: 'Fresh Groceries & Spices Procured', time: '08:30 AM', completed: true },
    { id: 2, title: 'Departed Base Kitchen (In Transit)', time: '10:00 AM', completed: true, active: true },
    { id: 3, title: 'Arrived at Jubilee Hills Venue', time: 'Est. 10:35 AM', completed: false },
    { id: 4, title: 'Kitchen Sanitized & Cooking Underway', time: 'Est. 11:00 AM', completed: false },
    { id: 5, title: 'Feast Plated & Served Warm', time: 'Est. 12:30 PM', completed: false },
    { id: 6, title: 'Kitchen Clean-up & Final Handover', time: 'Est. 02:00 PM', completed: false },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 bg-white">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-sora font-semibold text-[#64748B] hover:text-[#172033]">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back</span>
        </button>
        <span className="font-sora text-xs font-bold text-[#0D47A1]">Live Event Tracking</span>
        <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-sora text-[10px] font-bold">
          LIVE
        </span>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4">
        {/* Live ETA Card (Stitch Screen 24) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0D47A1] to-[#2196F3] text-white shadow-md flex items-center justify-between">
          <div>
            <span className="font-sora text-[10px] uppercase tracking-wider text-[#90CAF9] font-bold block">
              Real-time Travel Status
            </span>
            <h3 className="font-sora font-extrabold text-xl leading-tight mt-0.5">
              Chef Raghavendra is 12 mins away
            </h3>
            <p className="font-sora text-xs text-white/90 mt-0.5">
              En route on Road No. 36 • Driving Swift Dzire
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 animate-pulse">
            <span className="material-symbols-outlined text-[28px] text-white">navigation</span>
          </div>
        </div>

        {/* Chef Contact Strip */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-[#90CAF9] flex-shrink-0">
              <img src={ASSETS.chefRaghavendraTracking} alt={provider.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#0D47A1] text-[14px] fill-1">verified</span>
                <span className="font-sora text-[10px] font-bold text-[#0D47A1]">Assigned Masterchef</span>
              </div>
              <h4 className="font-sora font-bold text-sm text-[#172033]">{provider.name}</h4>
              <p className="font-sora text-xs text-[#64748B]">OTP for Arrival: <strong className="text-[#0D47A1]">4892</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/provider/chat')}
              className="w-10 h-10 rounded-full bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center hover:bg-[#90CAF9] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </button>
            <a
              href="tel:+919849012345"
              className="w-10 h-10 rounded-full bg-[#2196F3] text-white flex items-center justify-center hover:bg-[#0D47A1] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </a>
          </div>
        </div>

        {/* Live Service Timeline (Stitch Checklist) */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
              Event-Day Live Checklist
            </span>
            <span className="font-sora text-[10px] text-[#2196F3] font-bold">Step 2 of 6 Active</span>
          </div>

          <div className="flex flex-col gap-4 relative pl-2">
            {/* Timeline Vertical Line */}
            <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-[#E5E7EB]"></div>

            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-3.5 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-sora text-xs font-bold ${
                  step.completed
                    ? 'bg-[#10B981] text-white ring-4 ring-[#10B981]/20'
                    : step.active
                    ? 'bg-[#2196F3] text-white ring-4 ring-[#2196F3]/30 animate-pulse'
                    : 'bg-[#f1f3ff] text-[#64748B] border border-[#E5E7EB]'
                }`}>
                  {step.completed ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    idx + 1
                  )}
                </div>

                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <h5 className={`font-sora text-xs font-bold ${step.active ? 'text-[#0D47A1]' : 'text-[#172033]'}`}>
                      {step.title}
                    </h5>
                    <span className="font-sora text-[10px] text-[#64748B]">{step.time}</span>
                  </div>
                  {step.active && (
                    <p className="font-sora text-[11px] text-[#2196F3] mt-0.5">
                      Chef has shared live location tracking via Google Maps.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complete & Leave Review Trigger */}
        <div className="p-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h5 className="font-sora font-bold text-xs text-[#172033]">Event Concluded?</h5>
            <p className="font-sora text-[10px] text-[#64748B]">Confirm completion to release escrow and rate chef</p>
          </div>
          <button
            onClick={() => navigate('/review/c4d3e2b1-0987-6543-21ba-fedcba987654')}
            className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-full font-sora text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            Confirm &amp; Review
          </button>
        </div>
      </div>
    </div>
  );
}
