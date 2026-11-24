import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, BarChart3, CalendarRange, FileText, Gauge, GalleryHorizontal, Images, IndianRupee, LogOut, Megaphone, Menu, ScrollText, Settings, ShieldCheck, Star, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCatalog } from '../../hooks/useCatalog';
import { BOOKING_STATUS, dateLabel, money, relativeTime, VERIFICATION } from '../../lib/format';
import { Alert, Badge, Button, Drawer, EmptyState, Field, Modal, PageHeader, Pager, Spinner, Stat, cx } from '../../components/ui';
import Brand from '../../components/layout/Brand';

const NAV = [
  { to: '/admin', label: 'Overview', icon: Gauge, end: true },
  { to: '/admin/providers', label: 'Providers', icon: BadgeCheck },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarRange },
  { to: '/admin/campaigns', label: 'Campaigns', icon: GalleryHorizontal },
  { to: '/admin/promotions', label: 'Provider promotions', icon: Megaphone },
  { to: '/admin/featured', label: 'Featured providers', icon: Star },
  { to: '/admin/banner-analytics', label: 'Banner analytics', icon: BarChart3 },
  { to: '/admin/media', label: 'Images', icon: Images },
  { to: '/admin/finance', label: 'Finance', icon: IndianRupee, roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] },
  { to: '/admin/team', label: 'Admin team', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText, roles: ['SUPER_ADMIN'] },
];

export function AdminLayout() {
  const { account, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.roles || n.roles.includes(account.adminRole));
  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Administration">
      {items.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
          className={({ isActive }) => cx('flex items-center gap-3 px-3 h-10 rounded-sm text-[14px] font-medium', isActive ? 'bg-pale text-navy' : 'text-muted hover:text-ink hover:bg-canvas')}>
          <n.icon className="w-[18px] h-[18px]" aria-hidden />{n.label}
        </NavLink>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-line h-16 flex items-center gap-3 px-4 sm:px-6">
        <button className="btn-icon -ml-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="w-5 h-5" /></button>
        <Brand to="/admin" suffix="Admin" />
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:block t-small text-muted truncate max-w-[220px]">{account.fullName} · {account.adminRole?.replace('_', ' ').toLowerCase()}</span>
          <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>Sign out</Button>
        </div>
      </header>
      <div className="flex-1 flex">
        <aside className="hidden lg:block w-56 shrink-0 border-r border-line p-4 sticky top-16 h-[calc(100vh-4rem)]">{nav}</aside>
        <main className="flex-1 min-w-0 px-4 sm:px-6 pb-12"><Outlet /></main>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title="Administration" side="left">{nav}</Drawer>
    </div>
  );
}

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

