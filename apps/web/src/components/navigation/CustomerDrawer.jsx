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
              <div className="w-14 h-14 rounded-md ring-2 ring-[#2196F3] overflow-hidden shadow-xs">
                <img src={user?.avatar || ASSETS.userAvatar} alt="Host Avatar" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#172033] shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <h3 className="heading-3">{user?.name || 'Customer'}</h3>
            <p className="text-xs text-[#2196F3] font-semibold mt-0.5">{user?.phone || ''}</p>
            <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1 font-inter">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {user?.location || 'Hyderabad'}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="py-2 font-inter">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigateTo(item.path)}
                className="w-full flex items-center gap-3.5 px-6 py-3 text-left hover:bg-[#F8FAFC] transition-colors text-[#172033] text-xs font-medium"
              >
                <span className="material-symbols-outlined text-[20px] text-[#2196F3]">
                  {item.icon}
                </span>
                <span className="font-sora">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Join as Partner Information Card (Sharp Geometry) */}
          <div className="p-4 mx-4 my-2 rounded-lg bg-[#E3F2FD] border border-[#90CAF9]">
            <h4 className="font-bold text-xs text-[#0D47A1]">Are you a Chef or Caterer?</h4>
            <p className="text-xs text-[#172033] mt-1 leading-relaxed font-inter">
              Register as a verified Service Partner to list multi-service packages and earn guaranteed escrow payouts.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate('/auth/partner');
              }}
              className="mt-3 w-full py-2.5 btn-primary text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Join as Service Partner</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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
            className="w-full flex items-center gap-2 text-xs text-[#DC2626] font-semibold px-3 py-2 rounded-md hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
          <div className="text-[10px] text-[#64748B] text-center mt-2 font-inter">
            BOOK MY CHEF • Role-Enforced Atelier v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
