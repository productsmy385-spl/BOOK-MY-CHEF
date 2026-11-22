import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { ASSETS } from '../../assets/assetCatalog';

export default function CustomerDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  if (!isOpen) return null;

  const navigateTo = (path) => {
    onClose();
    navigate(path);
  };

  const menuItems = [
    { label: 'My Profile', icon: 'person', path: '/profile' },
    { label: 'My Bookings', icon: 'event_available', path: '/bookings' },
    { label: 'Live Event Tracking', icon: 'schedule', path: '/tracking/c4d3e2b1-0987-6543-21ba-fedcba987654' },
    { label: 'Saved Providers', icon: 'favorite', path: '/favourites' },
    { label: 'Saved Addresses', icon: 'location_on', path: '/profile' },
    { label: 'Payments & Escrow Protection', icon: 'account_balance_wallet', path: '/profile' },
    { label: 'Notifications', icon: 'notifications', path: '/bookings' },
    { label: 'Help & Host Support', icon: 'support_agent', path: '/profile' },
    { label: 'Terms & Cancellation Policy', icon: 'description', path: '/profile' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex font-sora">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
        <div className="overflow-y-auto">
          {/* User Profile Header */}
          <div className="p-6 bg-gradient-to-br from-[#E3F2FD] via-white to-[#E3F2FD] border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-full ring-2 ring-[#2196F3] overflow-hidden shadow-md">
                <img src={user?.avatar || ASSETS.userAvatar} alt="Host Avatar" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#64748B] hover:text-[#172033] shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <h3 className="font-bold text-lg text-[#172033]">{user?.name || 'Customer'}</h3>
            <p className="text-xs text-[#2196F3] font-semibold">{user?.phone || ''}</p>
            <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {user?.location || 'Hyderabad'}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="py-2">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigateTo(item.path)}
                className="w-full flex items-center gap-3.5 px-6 py-3 text-left hover:bg-[#F1F5F9] transition-colors text-[#172033] text-sm"
              >
                <span className="material-symbols-outlined text-[20px] text-[#2196F3]">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Join as Partner Information Card (No Console Switching) */}
          <div className="p-4 mx-4 my-2 rounded-2xl bg-[#E3F2FD] border border-[#90CAF9]/60">
            <h4 className="font-bold text-xs text-[#0D47A1]">Are you a Chef or Caterer?</h4>
            <p className="text-[11px] text-[#172033] mt-0.5 leading-relaxed">
              Register as a verified Service Partner to list multi-service packages and earn guaranteed escrow payouts.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate('/auth/partner');
              }}
              className="mt-2.5 w-full py-2 bg-[#2196F3] hover:bg-[#1E88E5] text-white rounded-full text-xs font-semibold shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <span>Join as Service Partner</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Footer & Logout */}
        <div className="p-4 border-t border-[#E5E7EB] bg-white">
          <button 
            onClick={() => {
              onClose();
              logout();
              navigate('/auth/welcome');
            }}
            className="w-full flex items-center gap-2 text-sm text-[#EF4444] font-semibold px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
          <div className="text-[10px] text-[#64748B] text-center mt-2">
            BOOK MY CHEF • Role-Enforced Atelier v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
