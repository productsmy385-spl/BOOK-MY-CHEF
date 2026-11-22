import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleAdminLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const navLinks = [
    { label: 'Overview Dashboard', path: '/admin', icon: 'dashboard', end: true },
    { label: 'Provider KYC Verification', path: '/admin/verification', icon: 'verified_user', badge: '14' },
    { label: 'Booking Lifecycle & Disputes', path: '/admin/bookings', icon: 'receipt_long' },
    { label: 'Financials & Escrow Payouts', path: '/admin/finance', icon: 'account_balance_wallet' },
    { label: 'Customer Management', path: '/admin/users', icon: 'group' },
    { label: 'System Audit Logs', path: '/admin/audit', icon: 'history' },
  ];

  return (
    <div className="flex w-full min-h-screen bg-[#F8FAFC] font-sora">
      {/* Persistent Desktop Sidebar */}
      <aside className="w-64 bg-[#0D47A1] text-white flex flex-col justify-between hidden md:flex flex-shrink-0 shadow-xl">
        <div>
          {/* Admin Header */}
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0D47A1] font-bold">
              <span className="material-symbols-outlined text-[20px] text-[#2196F3]">shield</span>
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white">ATELIER ADMIN</h1>
              <span className="text-[10px] uppercase tracking-wider text-[#90CAF9] font-semibold">Governance Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs transition-all ${
                    isActive
                      ? 'bg-[#2196F3] text-white font-bold shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-2 py-0.5 rounded-sm bg-[#EF4444] text-white text-[10px] font-bold">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Admin User Footer with Logout */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center text-xs font-bold text-white">
              SA
            </div>
            <div className="truncate">
              <p className="font-bold text-xs text-white truncate">{user?.name || 'Super Administrator'}</p>
              <p className="text-[10px] text-[#90CAF9] truncate">{user?.email || 'superadmin@atelier.in'}</p>
            </div>
          </div>
          <button
            onClick={handleAdminLogout}
            title="Log Out of Admin Portal"
            className="text-white/70 hover:text-red-300 p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
