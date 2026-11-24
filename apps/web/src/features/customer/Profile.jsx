import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';
import { Alert, Avatar, Badge, Button, Checkbox, Drawer, Field, Modal, PageHeader, Spinner } from '../../components/ui';

const EMPTY_ADDRESS = { addressType: 'HOME', addressLine1: '', addressLine2: '', landmark: '', city: '', state: '', postalCode: '', isDefault: false };

export default function Profile() {
  const { account, patchAccount, logout } = useAuthStore();
  const qc = useQueryClient();
  const [form, setForm] = useState({ fullName: account.fullName || '', city: account.city || '', avatarUrl: account.avatarUrl || '' });
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: () => api.customer.updateProfile({ fullName: form.fullName.trim(), city: form.city.trim(), avatarUrl: form.avatarUrl.trim() }),
    onSuccess: () => { patchAccount({ fullName: form.fullName.trim(), city: form.city.trim() || null, avatarUrl: form.avatarUrl.trim() || null }); setSaved(true); },
  });
  useEffect(() => { if (saved) { const t = setTimeout(() => setSaved(false), 2500); return () => clearTimeout(t); } return undefined; }, [saved]);

  const addresses = useQuery({ queryKey: ['addresses'], queryFn: api.customer.addresses });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const saveAddress = useMutation({
    mutationFn: (a) => (a.id ? api.customer.updateAddress(a.id, a) : api.customer.addAddress(a)),
    onSuccess: (list) => { qc.setQueryData(['addresses'], list); setEditing(null); },
  });
  const removeAddress = useMutation({
    mutationFn: (id) => api.customer.deleteAddress(id),
    onSuccess: (list) => { qc.setQueryData(['addresses'], list); setDeleting(null); },
  });

  return (
    <div className="page max-w-3xl pb-10">
      <PageHeader title="Profile" />
      <section className="card p-5">
        <div className="flex items-center gap-4">
          <Avatar src={account.avatarUrl} name={account.fullName} size={64} />
          <div className="min-w-0">
            <p className="t-h3 truncate">{account.fullName}</p>
            <p className="t-small text-muted truncate">{account.email}</p>
            {account.phone && <p className="t-small text-muted">{account.phone}</p>}
          </div>
        </div>
        <form className="grid sm:grid-cols-2 gap-4 mt-5" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Field label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <Field label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} hint="Used to show providers near you." />
          <Field className="sm:col-span-2" label="Photo link (optional)" type="url" placeholder="https://" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
          <div className="sm:col-span-2 flex items-center gap-3">
            <Button type="submit" loading={save.isPending} disabled={!form.fullName.trim()}>Save changes</Button>
            {saved && <span className="t-small text-success" role="status">Saved</span>}
          </div>
          <Alert className="sm:col-span-2">{save.error?.message}</Alert>
        </form>
      </section>

      <section className="mt-8" id="addresses">
        <div className="flex items-center justify-between mb-3">
          <h2 className="t-h3">Saved addresses</h2>
          <Button variant="outline" size="sm" icon={Plus} onClick={() => setEditing({ ...EMPTY_ADDRESS })}>Add</Button>
        </div>
        {addresses.isLoading ? <Spinner /> : !addresses.data?.length ? (
          <p className="t-small text-muted panel p-4">No saved addresses. Add one to fill booking forms faster.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {addresses.data.map((a) => (
              <li key={a.id} className="panel p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="t-body break-words">{[a.addressLine1, a.addressLine2, a.landmark].filter(Boolean).join(', ')}</p>
                  <p className="t-small text-muted">{a.city}, {a.state} {a.postalCode}</p>
                  <div className="flex gap-2 mt-1.5">
                    <Badge>{{ HOME: 'Home', EVENT_VENUE: 'Event venue', OTHER: 'Other' }[a.addressType]}</Badge>
                    {a.isDefault && <Badge tone="blue">Default</Badge>}
                  </div>
                </div>
                <button className="btn-icon" aria-label="Edit address" onClick={() => setEditing({ ...EMPTY_ADDRESS, ...a, addressLine2: a.addressLine2 || '', landmark: a.landmark || '' })}><Pencil className="w-4 h-4" /></button>
                <button className="btn-icon text-danger" aria-label="Delete address" onClick={() => setDeleting(a)}><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button variant="danger" icon={LogOut} className="mt-10 w-full sm:w-auto" onClick={logout}>Sign out</Button>

      <AddressDrawer value={editing} onClose={() => setEditing(null)} onSave={(a) => saveAddress.mutate(a)} saving={saveAddress.isPending} error={saveAddress.error} />
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete this address?"
        footer={<><Button variant="outline" onClick={() => setDeleting(null)}>Keep</Button><Button variant="navy" loading={removeAddress.isPending} onClick={() => removeAddress.mutate(deleting.id)}>Delete</Button></>}>
        <p className="t-body text-muted">{deleting?.addressLine1}, {deleting?.city}</p>
      </Modal>
    </div>
  );
}

function AddressDrawer({ value, onClose, onSave, saving, error }) {
  const [a, setA] = useState(value);
  useEffect(() => setA(value), [value]);
  if (!value || !a) return null;
  const set = (k) => (e) => setA({ ...a, [k]: e.target.value });
  const fe = error?.fields || {};
  return (
    <Drawer open onClose={onClose} title={a.id ? 'Edit address' : 'New address'}
      footer={<Button className="w-full" loading={saving} onClick={() => onSave({ ...a, latitude: a.latitude ?? undefined, longitude: a.longitude ?? undefined })}>Save address</Button>}>
      <div className="flex flex-col gap-4">
        <Field as="select" label="Type" value={a.addressType} onChange={set('addressType')}>
          <option value="HOME">Home</option><option value="EVENT_VENUE">Event venue</option><option value="OTHER">Other</option>
        </Field>
        <Field label="House / flat, street" value={a.addressLine1} onChange={set('addressLine1')} error={fe.addressLine1} required />
        <Field label="Area" value={a.addressLine2} onChange={set('addressLine2')} />
        <Field label="Landmark" value={a.landmark} onChange={set('landmark')} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" value={a.city} onChange={set('city')} error={fe.city} required />
          <Field label="State" value={a.state} onChange={set('state')} error={fe.state} required />
        </div>
        <Field label="PIN code" inputMode="numeric" maxLength={6} value={a.postalCode} onChange={set('postalCode')} error={fe.postalCode} required />
        <Checkbox label="Use as default address" checked={!!a.isDefault} onChange={(v) => setA({ ...a, isDefault: v })} />
        <Alert>{error && !Object.keys(fe).length ? error.message : null}</Alert>
      </div>
    </Drawer>
  );
}