function Table({ head, children }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full t-small min-w-[640px]">
        <thead className="bg-canvas"><tr className="text-left">{head.map((h) => <th key={h} className="px-3 py-2.5 font-medium text-muted whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------ overview

export function AdminDashboard() {
  const { data: d, isLoading, error } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: api.admin.dashboard });
  if (isLoading) return <Spinner />;
  if (error) return <Alert className="mt-6">{error.message}</Alert>;
  return (
    <>
      <PageHeader title="Platform overview" subtitle="Live figures from the database." />
      <h2 className="t-h4 mb-3">People</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Customers" value={d.customers} />
        <Stat label="Providers" value={d.providers} hint={`${d.publishedProviders} published`} />
        <Stat label="Verified providers" value={d.verifiedProviders} />
        <Stat label="Pending verifications" value={d.pendingVerifications} />
      </div>
      <h2 className="t-h4 mt-6 mb-3">Bookings</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total" value={d.totalBookings} />
        <Stat label="Active" value={d.activeBookings} />
        <Stat label="Completed" value={d.completedBookings} />
        <Stat label="Cancelled" value={d.cancelledBookings} />
      </div>
      <h2 className="t-h4 mt-6 mb-3">Revenue</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Completed booking value" value={money(d.completedBookingValue)} />
        <Stat label={`Commission at ${d.commissionRate}%`} value={money(d.estimatedCommission)} hint="Calculated on completed bookings" />
        <Stat label="Open disputes" value={d.openDisputes} />
      </div>
    </>
  );
}

// ------------------------------------------------------------------ providers & verification

export function AdminProviders() {
  const [verification, setVerification] = useState('PENDING');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState(null);
  const dq = useDebounced(q);
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'providers', verification, dq, page],
    queryFn: () => api.admin.providers({ verification, q: dq, page }), placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader title="Providers & verification" />
      <div className="flex flex-wrap gap-2 mb-4">
        <Field as="select" value={verification} onChange={(e) => { setVerification(e.target.value); setPage(0); }} aria-label="Verification status" className="w-48">
          <option value="">All providers</option>
          {Object.entries(VERIFICATION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Field>
        <Field type="search" placeholder="Name, city, email, phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Search" className="flex-1 min-w-[200px]" />
      </div>
      {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.items.length ? <EmptyState title="No providers found" /> : (
        <Table head={['Provider', 'City', 'Listing', 'Verification', 'Documents', 'Bookings', 'Joined']}>
          {data.items.map((p) => (
            <tr key={p.id} className="hover:bg-canvas cursor-pointer" onClick={() => setOpenId(p.id)}>
              <td className="px-3 py-2.5"><p className="font-medium">{p.businessName || p.name}</p><p className="t-caption">{p.email || p.phone}</p></td>
              <td className="px-3 py-2.5">{p.city || '—'}</td>
              <td className="px-3 py-2.5">{p.onboardingStatus.toLowerCase()}</td>
              <td className="px-3 py-2.5"><Badge tone={VERIFICATION[p.verificationStatus].tone}>{VERIFICATION[p.verificationStatus].label}</Badge></td>
              <td className="px-3 py-2.5 tabular-nums">{p.documentCount}</td>
              <td className="px-3 py-2.5 tabular-nums">{p.bookingCount}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{dateLabel(p.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
      {data && <Pager page={page} size={data.size} total={data.total} onChange={setPage} />}
      <ProviderReview id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

function ProviderReview({ id, onClose }) {
  const qc = useQueryClient();
  const catalog = useCatalog();
  const { data: p, isLoading } = useQuery({ queryKey: ['admin', 'provider', id], queryFn: () => api.admin.provider(id), enabled: !!id });
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState('');
  const verify = useMutation({
    mutationFn: () => api.admin.verify(id, decision, note || undefined),
    onSuccess: (data) => { qc.setQueryData(['admin', 'provider', id], data); qc.invalidateQueries({ queryKey: ['admin'] }); setDecision(null); setNote(''); },
  });
  if (!id) return null;
  return (
    <Drawer open onClose={onClose} title="Provider review">
      {isLoading || !p ? <Spinner /> : (
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="t-h3">{p.businessName || p.name}</h3>
            <p className="t-small text-muted">{p.account.email} · {p.account.phone || 'no phone'} · account {p.account.accountStatus.toLowerCase()}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge tone={VERIFICATION[p.verificationStatus].tone}>{VERIFICATION[p.verificationStatus].label}</Badge>
              <Badge>{p.onboardingStatus.toLowerCase()}</Badge>
              {p.categories.map((c) => <Badge key={c} tone="blue">{catalog.categoryLabel(c)}</Badge>)}
            </div>
          </div>
          {p.bio && <p className="t-small whitespace-pre-line break-words">{p.bio}</p>}
          <dl className="grid grid-cols-2 gap-3 t-small">
            <div><dt className="t-caption">Location</dt><dd>{[p.locality, p.city].filter(Boolean).join(', ') || '—'}</dd></div>
            <div><dt className="t-caption">Experience</dt><dd>{p.experienceYears} years</dd></div>
            <div><dt className="t-caption">FSSAI licence</dt><dd>{p.fssaiLicenseNumber || '—'}</dd></div>
            <div><dt className="t-caption">Services</dt><dd>{p.services.length}</dd></div>
          </dl>
          <section>
            <h4 className="t-h4 mb-2">Documents</h4>
            {!p.documents.length ? <p className="t-small text-muted">No documents submitted.</p> : (
              <ul className="flex flex-col gap-2">
                {p.documents.map((d) => (
                  <li key={d.id} className="panel p-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted shrink-0" />
                    <a href={d.url} target="_blank" rel="noreferrer" className="t-small text-navy hover:underline truncate flex-1">{d.documentType} · {d.fileName}</a>
                    <Badge tone={d.status === 'APPROVED' ? 'green' : d.status === 'REJECTED' ? 'red' : 'amber'}>{d.status.toLowerCase()}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="flex flex-wrap gap-2">
            {p.verificationStatus !== 'VERIFIED' && p.verificationStatus !== 'SUSPENDED' && <Button onClick={() => setDecision('APPROVE')}>Approve</Button>}
            {p.verificationStatus === 'PENDING' && <Button variant="danger" onClick={() => setDecision('REJECT')}>Reject</Button>}
            {p.verificationStatus !== 'SUSPENDED' && <Button variant="danger" onClick={() => setDecision('SUSPEND')}>Suspend</Button>}
            {['SUSPENDED', 'REJECTED'].includes(p.verificationStatus) && <Button variant="outline" onClick={() => setDecision('REINSTATE')}>Reinstate as verified</Button>}
            <a href={`/p/${p.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost">Public profile</a>
          </div>
          <Modal open={!!decision} onClose={() => setDecision(null)} title={`${decision?.[0]}${decision?.slice(1).toLowerCase()} this provider?`}
            footer={<><Button variant="outline" onClick={() => setDecision(null)}>Back</Button>
              <Button variant={decision === 'APPROVE' || decision === 'REINSTATE' ? 'primary' : 'navy'} loading={verify.isPending}
                disabled={(decision === 'REJECT' || decision === 'SUSPEND') && !note.trim()} onClick={() => verify.mutate()}>Confirm</Button></>}>
            <Field as="textarea" rows={3} label={decision === 'REJECT' || decision === 'SUSPEND' ? 'Reason (sent to the provider)' : 'Note (optional)'}
              value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
            <p className="t-caption mt-2">This action is recorded in the audit log.</p>
            <Alert className="mt-3">{verify.error?.message}</Alert>
          </Modal>
        </div>
      )}
    </Drawer>
  );
}

// ------------------------------------------------------------------ customers

export function AdminCustomers() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const dq = useDebounced(q);
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'customers', dq, status, page], queryFn: () => api.admin.customers({ q: dq, status, page }), placeholderData: keepPreviousData });
  const change = useMutation({
    mutationFn: () => api.admin.setUserStatus(target.id, target.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE', reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'customers'] }); setTarget(null); setReason(''); },
  });
  return (
    <>
      <PageHeader title="Customers" />
      <div className="flex flex-wrap gap-2 mb-4">
        <Field as="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="Account status" className="w-40">
          <option value="">All</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option>
        </Field>
        <Field type="search" placeholder="Name, email, phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Search" className="flex-1 min-w-[200px]" />
      </div>
      {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.items.length ? <EmptyState title="No customers found" /> : (
        <Table head={['Customer', 'City', 'Bookings', 'Completed', 'Joined', 'Status', '']}>
          {data.items.map((c) => (
            <tr key={c.id}>
              <td className="px-3 py-2.5"><p className="font-medium">{c.name}</p><p className="t-caption">{c.email || c.phone}</p></td>
              <td className="px-3 py-2.5">{c.city || '—'}</td>
              <td className="px-3 py-2.5 tabular-nums">{c.bookingCount}</td>
              <td className="px-3 py-2.5 tabular-nums">{c.completedCount}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{dateLabel(c.createdAt)}</td>
              <td className="px-3 py-2.5"><Badge tone={c.accountStatus === 'ACTIVE' ? 'green' : 'red'}>{c.accountStatus.toLowerCase()}</Badge></td>
              <td className="px-3 py-2.5 text-right">{c.accountStatus !== 'DELETED' && <Button variant="ghost" size="sm" onClick={() => setTarget(c)}>{c.accountStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}</Button>}</td>
            </tr>
          ))}
        </Table>
      )}
      {data && <Pager page={page} size={data.size} total={data.total} onChange={setPage} />}
      <Modal open={!!target} onClose={() => setTarget(null)} title={target?.accountStatus === 'ACTIVE' ? `Suspend ${target?.name}?` : `Reactivate ${target?.name}?`}
        footer={<><Button variant="outline" onClick={() => setTarget(null)}>Back</Button><Button variant="navy" disabled={!reason.trim()} loading={change.isPending} onClick={() => change.mutate()}>Confirm</Button></>}>
        <Field as="textarea" rows={3} label="Reason (recorded in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
        <Alert className="mt-3">{change.error?.message}</Alert>
      </Modal>
    </>
  );
}

// ------------------------------------------------------------------ bookings

export function AdminBookings() {
  const catalog = useCatalog();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const dq = useDebounced(q);
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'bookings', status, dq, page], queryFn: () => api.admin.bookings({ status, q: dq, page }), placeholderData: keepPreviousData });
  return (
    <>
      <PageHeader title="Bookings" />
      <div className="flex flex-wrap gap-2 mb-4">
        <Field as="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="Status" className="w-52">
          <option value="">All statuses</option>
          {Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Field>
        <Field type="search" placeholder="Reference, provider or customer" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Search" className="flex-1 min-w-[200px]" />
      </div>
      {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.items.length ? <EmptyState title="No bookings found" /> : (
        <Table head={['Reference', 'Service', 'Customer', 'Provider', 'Event date', 'Amount', 'Status']}>
          {data.items.map((b) => (
            <tr key={b.id}>
              <td className="px-3 py-2.5 font-mono text-[12px] whitespace-nowrap">{b.reference}</td>
              <td className="px-3 py-2.5"><p>{b.serviceTitle}</p><p className="t-caption">{catalog.categoryLabel(b.category)}</p></td>
              <td className="px-3 py-2.5">{b.customerName}</td>
              <td className="px-3 py-2.5">{b.providerName}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{dateLabel(b.eventDate)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{money(b.finalAmount ?? b.estimatedTotal)}</td>
              <td className="px-3 py-2.5"><Badge tone={BOOKING_STATUS[b.status]?.tone}>{BOOKING_STATUS[b.status]?.label || b.status}</Badge></td>
            </tr>
          ))}
        </Table>
      )}
      {data && <Pager page={page} size={data.size} total={data.total} onChange={setPage} />}
    </>
  );
}

// ------------------------------------------------------------------ finance

export function AdminFinance() {
  const { data: d, isLoading, error } = useQuery({ queryKey: ['admin', 'finance'], queryFn: api.admin.finance });
  if (isLoading) return <Spinner />;
  if (error) return <Alert className="mt-6">{error.message}</Alert>;
  return (
    <>
      <PageHeader title="Finance" subtitle={`Commission rate ${d.commissionRate}% (change it in Settings).`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Completed booking value" value={money(d.completedBookingValue)} />
        <Stat label="Online payments captured" value={money(d.paymentsCaptured)} hint={`${d.paymentsCount} payments`} />
        <Stat label="Refunded" value={money(d.refunded)} />
      </div>
      <h2 className="t-h4 mt-8 mb-3">Last 6 months (completed bookings)</h2>
      {!d.monthly.length ? <p className="panel p-4 t-small text-muted">No completed bookings in this period.</p> : (
        <Table head={['Month', 'Completed bookings', 'Booking value', 'Commission']}>
          {d.monthly.map((m) => (
            <tr key={m.month}><td className="px-3 py-2.5">{m.month}</td><td className="px-3 py-2.5 tabular-nums">{m.completedBookings}</td>
              <td className="px-3 py-2.5">{money(m.bookingValue)}</td><td className="px-3 py-2.5">{money(m.commission)}</td></tr>
          ))}
        </Table>
      )}
    </>
  );
}

// ------------------------------------------------------------------ team

const ADMIN_ROLES = { SUPER_ADMIN: 'Super admin — everything', OPS_ADMIN: 'Operations — users, bookings, verification', VERIFICATION_ADMIN: 'Verification — provider review', FINANCE_ADMIN: 'Finance — revenue reports' };

export function AdminTeam() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'team'], queryFn: api.admin.team });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('OPS_ADMIN');
  const [notice, setNotice] = useState('');
  const invite = useMutation({
    mutationFn: () => api.admin.invite(email.trim(), role),
    onSuccess: (r) => { setNotice(r.emailSent ? `Invitation emailed to ${email}.` : `Invitation saved for ${email}. Email delivery isn't configured — ask them to sign up on the admin sign-in page with this email.`); setEmail(''); qc.invalidateQueries({ queryKey: ['admin', 'team'] }); },
  });
  const revoke = useMutation({ mutationFn: (id) => api.admin.revokeInvite(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'team'] }) });
  if (isLoading) return <Spinner />;
  if (error) return <Alert className="mt-6">{error.message}</Alert>;
  return (
    <>
      <PageHeader title="Admin team" subtitle="Administrators join only by invitation." />
      <section className="card p-5 max-w-2xl">
        <h2 className="t-h4 mb-3">Invite an administrator</h2>
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); setNotice(''); invite.mutate(); }}>
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field as="select" label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(ADMIN_ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Field>
          <Button type="submit" className="self-start" loading={invite.isPending} disabled={!/^\S+@\S+\.\S+$/.test(email)}>Send invitation</Button>
          <Alert tone="success">{notice}</Alert>
          <Alert>{invite.error?.message}</Alert>
        </form>
      </section>
      <h2 className="t-h4 mt-8 mb-3">Administrators</h2>
      <Table head={['Name', 'Email', 'Role', 'Status', 'Since']}>
        {data.admins.map((a) => (
          <tr key={a.id}><td className="px-3 py-2.5">{a.name}</td><td className="px-3 py-2.5">{a.email}</td><td className="px-3 py-2.5">{a.role}</td>
            <td className="px-3 py-2.5">{a.status.toLowerCase()}</td><td className="px-3 py-2.5">{dateLabel(a.since)}</td></tr>
        ))}
      </Table>
      <h2 className="t-h4 mt-8 mb-3">Invitations</h2>
      {!data.invitations.length ? <p className="t-small text-muted">No invitations yet.</p> : (
        <Table head={['Email', 'Role', 'Status', 'Expires', '']}>
          {data.invitations.map((i) => (
            <tr key={i.id}><td className="px-3 py-2.5">{i.email}</td><td className="px-3 py-2.5">{i.role}</td><td className="px-3 py-2.5">{i.status.toLowerCase()}</td>
              <td className="px-3 py-2.5">{dateLabel(i.expiresAt)}</td>
              <td className="px-3 py-2.5 text-right">{i.status === 'PENDING' && <Button variant="ghost" size="sm" loading={revoke.isPending} onClick={() => revoke.mutate(i.id)}>Revoke</Button>}</td></tr>
          ))}
        </Table>
      )}
    </>
  );
}

// ------------------------------------------------------------------ settings & audit

export function AdminSettings() {
  const { account } = useAuthStore();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'settings'], queryFn: api.admin.settings });
  const [draft, setDraft] = useState({});
  const save = useMutation({ mutationFn: ({ key, value }) => api.admin.updateSetting(key, value), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'settings'] }); setDraft({}); } });
  const canEdit = account.adminRole === 'SUPER_ADMIN';
  if (isLoading) return <Spinner />;
  if (error) return <Alert className="mt-6">{error.message}</Alert>;
  return (
    <>
      <PageHeader title="Platform settings" subtitle={canEdit ? 'Changes take effect immediately and are audited.' : 'Only super admins can change settings.'} />
      <div className="flex flex-col gap-3 max-w-2xl">
        {data.map((s) => {
          const value = draft[s.key] ?? s.value;
          return (
            <div key={s.key} className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1"><p className="t-h4 font-mono text-[13px] break-all">{s.key}</p><p className="t-small text-muted">{s.description}</p></div>
              {s.dataType === 'BOOLEAN' ? (
                <Field as="select" value={value} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })} aria-label={s.key} className="w-32">
                  <option value="true">On</option><option value="false">Off</option>
                </Field>
              ) : (
                <Field type="number" value={value} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })} aria-label={s.key} className="w-32" />
              )}
              {canEdit && draft[s.key] !== undefined && draft[s.key] !== s.value && (
                <Button size="sm" loading={save.isPending} onClick={() => save.mutate({ key: s.key, value: draft[s.key] })}>Save</Button>
              )}
            </div>
          );
        })}
        <Alert>{save.error?.message}</Alert>
      </div>
    </>
  );
}

export function AdminAudit() {
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'audit', page], queryFn: () => api.admin.audit(page), placeholderData: keepPreviousData });
  return (
    <>
      <PageHeader title="Audit log" subtitle="Every administrative change, newest first." />
      {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.items.length ? <EmptyState title="No administrative actions yet" /> : (
        <Table head={['When', 'Admin', 'Action', 'Entity', 'Change']}>
          {data.items.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2.5 whitespace-nowrap">{relativeTime(l.at)}</td>
              <td className="px-3 py-2.5">{l.adminName}</td>
              <td className="px-3 py-2.5 font-mono text-[12px]">{l.action}</td>
              <td className="px-3 py-2.5"><p>{l.entityType}</p><p className="t-caption font-mono">{l.entityId.slice(0, 8)}</p></td>
              <td className="px-3 py-2.5 t-caption font-mono break-all max-w-[280px]">{l.after || ''}</td>
            </tr>
          ))}
        </Table>
      )}
      {data && <Pager page={page} size={data.size} total={data.total} onChange={setPage} />}
    </>
  );
}
