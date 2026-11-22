import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/react';
import { useAuthStore } from '../../stores/useAuthStore';
import { ASSETS } from '../../assets/assetCatalog';
import AddressManagerModal from './modals/AddressManagerModal';
import EditProfileModal from './modals/EditProfileModal';
import DietaryPreferencesModal from './modals/DietaryPreferencesModal';
import PaymentMethodsModal from './modals/PaymentMethodsModal';
import HostSupportModal from './modals/HostSupportModal';
import TermsModal from './modals/TermsModal';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Modals state
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDietaryOpen, setIsDietaryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  let clerk = null;
  try {
    clerk = useClerk();
  } catch (e) {
    // Graceful fallback
  }

  const handleLogout = async () => {
    try {
      if (clerk && typeof clerk.signOut === 'function') {
        await clerk.signOut();
      } else if (typeof window !== 'undefined' && window.Clerk?.signOut) {
        await window.Clerk.signOut();
      }
    } catch (e) {
      console.warn('Clerk sign out error in customer profile:', e);
    }
    logout();
    navigate('/auth/welcome', { replace: true });
  };

  const settingsItems = [
    {
      id: 'addresses',
      label: 'Saved Addresses (Home & Venues)',
      icon: 'home_pin',
      action: () => setIsAddressOpen(true),
    },
    {
      id: 'payments',
      label: 'Payment Methods & Escrow Wallet',
      icon: 'credit_card',
      action: () => setIsPaymentOpen(true),
    },
    {
      id: 'dietary',
      label: 'Dietary Preferences & Allergens',
      icon: 'nutrition',
      action: () => setIsDietaryOpen(true),
    },
    {
      id: 'bookings',
      label: 'My Bookings & Event History',
      icon: 'event_available',
      action: () => navigate('/bookings'),
    },
    {
      id: 'support',
      label: 'Help Center & Host Support',
      icon: 'help',
      action: () => setIsSupportOpen(true),
    },
    {
      id: 'terms',
      label: 'Privacy Policy & Terms of Service',
      icon: 'policy',
      action: () => setIsTermsOpen(true),
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white font-sora">
      {/* Profile Card (Sharp Geometry: rounded-lg) */}
      <div className="p-6 rounded-lg bg-gradient-to-br from-[#E3F2FD] via-white to-[#E3F2FD] border border-[#90CAF9] shadow-xs flex flex-col items-center text-center mt-2 relative">
        <div className="w-20 h-20 rounded-md ring-2 ring-[#2196F3] overflow-hidden shadow-xs mb-3">
          <img src={user?.avatar || ASSETS.userAvatar} alt={user?.name || 'Customer'} className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="material-symbols-outlined text-[#2196F3] text-[16px]">verified</span>
          <span className="label-micro text-[#0D47A1]">Customer Account</span>
        </div>
        <h2 className="heading-3">{user?.name || 'Customer User'}</h2>
        <span className="text-xs text-[#2196F3] font-bold mt-0.5">{user?.phone || user?.email || ''}</span>
        <span className="text-xs text-[#64748B] flex items-center gap-1 mt-1 font-inter">
          <span className="material-symbols-outlined text-[14px]">location_on</span>
          {user?.location || 'Hyderabad'}
        </span>

        <button
          type="button"
          onClick={() => setIsEditProfileOpen(true)}
          className="mt-3 py-1.5 px-3 rounded-md bg-white border border-[#CBD5E1] hover:border-[#2196F3] text-[#0D47A1] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">edit</span>
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Account Settings List */}
      <div className="mt-4 flex flex-col gap-2 font-inter">
        {settingsItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className="w-full p-4 card-sharp hover:bg-[#F8FAFC] transition-colors flex items-center justify-between text-left text-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#2196F3] text-[20px]">{item.icon}</span>
              <span className="font-semibold text-[#172033] font-sora">{item.label}</span>
            </div>
            <span className="material-symbols-outlined text-[#64748B] text-[18px]">chevron_right</span>
          </button>
        ))}
      </div>

      {/* Join as Service Partner CTA */}
      <div className="mt-4 p-4 rounded-lg bg-[#E3F2FD] border border-[#90CAF9] flex flex-col gap-2">
        <h4 className="font-bold text-xs text-[#0D47A1]">Host or Cook for Events?</h4>
        <p className="text-xs text-[#172033] leading-relaxed font-inter">
          Create a separate Service Partner account as a Chef, Caterer, or Event Planner to manage reservations and receive guaranteed escrow payouts.
        </p>
        <button
          onClick={() => navigate('/auth/partner')}
          className="mt-1 py-2.5 btn-primary text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Register as Service Partner</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </button>
      </div>

      {/* Sign Out Button */}
      <div className="mt-4">
        <button
          onClick={handleLogout}
          className="btn-destructive w-full py-3.5 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out of Account</span>
        </button>
      </div>

      {/* Modals Mounted On-Page */}
      <AddressManagerModal isOpen={isAddressOpen} onClose={() => setIsAddressOpen(false)} />
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
      <DietaryPreferencesModal isOpen={isDietaryOpen} onClose={() => setIsDietaryOpen(false)} />
      <PaymentMethodsModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
      <HostSupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}
