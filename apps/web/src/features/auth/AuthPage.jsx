import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useClerkOtp } from '../../hooks/useClerkOtp';
import { homeFor, useAuthStore } from '../../stores/useAuthStore';
import { useCatalog } from '../../hooks/useCatalog';
import { isClerkConfigured } from '../../components/auth/ClerkAuthProvider';
import { Alert, Button, Checkbox, Field, Spinner, cx } from '../../components/ui';
import Brand from '../../components/layout/Brand';

const COPY = {
  CUSTOMER: {
    title: { register: 'Create your account', signin: 'Welcome back' },
    subtitle: 'Book chefs, caterers and event professionals near you.',
    switchTo: { to: '/auth/partner', label: 'Are you a chef or event professional? Join as a partner' },
  },
  PROVIDER: {
    title: { register: 'Join as a partner', signin: 'Partner sign in' },
    subtitle: 'Reach customers looking for your services. Set your own prices and schedule.',
    switchTo: { to: '/auth/customer', label: 'Looking to book a service? Continue as a customer' },
  },
  ADMIN: {
    title: { register: 'Accept your administrator invitation', signin: 'Administrator sign in' },
    subtitle: 'Access is by invitation only.',
  },
};

const MOBILE = /^(\+91[\s-]?)?[6-9]\d{9}$/;

export default function AuthPage({ role }) {
  if (!isClerkConfigured()) {
    return (
      <div className="min-h-screen flex flex-col bg-canvas">
        <header className="h-16 flex items-center px-4 sm:px-6 bg-white border-b border-line"><Brand /></header>
        <main className="flex-1 flex justify-center px-4 py-12">
          <div className="card p-6 sm:p-8 w-full max-w-[440px] flex flex-col gap-4">
            <h1 className="t-h2">{COPY[role].title.signin}</h1>
            <Alert tone="warning">Sign-in is temporarily unavailable. Please try again later.</Alert>
            <Link to="/" className="btn btn-outline">Browse the marketplace</Link>
          </div>
        </main>
      </div>
    );
  }
  return <AuthForm role={role} />;
}

