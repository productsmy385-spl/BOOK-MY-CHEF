import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { homeFor, useAuthStore } from '../../stores/useAuthStore';
import { useCatalog } from '../../hooks/useCatalog';
import { Alert, Button, Field, Spinner, cx } from '../../components/ui';
import Brand from '../../components/layout/Brand';

/** Shown when a Clerk session exists but the Book My Chef account was never set up. */
export default function CompleteAccount() {
  const { status, account, completeSignIn, logout } = useAuthStore();
  const { categories } = useCatalog();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState('CUSTOMER');
  const [form, setForm] = useState({ fullName: '', phone: '', city: '', roles: [] });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'loading') return <Spinner className="min-h-screen" />;
  if (status === 'ready' && !busy) return <Navigate to={homeFor(account.userType)} replace />;
  if (status !== 'needsSync' && !busy) return <Navigate to="/auth/customer" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2) return setError('Enter your full name.');
    if (!form.city.trim()) return setError('Enter your city.');
    if (role === 'PROVIDER' && !form.roles.length) return setError('Choose at least one service you offer.');
    setBusy(true);
    setError('');
    try {
      const acct = await completeSignIn({ intendedRole: role, fullName: form.fullName.trim(), phone: form.phone || undefined,
        city: form.city.trim(), roles: role === 'PROVIDER' ? form.roles : undefined });
      navigate(acct.userType === 'PROVIDER' ? '/provider/setup' : params.get('next') || homeFor(acct.userType), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="h-16 flex items-center px-4 sm:px-6 bg-white border-b border-line"><Brand /></header>
      <main className="flex justify-center px-4 py-10">
        <form onSubmit={submit} className="card p-6 sm:p-8 w-full max-w-[440px] flex flex-col gap-4">
          <div>
            <h1 className="t-h2">Finish setting up</h1>
            <p className="t-small text-muted mt-1.5">Your email is verified. Tell us how you will use Book My Chef.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[['CUSTOMER', 'Book services'], ['PROVIDER', 'Offer services']].map(([v, l]) => (
              <button type="button" key={v} onClick={() => setRole(v)} aria-pressed={role === v}
                className={cx('h-12 rounded-sm border text-[14px] font-medium', role === v ? 'border-brand bg-pale text-navy' : 'border-line text-muted')}>{l}</button>
            ))}
          </div>
          <Field label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <Field label="Mobile number" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Field label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          {role === 'PROVIDER' && (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button type="button" key={c.code} aria-pressed={form.roles.includes(c.code)}
                  onClick={() => setForm((f) => ({ ...f, roles: f.roles.includes(c.code) ? f.roles.filter((r) => r !== c.code) : [...f.roles, c.code] }))}
                  className={cx('chip', form.roles.includes(c.code) && 'chip-active')}>{c.label}</button>
              ))}
            </div>
          )}
          <Alert>{error}</Alert>
          <Button type="submit" size="lg" loading={busy}>Continue</Button>
          <Button variant="ghost" onClick={logout}>Sign out</Button>
        </form>
      </main>
    </div>
  );
}
