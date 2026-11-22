import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';
import { useProviderStore } from '../../stores/useProviderStore';

export default function ProviderProfile() {
  const navigate = useNavigate();
  const { onboarding } = useProviderStore();

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white">
      {/* Profile Header */}
      <div className="p-6 rounded-lg bg-gradient-to-br from-[#E3F2FD] via-white to-[#E3F2FD] border border-[#90CAF9]/50 shadow-sm flex flex-col items-center text-center mt-2">
        <div className="w-20 h-20 rounded-md ring-2 ring-[#2196F3] overflow-hidden shadow-md mb-3 bg-white">
          <img src={ASSETS.chefRaghavendraStudio} alt="Chef Profile" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="material-symbols-outlined text-[#0D47A1] text-[16px] fill-1">verified</span>
          <span className="font-sora text-xs font-bold text-[#0D47A1]">Masterchef Verified</span>
        </div>
        <h2 className="font-sora font-extrabold text-lg text-[#172033]">{onboarding.basicInfo.fullName}</h2>
        <span className="font-sans text-xs text-[#2196F3] font-semibold">{onboarding.basicInfo.brandName}</span>
        <span className="font-sans text-[11px] text-[#64748B] mt-1">FSSAI: {onboarding.basicInfo.fssaiLicense}</span>
      </div>

      {/* Provider Business Options */}
      <div className="mt-4 flex flex-col gap-2">
        {[
          { label: 'Edit Atelier Profile & Bio', icon: 'edit', path: '/provider/onboarding/step-1' },
          { label: 'Manage Cuisines & Specializations', icon: 'restaurant', path: '/provider/onboarding/step-3' },
          { label: 'Pricing Architecture & Add-ons', icon: 'price_change', path: '/provider/onboarding/step-5' },
          { label: 'Service Areas & Travel Radius', icon: 'map', path: '/provider/onboarding/step-6' },
          { label: 'Weekly Schedule & Blocked Dates', icon: 'event', path: '/provider/calendar' },
          { label: 'Escrow Wallet & Payout Ledger', icon: 'account_balance_wallet', path: '/provider/wallet' },
          { label: 'FSSAI License & Government KYC', icon: 'badge', path: '/provider/onboarding/step-8' },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.path)}
            className="w-full p-4 rounded-md bg-white border border-[#E5E7EB] hover:bg-[#f8faff] transition-colors flex items-center justify-between text-left text-xs font-sans shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#2196F3] text-[20px]">{item.icon}</span>
              <span className="font-semibold text-[#172033]">{item.label}</span>
            </div>
            <span className="material-symbols-outlined text-[#64748B] text-[18px]">chevron_right</span>
          </button>
        ))}
      </div>
    </div>
  );
}
