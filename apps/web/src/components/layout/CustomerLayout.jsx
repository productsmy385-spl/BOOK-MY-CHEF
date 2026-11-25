import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, Briefcase, CalendarCheck, Compass, Heart, Home, LifeBuoy, LogOut, MapPin, Menu, PartyPopper, User, X } from 'lucide-react';
import { setPlanningEvent, usePlanningEvent } from '../../hooks/usePlanningEvent';
import { useAuthStore } from '../../stores/useAuthStore';
import { Avatar, Drawer, cx } from '../ui';
import Brand from './Brand';
import NotificationBell from './NotificationBell';

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/favourites', label: 'Favourites', icon: Heart },
  { to: '/profile', label: 'Profile', icon: User },
];
// Desktop header: the main tabs plus the event planner (on mobile it is in the menu drawer and on Home).
// "My events" appears from 1024px; between 768 and 1023px the header has room for only four links.
const DESKTOP_NAV = [NAV[0], NAV[1], { to: '/events', label: 'My events', icon: PartyPopper, wideOnly: true }, NAV[2], NAV[3]];

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL;

export default function CustomerLayout() {
  const { status, account, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const signedIn = status === 'ready';
  const location = useLocation();
  const hideBottomNav = location.pathname.startsWith('/book/');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-line pt-safe">
        <div className="page h-16 flex items-center gap-3">
          <button className="btn-icon -ml-2 md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <Brand />
          <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Main">
            {DESKTOP_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => cx('px-3 h-9 items-center rounded-sm text-[14px] font-medium transition-colors whitespace-nowrap',
                  n.wideOnly ? 'hidden lg:inline-flex' : 'inline-flex', isActive ? 'text-navy bg-pale' : 'text-muted hover:text-ink')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {signedIn ? (
              <>
                <NotificationBell />
                <Link to="/profile" className="hidden md:flex items-center gap-2 pl-2 pr-1 h-10 rounded-sm hover:bg-pale" aria-label="Your profile">
                  <Avatar src={account.avatarUrl} name={account.fullName} size={30} />
                  <span className="t-small font-medium max-w-[140px] truncate">{account.fullName}</span>
                </Link>
              </>
            ) : (
              status !== 'loading' && (
                <>
                  {/* Below 768px the header has no nav links, so there is room; 768–1023px it would overflow */}
                  <Link to="/auth/partner" className="btn btn-ghost btn-sm hidden sm:inline-flex md:hidden lg:inline-flex">Become a partner</Link>
                  <Link to="/auth/customer" className="btn btn-primary btn-sm">Sign in</Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      {signedIn && <PlanningBar path={location.pathname} />}

      <main className={cx('flex-1', !hideBottomNav && 'pb-20 md:pb-0')}>
        <Outlet />
      </main>

      {!hideBottomNav && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-line pb-safe" aria-label="Main">
          <div className="grid grid-cols-5 h-16">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => cx('flex flex-col items-center justify-center gap-1 text-[11px] font-medium',
                  isActive ? 'text-navy' : 'text-muted')}>
                {({ isActive }) => (
                  <>
                    <n.icon className={cx('w-[22px] h-[22px]', isActive && 'stroke-[2.4]')} aria-hidden />
                    {n.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        <div className="flex flex-col gap-1 -mx-2" onClick={() => setMenuOpen(false)}>
          {signedIn && (
            <div className="flex items-center gap-3 px-2 pb-4 mb-2 border-b border-line">
              <Avatar src={account.avatarUrl} name={account.fullName} size={44} />
              <div className="min-w-0">
                <p className="t-h4 truncate">{account.fullName}</p>
                <p className="t-caption truncate">{account.email || account.phone}</p>
              </div>
            </div>
          )}
          {signedIn ? (
            <>
              <MenuLink to="/events" icon={PartyPopper}>My events</MenuLink>
              <MenuLink to="/notifications" icon={Bell}>Notifications</MenuLink>
              <MenuLink to="/profile#addresses" icon={MapPin}>Saved addresses</MenuLink>
              <MenuLink to="/bookings" icon={CalendarCheck}>My bookings</MenuLink>
            </>
          ) : (
            <MenuLink to="/auth/customer" icon={User}>Sign in or create account</MenuLink>
          )}
          <MenuLink to="/auth/partner" icon={Briefcase}>Offer your services</MenuLink>
          {SUPPORT_EMAIL && (
            <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 px-2 h-11 rounded-sm hover:bg-pale t-body">
              <LifeBuoy className="w-5 h-5 text-muted" aria-hidden /> Help & support
            </a>
          )}
          {signedIn && (
            <button onClick={logout} className="flex items-center gap-3 px-2 h-11 rounded-sm hover:bg-pale t-body text-danger mt-2">
              <LogOut className="w-5 h-5" aria-hidden /> Sign out
            </button>
          )}
        </div>
      </Drawer>
    </div>
  );
}

/** While shopping for an event, keeps it in view; booking requests are then added to that event. */
function PlanningBar({ path }) {
  const ev = usePlanningEvent();
  if (!ev || !(path.startsWith('/explore') || path.startsWith('/p/') || path.startsWith('/book/'))) return null;
  return (
    <div className="bg-navy text-white">
      <div className="page h-11 flex items-center gap-2 t-small">
        <PartyPopper className="w-4 h-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">Planning for <strong>{ev.title}</strong></span>
        <Link to={`/events/${ev.id}`} className="font-semibold underline underline-offset-2 shrink-0">Back to event</Link>
        <button onClick={() => setPlanningEvent(null)} className="w-8 h-8 -mr-2 flex items-center justify-center shrink-0" aria-label="Stop planning for this event">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MenuLink({ to, icon: Icon, children }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-2 h-11 rounded-sm hover:bg-pale t-body">
      <Icon className="w-5 h-5 text-muted" aria-hidden /> {children}
    </Link>
  );
}