function AuthForm({ role }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const { status, account, completeSignIn, logout } = useAuthStore();
  const clerk = useClerkOtp();
  const { categories } = useCatalog();
  const copy = COPY[role];

  const [mode, setMode] = useState(params.get('mode') === 'register' || role === 'PROVIDER' ? 'register' : 'signin');
  const [method, setMethod] = useState('code'); // 'code' | 'password'
  const [step, setStep] = useState('form');     // 'form' | 'code'
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', city: '', businessName: '', password: '', roles: [], terms: false });
  const [errors, setErrors] = useState({});
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [syncError, setSyncError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  useEffect(() => setErrors({}), [mode, method]);

  if (status === 'ready' && !busy) {
    return <Navigate to={next && account.userType !== 'ADMIN' ? next : homeFor(account.userType)} replace />;
  }

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (mode === 'register') {
      if (role !== 'ADMIN') {
        if (form.fullName.trim().length < 2) e.fullName = 'Enter your full name.';
        if (!MOBILE.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit Indian mobile number.';
        if (!form.city.trim()) e.city = role === 'PROVIDER' ? 'Enter your primary city.' : 'Enter your city.';
        if (!form.terms) e.terms = 'Please accept the terms to continue.';
      }
      if (role === 'PROVIDER' && form.roles.length === 0) e.roles = 'Choose at least one service you offer.';
      if (form.password.length < 8) e.password = 'Use at least 8 characters.';
    } else if (method === 'password' && !form.password) {
      e.password = 'Enter your password.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const finish = async () => {
    setBusy(true);
    setSyncError('');
    try {
      const acct = await completeSignIn({
        intendedRole: role,
        fullName: form.fullName.trim() || undefined,
        email: form.email.trim().toLowerCase(),
        phone: form.phone ? form.phone.replace(/\s/g, '') : undefined,
        city: form.city.trim() || undefined,
        businessName: form.businessName.trim() || undefined,
        roles: role === 'PROVIDER' ? form.roles : undefined,
      });
      const fresh = mode === 'register' && acct.userType === 'PROVIDER';
      navigate(fresh ? '/provider/setup' : next && acct.userType === 'CUSTOMER' ? next : homeFor(acct.userType), { replace: true });
    } catch (err) {
      setSyncError(err.message);
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    clerk.setErrorMessage('');
    if (!validate()) return;
    const email = form.email.trim().toLowerCase();
    if (mode === 'register') {
      const r = await clerk.sendSignUpEmailOtp(email, form.password, form.fullName);
      if (r.success) setStep('code');
    } else if (method === 'password') {
      const r = await clerk.signInWithPassword(email, form.password);
      if (r.success) await finish();
    } else {
      const r = await clerk.sendSignInEmailOtp(email);
      if (r.success) setStep('code');
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      clerk.setErrorMessage('Enter the 6-digit code from your email.');
      return;
    }
    const r = mode === 'register' ? await clerk.verifySignUpEmailOtp(code) : await clerk.verifySignInEmailOtp(code);
    if (r.success) await finish();
  };

  const resend = async () => {
    setCode('');
    const email = form.email.trim().toLowerCase();
    if (mode === 'register') await clerk.sendSignUpEmailOtp(email, form.password, form.fullName);
    else await clerk.sendSignInEmailOtp(email);
  };

  const toggleRole = (codeValue) =>
    setForm((f) => ({ ...f, roles: f.roles.includes(codeValue) ? f.roles.filter((r) => r !== codeValue) : [...f.roles, codeValue] }));

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="h-16 flex items-center px-4 sm:px-6 bg-white border-b border-line">
        <Brand to={role === 'ADMIN' ? '/admin/login' : '/'} />
      </header>
      <main className="flex-1 flex justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px]">
          <div className="card p-6 sm:p-8">
            {step === 'form' ? (
              <>
                <h1 className="t-h2">{copy.title[mode]}</h1>
                <p className="t-small text-muted mt-1.5">{copy.subtitle}</p>

                {!isClerkConfigured() && (
                  <Alert tone="warning" className="mt-5">Sign-in is temporarily unavailable. Please try again later.</Alert>
                )}

                <div className="grid grid-cols-2 mt-6 border border-line rounded-sm p-1 gap-1" role="tablist">
                  {['signin', 'register'].map((m) => (
                    <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                      className={cx('h-9 rounded-sm text-[14px] font-medium', mode === m ? 'bg-navy text-white' : 'text-muted hover:text-ink')}>
                      {m === 'signin' ? 'Sign in' : role === 'ADMIN' ? 'First time' : 'Create account'}
                    </button>
                  ))}
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4 mt-6" noValidate>
                  {mode === 'register' && role !== 'ADMIN' && (
                    <Field label="Full name" autoComplete="name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} required />
                  )}
                  {mode === 'register' && role === 'PROVIDER' && (
                    <Field label="Business or professional name" hint="Optional — shown to customers" value={form.businessName} onChange={set('businessName')} />
                  )}
                  <Field label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} error={errors.email} required />
                  {mode === 'register' && role !== 'ADMIN' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" value={form.phone} onChange={set('phone')} error={errors.phone} required />
                      <Field label={role === 'PROVIDER' ? 'Primary city' : 'City'} autoComplete="address-level2" value={form.city} onChange={set('city')} error={errors.city} required />
                    </div>
                  )}
                  {mode === 'register' && role === 'PROVIDER' && (
                    <fieldset>
                      <legend className="t-label mb-2">Services you offer <span className="text-danger">*</span></legend>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                          <button type="button" key={c.code} onClick={() => toggleRole(c.code)} aria-pressed={form.roles.includes(c.code)}
                            className={cx('chip', form.roles.includes(c.code) && 'chip-active')}>
                            {c.label}
                          </button>
                        ))}
                      </div>
                      {errors.roles && <p className="t-caption !text-danger mt-1.5">{errors.roles}</p>}
                    </fieldset>
                  )}
                  {(mode === 'register' || method === 'password') && (
                    <Field label="Password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      value={form.password} onChange={set('password')} error={errors.password}
                      hint={mode === 'register' ? 'At least 8 characters.' : undefined} required />
                  )}
                  {mode === 'register' && role !== 'ADMIN' && (
                    <div>
                      <Checkbox checked={form.terms} onChange={set('terms')} label="I agree to the Terms of Service and Privacy Policy" />
                      {errors.terms && <p className="t-caption !text-danger">{errors.terms}</p>}
                    </div>
                  )}

                  <Alert>{clerk.errorMessage || syncError}</Alert>
                  {syncError && <Button variant="outline" onClick={logout}>Sign out and start again</Button>}

                  <Button type="submit" size="lg" loading={clerk.isLoading || busy} disabled={!isClerkConfigured()}>
                    {mode === 'register' ? 'Send verification code' : method === 'code' ? 'Email me a sign-in code' : 'Sign in'}
                  </Button>
                  {mode === 'signin' && (
                    <button type="button" className="btn btn-ghost" onClick={() => setMethod(method === 'code' ? 'password' : 'code')}>
                      {method === 'code' ? 'Use password instead' : 'Use an email code instead'}
                    </button>
                  )}
                </form>
              </>
            ) : (
              <form onSubmit={verify} className="flex flex-col gap-4">
                <button type="button" className="btn btn-ghost btn-sm self-start -ml-3" onClick={() => { setStep('form'); setCode(''); clerk.setErrorMessage(''); }}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="w-12 h-12 rounded-full bg-pale text-navy flex items-center justify-center"><Mail className="w-6 h-6" /></div>
                <div>
                  <h1 className="t-h2">Check your email</h1>
                  <p className="t-small text-muted mt-1.5 break-words">We sent a 6-digit code to <strong className="text-ink">{form.email}</strong>.</p>
                </div>
                <Field label="Verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="[&_input]:tracking-[0.4em] [&_input]:text-[20px] [&_input]:font-semibold" autoFocus />
                <Alert>{clerk.errorMessage || syncError}</Alert>
                {syncError && <Button variant="outline" onClick={logout}>Sign out and start again</Button>}
                <Button type="submit" size="lg" loading={clerk.isLoading || busy}>Verify and continue</Button>
                <button type="button" className="btn btn-ghost" onClick={resend} disabled={clerk.isLoading}>Resend code</button>
              </form>
            )}
          </div>

          {copy.switchTo && (
            <Link to={copy.switchTo.to} className="block text-center t-small text-navy font-medium mt-5 hover:underline">{copy.switchTo.label}</Link>
          )}
          {role === 'ADMIN' && (
            <p className="flex items-center justify-center gap-1.5 t-caption mt-5"><ShieldCheck className="w-4 h-4" /> Sign-ins are verified and recorded.</p>
          )}
          {busy && <Spinner label="Setting up your account" />}
        </div>
      </main>
    </div>
  );
}
