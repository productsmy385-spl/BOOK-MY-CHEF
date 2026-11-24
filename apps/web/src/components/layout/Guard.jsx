import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeFor, useAuthStore } from '../../stores/useAuthStore';
import { Alert, Button, Spinner } from '../ui';

/**
 * Route guard driven by the server-confirmed account. UI hiding is a
 * convenience only; every API call is authorized again by the backend.
 */
export default function Guard({ roles }) {
  const { status, account, error, logout, refresh } = useAuthStore();
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);

  if (status === 'loading') return <Spinner label="Loading your account" className="min-h-[50vh]" />;
  if (status === 'signedOut') {
    const target = roles.includes('ADMIN') ? '/admin/login' : roles.includes('PROVIDER') ? '/auth/partner' : '/auth/customer';
    return <Navigate to={`${target}?next=${next}`} replace />;
  }
  if (status === 'needsSync') return <Navigate to={`/auth/complete?next=${next}`} replace />;
  if (status === 'blocked' || status === 'error') {
    return (
      <div className="page max-w-md py-16 flex flex-col gap-4">
        <Alert tone={status === 'blocked' ? 'warning' : 'error'}>
          {status === 'blocked' ? error || 'This account is suspended.' : error || 'We could not load your account.'}
        </Alert>
        <div className="flex gap-2">
          {status === 'error' && <Button onClick={refresh}>Try again</Button>}
          <Button variant="outline" onClick={logout}>Sign out</Button>
        </div>
      </div>
    );
  }
  if (!roles.includes(account.userType)) return <Navigate to={homeFor(account.userType)} replace />;
  return <Outlet />;
}

/** Sends signed-in providers/admins to their own console; others see the public marketplace. */
export function MarketplaceOnly() {
  const { status, account } = useAuthStore();
  if (status === 'ready' && account.userType !== 'CUSTOMER') return <Navigate to={homeFor(account.userType)} replace />;
  if (status === 'needsSync') return <Navigate to="/auth/complete" replace />;
  return <Outlet />;
}
