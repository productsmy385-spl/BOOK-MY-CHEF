import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProviderStore } from '../../stores/useProviderStore';
import { ASSETS } from '../../assets/assetCatalog';

export default function ProviderEventDay() {
  const navigate = useNavigate();
  const { eventChecklist, toggleChecklistStep } = useProviderStore();

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white">
      {/* Header */}
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-[#64748B] hover:text-[#172033]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h2 className="font-sora font-extrabold text-lg text-[#172033]">Live Event Execution</h2>
            <p className="font-sora text-xs text-[#2196F3] font-semibold">Today: 28 Nov • Ref: #BMC-8942-HYD</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-sora text-[10px] font-bold">
          ACTIVE TODAY
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Host Details Card */}
        <div className="p-4 rounded-2xl bg-[#0D47A1] text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/50 flex-shrink-0">
              <img src={ASSETS.userAvatar} alt="Host Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-sora font-bold text-sm text-white">Ananya Rao (Host)</h4>
              <p className="font-sora text-xs text-[#90CAF9]">Road No. 36, Jubilee Hills</p>
              <span className="font-sora text-[10px] text-white/80">Arrival OTP: 4892</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/provider/chat')}
              className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </button>
            <a
              href="tel:+919876543210"
              className="w-9 h-9 rounded-full bg-white text-[#0D47A1] flex items-center justify-center font-bold hover:bg-[#E3F2FD] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
            </a>
          </div>
        </div>

        {/* Real-time Checklist Stepper (Stitch Screen 22) */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
              Service Execution Milestones
            </span>
            <span className="font-sora text-[10px] text-[#2196F3] font-bold">Tap step to update</span>
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-[#E5E7EB]">
            {eventChecklist.map((step) => (
              <div
                key={step.id}
                onClick={() => toggleChecklistStep(step.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  step.completed
                    ? 'border-[#10B981] bg-[#10B981]/5 shadow-xs'
                    : 'border-[#E5E7EB] bg-white hover:border-[#90CAF9]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sora text-xs font-bold ${
                    step.completed ? 'bg-[#10B981] text-white' : 'bg-[#f1f3ff] text-[#64748B]'
                  }`}>
                    {step.completed ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div>
                    <h5 className={`font-sora text-xs font-bold ${step.completed ? 'text-[#172033] line-through opacity-80' : 'text-[#172033]'}`}>
                      {step.title}
                    </h5>
                    <span className="font-sora text-[10px] text-[#64748B]">Status: {step.timestamp}</span>
                  </div>
                </div>

                <span className={`material-symbols-outlined text-[20px] ${step.completed ? 'text-[#10B981]' : 'text-[#E5E7EB]'}`}>
                  {step.completed ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Confirmation Notice */}
        <div className="p-3.5 rounded-2xl bg-[#E3F2FD] border border-[#90CAF9] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#0D47A1] text-[22px]">verified_user</span>
          <p className="font-sora text-[11px] text-[#0D47A1] leading-relaxed">
            Completing all 6 steps triggers host confirmation prompt and initiates the automated escrow payout release to your wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
