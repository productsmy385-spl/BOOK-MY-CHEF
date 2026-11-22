import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function ProviderBottomNav() {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/provider/dashboard', altPath: '/provider', icon: 'dashboard' },
    { label: 'Services', path: '/provider/services', icon: 'restaurant_menu' },
    { label: 'Bookings', path: '/provider/bookings', icon: 'receipt_long' },
    { label: 'Calendar', path: '/provider/calendar', icon: 'calendar_today' },
    { label: 'Profile', path: '/provider/profile', icon: 'account_circle' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white border-t border-[#E5E7EB] shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.altPath && location.pathname === item.altPath);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[56px] h-full transition-all relative ${
                isActive ? 'text-[#0D47A1] font-bold' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1 scale-105 text-[#0D47A1]' : ''} transition-transform`}>
                {item.icon}
              </span>
              <span className="font-sora text-[11px] tracking-tight mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-10 h-1 bg-[#0D47A1] rounded-t-sm"></span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
