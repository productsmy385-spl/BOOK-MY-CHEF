import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function CustomerBottomNav() {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/customer/home', altPath: '/', icon: 'home' },
    { label: 'Explore', path: '/explore', icon: 'explore' },
    { label: 'Bookings', path: '/bookings', icon: 'event_available' },
    { label: 'Favourites', path: '/favourites', icon: 'favorite' },
    { label: 'Profile', path: '/profile', icon: 'person' },
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
                isActive ? 'text-[#2196F3] font-bold' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1 scale-105 text-[#2196F3]' : ''} transition-transform`}>
                {item.icon}
              </span>
              <span className="font-sora text-[11px] tracking-tight mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-10 h-1 bg-[#2196F3] rounded-t-sm"></span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
