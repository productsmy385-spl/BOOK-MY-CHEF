import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, CalendarDays, ClipboardList, LayoutDashboard, LogOut, Menu, Store, UserRound, UtensilsCrossed } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { Avatar, Drawer, cx } from '../ui';
import Brand from './Brand';
import NotificationBell from './NotificationBell';

const NAV = [
  { to: '/provider/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/provider/bookings', label: 'Bookings', icon: ClipboardList },
  { to: '/provider/services', label: 'Services', icon: Store },
  // Side navigation only; on mobile it is reached from the Services page and the menu drawer.
  { to: '/provider/menu', label: 'Food menu', icon: UtensilsCrossed, sideOnly: true },
  { to: '/provider/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/provider/profile', label: 'Profile', icon: UserRound },
];
const BOTTOM_NAV = NAV.filter((n) => !n.sideOnly);

export default function ProviderLayout() {
  const { account, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const inSetup = useLocation().pathname.startsWith('/provider/setup');

  const sideNav = (
    <nav className="flex flex-col gap-1" aria-label="Partner">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to}
          className={({ isActive }) => cx('flex items-center gap-3 px-3 h-10 rounded-sm text-[14px] font-medium',
            isActive ? 'bg-pale text-navy' : 'text-muted hover:text-ink hover:bg-canvas')}>
          <n.icon className="w-[18px] h-[18px]" aria-hidden /> {n.label}
        </NavLink>
      ))}
      <NavLink to="/provider/notifications"
        className={({ isActive }) => cx('flex items-center gap-3 px-3 h-10 rounded-sm text-[14px] font-medium',
          isActive ? 'bg-pale text-navy' : 'text-muted hover:text-ink hover:bg-canvas')}>
        <Bell className="w-[18px] h-[18px]" aria-hidden /> Notifications
      </NavLink>
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-line pt-safe">
        <div className="px-4 sm:px-6 h-16 flex items-center gap-3">
          <button className="btn-icon -ml-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu className="w-5 h-5" /></button>
          <Brand to="/provider/dashboard" suffix="Partner" />
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell to="/provider/notifications" />
            <Avatar src={account.avatarUrl} name={account.fullName} size={32} />
          </div>
        </div>
      </header>
      <div className="flex-1 flex">
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-line p-4 gap-6 sticky top-16 h-[calc(100vh-4rem)]">
          {sideNav}
          <button onClick={logout} className="mt-auto flex items-center gap-3 px-3 h-10 rounded-sm text-[14px] font-medium text-muted hover:text-danger">
            <LogOut className="w-[18px] h-[18px]" aria-hidden /> Sign out
          </button>
        </aside>
        <main className={cx('flex-1 min-w-0', !inSetup && 'pb-20 lg:pb-0')}>
          <Outlet />
        </main>
      </div>

      {!inSetup && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-line pb-safe" aria-label="Partner">
          <div className="grid grid-cols-5 h-16">
            {BOTTOM_NAV.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => cx('flex flex-col items-center justify-center gap-1 text-[11px] font-medium', isActive ? 'text-navy' : 'text-muted')}>
                <n.icon className="w-[22px] h-[22px]" aria-hidden /> {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        <div onClick={() => setMenuOpen(false)} className="flex flex-col gap-4">
          <div className="flex items-center gap-3 pb-4 border-b border-line">
            <Avatar src={account.avatarUrl} name={account.fullName} size={44} />
            <div className="min-w-0">
              <p className="t-h4 truncate">{account.fullName}</p>
              <p className="t-caption truncate">{account.email || account.phone}</p>
            </div>
          </div>
          {sideNav}
          <button onClick={logout} className="flex items-center gap-3 px-3 h-10 rounded-sm text-[14px] font-medium text-danger">
            <LogOut className="w-[18px] h-[18px]" aria-hidden /> Sign out
          </button>
        </div>
      </Drawer>
    </div>
  );
}
