import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Pause, Pencil, Play, Plus, Send, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { dateLabel } from '../../lib/format';
import { Alert, Badge, Button, Drawer, EmptyState, Field, Modal, PageHeader, Spinner } from '../../components/ui';
import ImageAssetPicker from '../../components/marketing/ImageAssetPicker';
import { useProviderMe } from './useProviderMe';

export const BANNER_STATUS = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PENDING_APPROVAL: { label: 'Awaiting approval', tone: 'amber' },
  APPROVED: { label: 'Live', tone: 'green' },
  REJECTED: { label: 'Not approved', tone: 'red' },
  CHANGES_REQUESTED: { label: 'Changes requested', tone: 'amber' },
  PAUSED: { label: 'Paused', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
  ARCHIVED: { label: 'Archived', tone: 'neutral' },
};

const EMPTY = { title: '', description: '', offerText: '', category: '', ctaText: 'View profile', desktop: null, mobile: null, startAt: '', endAt: '' };
const toLocal = (iso) => (iso ? iso.slice(0, 16).replace(' ', 'T') : '');
const toIso = (local) => (local ? new Date(local).toISOString() : null);

export default function ProviderPromotions() {
  const qc = useQueryClient();
  const catalog = useCatalog();
  const me = useProviderMe();
  const { data, isLoading, error } = useQuery({ queryKey: ['myBanners'], queryFn: api.myBanners.list });
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['myBanners'] });
  const act = useMutation({ mutationFn: ({ fn }) => fn(), onSuccess: refresh });

  return (
    <div className="page max-w-4xl pb-10">
      <PageHeader title="Marketing & promotions" subtitle="Promotional banners appear on the homepage and your profile after Book My Chef approves them."
        action={<Button icon={Plus} onClick={() => setEditing({ ...EMPTY })}>New banner</Button>} />
      {me.data && me.data.onboardingStatus !== 'PUBLISHED' && (
        <Alert tone="info" className="mb-4">Your profile is not published yet. Approved banners only show once your profile is live.</Alert>
      )}
      <Alert className="mb-4">{act.error?.message}</Alert>
      {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.length ? (
        <EmptyState icon={Megaphone} title="No promotions yet" action={<Button icon={Plus} onClick={() => setEditing({ ...EMPTY })}>Create a banner</Button>}>
          Highlight a special menu, seasonal offer or package. Each banner is reviewed before customers see it.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {data.map((b) => {
            const st = BANNER_STATUS[b.status];
            return (
              <li key={b.id} className="card overflow-hidden flex flex-col sm:flex-row">
                <img src={b.desktopUrl} alt="" className="w-full sm:w-64 aspect-[16/9] sm:aspect-auto object-cover bg-canvas shrink-0" />
                <div className="p-4 flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="t-h4 break-words">{b.title}</p>
                      {b.offerText && <p className="t-small text-navy font-medium">{b.offerText}</p>}
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  {b.reviewNote && ['REJECTED', 'CHANGES_REQUESTED', 'PAUSED'].includes(b.status) && (
                    <Alert tone="warning">Reviewer note: {b.reviewNote}</Alert>
                  )}
                  <p className="t-caption">
                    {b.category ? `${catalog.categoryLabel(b.category)} · ` : ''}
                    {b.startAt || b.endAt ? `Runs ${b.startAt ? dateLabel(b.startAt) : 'now'} – ${b.endAt ? dateLabel(b.endAt) : 'until paused'}` : 'Runs until paused'}
                  </p>
                  <p className="t-small">
                    <strong>{b.impressions}</strong> views · <strong>{b.clicks}</strong> clicks{b.ctr != null && <> · {b.ctr}% click-through</>}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto pt-1">
                    {['DRAFT', 'REJECTED', 'CHANGES_REQUESTED'].includes(b.status) && (
                      <Button size="sm" icon={Send} loading={act.isPending} onClick={() => act.mutate({ fn: () => api.myBanners.submit(b.id) })}>Submit for approval</Button>
                    )}
                    {b.status === 'APPROVED' && <Button size="sm" variant="outline" icon={Pause} onClick={() => act.mutate({ fn: () => api.myBanners.pause(b.id) })}>Pause</Button>}
                    {b.status === 'PAUSED' && <Button size="sm" variant="outline" icon={Play} onClick={() => act.mutate({ fn: () => api.myBanners.resume(b.id) })}>Resume</Button>}
                    {b.status !== 'PENDING_APPROVAL' && (
                      <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing({
                        id: b.id, status: b.status, title: b.title, description: b.description || '', offerText: b.offerText || '', category: b.category || '',
                        ctaText: b.ctaText || '', desktop: { id: b.desktopAssetId, url: b.desktopUrl },
                        mobile: b.mobileAssetId ? { id: b.mobileAssetId, url: b.mobileUrl } : null, startAt: toLocal(b.startAt), endAt: toLocal(b.endAt) })}>Edit</Button>
                    )}
                    <Button size="sm" variant="ghost" icon={Trash2} className="text-danger" onClick={() => setRemoving(b)}>Remove</Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <BannerEditor value={editing} categories={me.data?.categories || []} catalog={catalog} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
      <Modal open={!!removing} onClose={() => setRemoving(null)} title="Remove this banner?"
        footer={<><Button variant="outline" onClick={() => setRemoving(null)}>Keep</Button>
          <Button variant="navy" loading={act.isPending} onClick={() => act.mutate({ fn: () => api.myBanners.remove(removing.id) }, { onSuccess: () => setRemoving(null) })}>Remove</Button></>}>
        <p className="t-body text-muted">“{removing?.title}” will stop showing to customers. Its statistics are kept.</p>
      </Modal>
    </div>
  );
}

function BannerEditor({ value, categories, catalog, onClose, onSaved }) {
  const [b, setB] = useState(value);
  useEffect(() => setB(value), [value]);
  const save = useMutation({
    mutationFn: ({ submit }) => {
      const body = { title: b.title.trim(), description: b.description.trim() || null, offerText: b.offerText.trim() || null,
        category: b.category || null, ctaText: b.ctaText.trim() || null, desktopAssetId: b.desktop?.id, mobileAssetId: b.mobile?.id || null,
        startAt: toIso(b.startAt), endAt: toIso(b.endAt) };
      return (b.id ? api.myBanners.update(b.id, body) : api.myBanners.create(body))
        .then((saved) => (submit ? api.myBanners.submit(saved.id) : saved));
    },
    onSuccess: onSaved,
  });
  if (!value || !b) return null;
  const set = (k) => (e) => setB({ ...b, [k]: e?.target ? e.target.value : e });
  const valid = b.title.trim() && b.desktop?.id && (!b.startAt || !b.endAt || b.endAt > b.startAt);
  const resubmits = ['APPROVED', 'PAUSED', 'EXPIRED'].includes(b.status);

  return (
    <Drawer open onClose={onClose} title={b.id ? 'Edit banner' : 'New banner'}
      footer={<div className="flex gap-2">
        <Button variant="outline" className="flex-1" disabled={!valid} loading={save.isPending} onClick={() => save.mutate({ submit: false })}>Save draft</Button>
        <Button className="flex-1" disabled={!valid} loading={save.isPending} onClick={() => save.mutate({ submit: true })}>Save & submit</Button>
      </div>}>
      <div className="flex flex-col gap-4">
        {resubmits && <Alert tone="info">Saving changes takes this banner off the site until it is approved again.</Alert>}
        <ImageAssetPicker label="Banner image (desktop)" hint="1600 × 900 px recommended" purpose="PROVIDER_BANNER" ratio="aspect-[16/9]"
          value={b.desktop} onChange={set('desktop')} required />
        <ImageAssetPicker label="Mobile image (optional)" hint="1080 × 1350 px" purpose="PROVIDER_BANNER" ratio="aspect-[4/5] max-w-[220px]"
          value={b.mobile} onChange={set('mobile')} />
        <Field label="Title" value={b.title} onChange={set('title')} maxLength={100} required placeholder="e.g. Authentic Andhra home cooking" />
        <Field label="Offer (optional)" value={b.offerText} onChange={set('offerText')} maxLength={80} placeholder="e.g. 10% off family meals this month" />
        <Field as="textarea" rows={3} label="Description (optional)" value={b.description} onChange={set('description')} maxLength={300} />
        <div className="grid grid-cols-2 gap-3">
          <Field as="select" label="Service" value={b.category} onChange={set('category')}>
            <option value="">Any of my services</option>
            {categories.map((c) => <option key={c} value={c}>{catalog.categoryLabel(c)}</option>)}
          </Field>
          <Field label="Button text" value={b.ctaText} onChange={set('ctaText')} maxLength={40} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start (optional)" type="datetime-local" value={b.startAt} onChange={set('startAt')} />
          <Field label="End (optional)" type="datetime-local" value={b.endAt} onChange={set('endAt')}
            error={b.startAt && b.endAt && b.endAt <= b.startAt ? 'End must be after start' : undefined} />
        </div>
        {b.desktop?.url && (
          <div>
            <p className="t-label mb-2">Preview</p>
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
              <img src={b.desktop.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <span className="absolute left-3 top-3 h-6 px-2 rounded bg-white/95 text-[11px] font-semibold text-muted flex items-center">Sponsored</span>
              {b.offerText && <span className="absolute right-3 top-3 h-6 px-2 rounded bg-brand text-white text-[11px] font-semibold flex items-center">{b.offerText}</span>}
              <p className="absolute left-3 right-3 bottom-3 font-heading font-semibold text-white text-[16px] line-clamp-2">{b.title || 'Your title'}</p>
            </div>
          </div>
        )}
        <Alert>{save.error?.message}</Alert>
      </div>
    </Drawer>
  );
}
