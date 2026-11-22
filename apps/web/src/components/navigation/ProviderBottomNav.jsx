import React from 'react';
import { NavLink } from 'react-router-dom';

export default function ProviderBottomNav() {
  const navItems = [
    { label: 'Dashboard', path: '/provider', icon: 'dashboard' },
    { label: 'Services', path: '/provider/services', icon: 'restaurant_menu' },
    { label: 'Bookings', path: '/provider/bookings', icon: 'receipt_long' },
    { label: 'Calendar', path: '/provider/calendar', icon: 'calendar_today' },
    { label: 'Profile', path: '/provider/profile', icon: 'account_circle' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB] shadow-[0_-4px_20px_rgba(13,71,161,0.06)]">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/provider'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-all relative ${
                isActive ? 'text-[#0D47A1] font-bold' : 'text-[#64748B] hover:text-[#172033]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1 scale-110 text-[#0D47A1]' : ''} transition-transform`}>
                  {item.icon}
                </span>
                <span className="font-sora text-[11px] tracking-tight mt-0.5">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#0D47A1]"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
