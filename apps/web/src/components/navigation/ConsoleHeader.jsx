import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClerk } from '@clerk/react';
import { useAuthStore } from '../../stores/useAuthStore';
import { ASSETS } from '../../assets/assetCatalog';

export default function ConsoleHeader({ onOpenDrawer }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userType, user, logout } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef(null);

  let clerk = null;
  try {
    clerk = useClerk();
  } catch (e) {
    // Graceful fallback if rendered outside ClerkProvider
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    try {
      if (clerk && typeof clerk.signOut === 'function') {
        await clerk.signOut();
      } else if (typeof window !== 'undefined' && window.Clerk?.signOut) {
        await window.Clerk.signOut();
      }
    } catch (e) {
      console.warn('Clerk sign out error:', e);
    }
    logout();
    navigate('/auth/welcome', { replace: true });
  };

  const isCustomer = userType === 'CUSTOMER';
  const isProvider = userType === 'PROVIDER';
  const isAdmin = userType === 'ADMIN';

  // Determine user avatar
  const avatarSrc = isProvider
    ? ASSETS.chefRaghavendraStudio
    : user?.avatar || ASSETS.userAvatar;

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs font-sora">
      <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between gap-3">
        {/* LEFT: Application Logo & Current Location Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              if (isCustomer) navigate('/customer/home');
              else if (isProvider) navigate('/provider/dashboard');
              else if (isAdmin) navigate('/admin');
              else navigate('/auth/welcome');
            }}
            className="flex-shrink-0 flex items-center gap-2.5 group text-left"
          >
            <div className="w-9 h-9 rounded-md bg-[#0D47A1] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <span className="material-symbols-outlined text-[#90CAF9] text-[20px]">restaurant</span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-sora font-extrabold text-[15px] tracking-tight text-[#172033] leading-none">
                BOOK MY CHEF
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#2196F3] font-bold mt-0.5 font-sora">
                Culinary Atelier
              </span>
            </div>
          </button>

          {/* Current Location Selector (Customers) */}
          {isCustomer && (
            <div
              className="flex flex-col min-w-0 cursor-pointer pl-3 border-l border-[#E5E7EB]"
              onClick={onOpenDrawer}
              title="Change Delivery / Event Address"
            >
              <div className="flex items-center gap-1 text-[#2196F3]">
                <span className="material-symbols-outlined text-[#2196F3] text-[18px]">location_on</span>
                <span className="font-sora font-semibold text-[13px] text-[#172033] truncate">
                  {user?.location || 'Jubilee Hills, Hyderabad'}
                </span>
                <span className="material-symbols-outlined text-[#64748B] text-[16px]">expand_more</span>
              </div>
              <span className="text-[10px] text-[#64748B] truncate font-inter">
                Luxury Dining &amp; Catering • Tap to switch
              </span>
            </div>
          )}

          {/* Partner Studio Badge */}
          {isProvider && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#E3F2FD] border border-[#90CAF9] rounded-md">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#0D47A1] font-sora truncate max-w-[140px] sm:max-w-xs">
                {user?.businessName || 'Partner Studio'}
              </span>
            </div>
          )}

          {/* Admin Portal Badge */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0D47A1] text-white rounded-md">
              <span className="material-symbols-outlined text-[14px] text-[#90CAF9]">shield</span>
              <span className="text-[11px] font-bold font-sora uppercase tracking-wider">
                Governance Portal
              </span>
            </div>
          )}
        </div>

        {/* RIGHT: Notifications & Profile Avatar with Role-Based Dropdown */}
        <div className="flex items-center gap-2 flex-shrink-0 relative" ref={dropdownRef}>
          {isAuthenticated ? (
            <>
              {/* Notifications Button */}
              <button
                onClick={() => {
                  if (isProvider) navigate('/provider/alerts');
                  else if (isAdmin) navigate('/admin/audit');
                  else navigate('/bookings');
                }}
                aria-label="Notifications"
                className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#E3F2FD] text-[#172033] transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white"></span>
              </button>

              {/* Profile Avatar Trigger */}
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Open Profile Menu"
                className="w-10 h-10 rounded-md ring-1 ring-[#CBD5E1] overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95"
              >
                <img
                  src={avatarSrc}
                  alt={user?.name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Strict Role-Based Profile Dropdown (Sharp Geometry: rounded-lg) */}
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sora">
                  {/* Dropdown Header: Account Details */}
                  <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-md overflow-hidden ring-1 ring-[#CBD5E1] flex-shrink-0">
                        <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-[#172033] truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-[10px] text-[#64748B] truncate font-inter">
                          {user?.email || user?.phone || ''}
                        </p>
                        <div className="mt-1">
                          <span
                            className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              isCustomer
                                ? 'bg-[#E3F2FD] text-[#0D47A1] border border-[#90CAF9]'
                                : isProvider
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-[#0D47A1] text-white'
                            }`}
                          >
                            {userType} ACCOUNT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Options Filtered by Role */}
                  <div className="py-1.5 text-xs text-[#172033]">
                    {/* Common: My Profile */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate(isProvider ? '/provider/profile' : isCustomer ? '/profile' : '/admin');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8FAFC] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#2196F3]">person</span>
                      <span>My Profile</span>
                    </button>

                    {/* Customers Only: My Bookings */}
                    {isCustomer && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/bookings');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8FAFC] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#2196F3]">
                          event_available
                        </span>
                        <span>My Bookings</span>
                      </button>
                    )}

                    {/* Providers Only: My Services */}
                    {isProvider && (
                      <>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/provider/services');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8FAFC] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px] text-[#0D47A1]">
                            restaurant_menu
                          </span>
                          <span>My Services &amp; Packages</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/provider/wallet');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8FAFC] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px] text-[#0D47A1]">
                            account_balance_wallet
                          </span>
                          <span>Escrow Wallet</span>
                        </button>
                      </>
                    )}

                    {/* Common: Settings */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate(isProvider ? '/provider/profile' : '/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8FAFC] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#64748B]">settings</span>
                      <span>Settings</span>
                    </button>

                    {/* Common: Help & Support */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate(isProvider ? '/provider/alerts' : '/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8FAFC] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#64748B]">
                        support_agent
                      </span>
                      <span>Help &amp; Support</span>
                    </button>

                    {/* Divider */}
                    <div className="my-1.5 border-t border-[#E5E7EB]"></div>

                    {/* Logout Option */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors font-bold"
                    >
                      <span className="material-symbols-outlined text-[18px] text-red-600">logout</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Unauthenticated Header State (Sharp Geometry: rounded-md) */
            <button
              onClick={() => navigate('/auth/welcome')}
              className="btn-navy py-2 px-4 text-xs font-bold"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
