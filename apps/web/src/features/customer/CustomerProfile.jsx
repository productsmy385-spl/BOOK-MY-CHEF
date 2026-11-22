import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { ASSETS } from '../../assets/assetCatalog';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/auth/welcome', { replace: true });
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white font-sora">
      {/* Profile Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E3F2FD] via-white to-[#E3F2FD] border border-[#90CAF9]/50 shadow-subtle flex flex-col items-center text-center mt-2">
        <div className="w-20 h-20 rounded-full ring-4 ring-[#2196F3] overflow-hidden shadow-md mb-3">
          <img src={user?.avatar || ASSETS.userAvatar} alt={user?.name || 'Customer'} className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="material-symbols-outlined text-[#2196F3] text-[16px]">verified</span>
          <span className="text-[11px] font-bold text-[#0D47A1] uppercase tracking-wider">Customer Account</span>
        </div>
        <h2 className="font-extrabold text-lg text-[#172033]">{user?.name || 'Customer User'}</h2>
        <span className="text-xs text-[#2196F3] font-bold mt-0.5">{user?.phone || ''}</span>
        <span className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[14px]">location_on</span>
          {user?.location || 'Hyderabad'}
        </span>
      </div>

      {/* Account Settings List */}
      <div className="mt-4 flex flex-col gap-2">
        {[
          { label: 'Saved Addresses (Home & Venues)', icon: 'home_pin', path: '/profile' },
          { label: 'Payment Methods & Escrow Wallet', icon: 'credit_card', path: '/profile' },
          { label: 'Dietary Preferences & Allergens', icon: 'nutrition', path: '/profile' },
          { label: 'Notifications & Alerts', icon: 'notifications', path: '/bookings' },
          { label: 'Help Center & Host Support', icon: 'help', path: '/profile' },
          { label: 'Privacy Policy & Terms of Service', icon: 'policy', path: '/profile' },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.path)}
            className="w-full p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:bg-[#f1f3ff] transition-colors flex items-center justify-between text-left text-xs shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#2196F3] text-[20px]">{item.icon}</span>
              <span className="font-semibold text-[#172033]">{item.label}</span>
            </div>
            <span className="material-symbols-outlined text-[#64748B] text-[18px]">chevron_right</span>
          </button>
        ))}
      </div>

      {/* Join as Service Partner CTA */}
      <div className="mt-4 p-4 rounded-2xl bg-[#E3F2FD] border border-[#90CAF9] flex flex-col gap-2">
        <h4 className="font-bold text-xs text-[#0D47A1]">Host or Cook for Events?</h4>
        <p className="text-[11px] text-[#172033] leading-relaxed">
          Create a separate Service Partner account as a Chef, Caterer, or Event Planner to manage reservations and receive guaranteed escrow payouts.
        </p>
        <button
          onClick={() => navigate('/auth/partner')}
          className="mt-1 py-2.5 bg-[#2196F3] hover:bg-[#1E88E5] text-white rounded-full text-xs font-semibold shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
        >
          <span>Register as Service Partner</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </button>
      </div>

      {/* Sign Out Button */}
      <div className="mt-4">
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out of Account</span>
        </button>
      </div>
    </div>
  );
}
