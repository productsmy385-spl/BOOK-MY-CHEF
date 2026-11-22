import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';
import { useAuthStore } from '../../stores/useAuthStore';

export default function AuthWelcome() {
  const navigate = useNavigate();
  const { directSwitchAccountForDev } = useAuthStore();

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between max-w-lg mx-auto shadow-2xl relative overflow-hidden font-sora">
      {/* Decorative Top Culinary Banner */}
      <div className="relative h-72 w-full overflow-hidden">
        <img
          src={ASSETS.bannerRoyalBanquet}
          alt="Culinary Atelier"
          className="w-full h-full object-cover brightness-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>

        {/* Floating Brand Badge */}
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/60 shadow-md">
          <div className="w-6 h-6 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-xs">
            <span className="material-symbols-outlined text-[14px]">restaurant</span>
          </div>
          <span className="font-extrabold text-xs tracking-tight text-[#0D47A1]">BOOK MY CHEF</span>
        </div>
      </div>

      {/* Main Welcome Hero Content */}
      <div className="px-6 -mt-10 relative z-10 flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#2196F3] bg-[#E3F2FD] px-3 py-1 rounded-full border border-[#90CAF9]/60 inline-block mb-3">
            Culinary &amp; Event Atelier
          </span>
          <h1 className="font-sora font-extrabold text-2xl sm:text-3xl text-[#172033] tracking-tight leading-tight">
            Exceptional Dining,<br />Crafted for Your Moments
          </h1>
          <p className="text-xs text-[#64748B] mt-2.5 max-w-xs mx-auto leading-relaxed">
            Connect directly with verified master chefs, caterers, and luxury event artisans.
          </p>
        </div>

        {/* Primary Account Choice CTAs */}
        <div className="flex flex-col gap-3.5">
          {/* Option 1: Continue as Customer */}
          <button
            onClick={() => navigate('/auth/customer')}
            className="group w-full p-4 rounded-2xl bg-[#0D47A1] hover:bg-[#1565C0] text-white shadow-lg shadow-[#0D47A1]/20 transition-all active:scale-[0.98] flex items-center justify-between text-left border border-[#0D47A1]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">person</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Continue as Customer
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Host &amp; Dine</span>
                </h3>
                <p className="text-[11px] text-[#90CAF9] mt-0.5">
                  Book verified chefs, banquets, and event planners
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-white/80 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* Option 2: Join as Service Partner */}
          <button
            onClick={() => navigate('/auth/partner')}
            className="group w-full p-4 rounded-2xl bg-white hover:bg-[#f1f3ff] text-[#172033] border-2 border-[#2196F3] shadow-md shadow-[#2196F3]/10 transition-all active:scale-[0.98] flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#E3F2FD] border border-[#90CAF9] flex items-center justify-center text-[#0D47A1] flex-shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">soup_kitchen</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0D47A1] flex items-center gap-1.5">
                  Join as Service Partner
                  <span className="text-[10px] bg-[#E3F2FD] text-[#0D47A1] border border-[#90CAF9] px-2 py-0.5 rounded-full font-semibold">Professionals</span>
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Register as Chef, Caterer, Decorator or Event Manager
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-[#2196F3] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Quick Testing Bar for Instant Account Sign-In */}
        <div className="mt-8 pt-6 border-t border-[#E5E7EB] text-center">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2.5">
            Instant Test Login
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                directSwitchAccountForDev('CUSTOMER');
                navigate('/customer/home');
              }}
              className="px-3 py-1.5 rounded-full bg-[#f1f3ff] hover:bg-[#E3F2FD] border border-[#90CAF9]/60 text-[#0D47A1] text-xs font-semibold active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">person</span>
              <span>Customer Demo</span>
            </button>
            <button
              onClick={() => {
                directSwitchAccountForDev('PROVIDER');
                navigate('/provider/dashboard');
              }}
              className="px-3 py-1.5 rounded-full bg-[#f1f3ff] hover:bg-[#E3F2FD] border border-[#90CAF9]/60 text-[#0D47A1] text-xs font-semibold active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">restaurant</span>
              <span>Partner Demo</span>
            </button>
            <button
              onClick={() => {
                directSwitchAccountForDev('ADMIN');
                navigate('/admin');
              }}
              className="px-3 py-1.5 rounded-full bg-[#0D47A1] hover:bg-[#1565C0] text-white text-xs font-semibold active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span>Admin Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Restricted Admin Portal Link */}
      <div className="p-6 text-center bg-[#F8FAFC] border-t border-[#E5E7EB]">
        <button
          onClick={() => navigate('/admin/login')}
          className="text-xs font-semibold text-[#64748B] hover:text-[#0D47A1] transition-colors flex items-center justify-center gap-1.5 mx-auto"
        >
          <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
          <span>Authorized Platform Administrator Portal</span>
        </button>
        <p className="text-[10px] text-[#94A3B8] mt-1.5 font-sora">
          BOOK MY CHEF • Role-Enforced Enterprise Architecture
        </p>
      </div>
    </div>
  );
}
