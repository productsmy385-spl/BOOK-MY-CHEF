import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Eye, Images, Pencil, Plus, Sparkles, Star, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { dateLabel, relativeTime } from '../../lib/format';
import { Alert, Badge, Button, Checkbox, Drawer, EmptyState, Field, Modal, PageHeader, Pager, Spinner, Tabs, cx } from '../../components/ui';
import ImageAssetPicker from '../../components/marketing/ImageAssetPicker';
import { BANNER_STATUS } from '../provider/ProviderPromotions';

const PLACEMENTS = [['HOME', 'Customer homepage carousel'], ['SIGN_IN', 'Customer sign-in'], ['REGISTER', 'Customer registration'], ['EXPLORE', 'Explore page'], ['CATEGORY', 'A service category'],
  ['PROVIDER_HOME', 'Provider dashboard carousel'], ['PROVIDER_SIGN_IN', 'Provider sign-in'], ['PROVIDER_REGISTER', 'Provider registration']];
const PROVIDER_PLACEMENTS = ['PROVIDER_HOME', 'PROVIDER_SIGN_IN', 'PROVIDER_REGISTER'];
const audienceOf = (b) => (b.placements.every((p) => PROVIDER_PLACEMENTS.includes(p)) ? 'PROVIDER' : b.placements.some((p) => PROVIDER_PLACEMENTS.includes(p)) ? 'BOTH' : 'CUSTOMER');
const CAMPAIGN_STATUS = { DRAFT: { label: 'Draft', tone: 'neutral' }, PUBLISHED: { label: 'Published', tone: 'green' }, ARCHIVED: { label: 'Archived', tone: 'neutral' } };
const toLocal = (iso) => (iso ? iso.slice(0, 16).replace(' ', 'T') : '');
const toIso = (local) => (local ? new Date(local).toISOString() : null);

// =================================================================== campaigns

const EMPTY_CAMPAIGN = { title: '', subtitle: '', ctaText: '', destinationType: 'EXPLORE', destinationRef: '', desktop: null, mobile: null,
  placements: ['HOME'], category: '', priority: 0, rotationSeconds: 6, startAt: '', endAt: '' };

export function AdminCampaigns() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'campaigns', status, page], queryFn: () => api.admin.campaigns(status, page), placeholderData: keepPreviousData });
  const act = useMutation({ mutationFn: ({ id, action, priority }) => (action === 'delete' ? api.admin.deleteCampaign(id)
    : action === 'priority' ? api.admin.setCampaignPriority(id, priority) : api.admin.campaignAction(id, action)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }) });

  const edit = (b) => setEditing({ id: b.id, title: b.title, subtitle: b.subtitle || '', ctaText: b.ctaText || '', destinationType: b.destinationType,
    destinationRef: b.destinationRef || '', desktop: { id: b.desktopAssetId, url: b.desktopUrl }, mobile: b.mobileAssetId ? { id: b.mobileAssetId, url: b.mobileUrl } : null,
    placements: b.placements, category: b.category || '', priority: b.priority, rotationSeconds: b.rotationSeconds, startAt: toLocal(b.startAt), endAt: toLocal(b.endAt) });

  return (
    <>
      <PageHeader title="Campaign management" subtitle="Platform banners shown to customers. Changes go live within a minute of publishing."
        action={<Button icon={Plus} onClick={() => setEditing({ ...EMPTY_CAMPAIGN })}>New campaign</Button>} />
      <Tabs value={status} onChange={(v) => { setStatus(v); setPage(0); }}
        options={[{ value: '', label: 'Active' }, { value: 'DRAFT', label: 'Drafts' }, { value: 'PUBLISHED', label: 'Published' }, { value: 'ARCHIVED', label: 'Archived' }]} />
      <div className="flex flex-wrap gap-2 mt-3">
        {[['ALL', 'All audiences'], ['CUSTOMER', 'Customer console'], ['PROVIDER', 'Provider console']].map(([v, l]) => (
          <button key={v} className={cx('chip', audience === v && 'chip-active')} aria-pressed={audience === v} onClick={() => setAudience(v)}>{l}</button>
        ))}
      </div>
      <Alert className="mt-3">{act.error?.message}</Alert>
      <div className="mt-4">
        {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.items.length ? (
          <EmptyState icon={Images} title="No campaigns here" action={<Button icon={Plus} onClick={() => setEditing({ ...EMPTY_CAMPAIGN })}>Create campaign</Button>} />
        ) : (
          <ul className="flex flex-col gap-3">
            {data.items.filter((b) => audience === 'ALL' || audienceOf(b) === audience || audienceOf(b) === 'BOTH').map((b) => (
              <li key={b.id} className="card overflow-hidden flex flex-col md:flex-row">
                <img src={b.desktopUrl} alt="" className="w-full md:w-72 aspect-[21/8] md:aspect-auto object-cover bg-canvas shrink-0" />
                <div className="p-4 flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="t-h4 break-words">{b.title}</p>
                    <div className="flex gap-1.5 shrink-0">
                      <Badge tone="blue">{{ CUSTOMER: 'Customer', PROVIDER: 'Provider', BOTH: 'Both' }[audienceOf(b)]}</Badge>
                      <Badge tone={CAMPAIGN_STATUS[b.status].tone}>{CAMPAIGN_STATUS[b.status].label}</Badge>
                    </div>
                  </div>
                  {b.subtitle && <p className="t-small text-muted break-words">{b.subtitle}</p>}
                  <p className="t-caption">
                    {b.placements.map((p) => PLACEMENTS.find(([k]) => k === p)?.[1]).join(', ')} · priority {b.priority}
                    {(b.startAt || b.endAt) && ` · ${b.startAt ? dateLabel(b.startAt) : 'now'} – ${b.endAt ? dateLabel(b.endAt) : 'no end'}`}
                    {b.href && ` · links to ${b.href}`}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    <Button size="sm" variant="ghost" aria-label="Show earlier" onClick={() => act.mutate({ id: b.id, action: 'priority', priority: Math.min(100, b.priority + 5) })}>▲</Button>
                    <Button size="sm" variant="ghost" aria-label="Show later" onClick={() => act.mutate({ id: b.id, action: 'priority', priority: Math.max(-100, b.priority - 5) })}>▼</Button>
                    <Button size="sm" variant="ghost" icon={Eye} onClick={() => setPreview(b)}>Preview</Button>
                    {b.status !== 'ARCHIVED' && <Button size="sm" variant="ghost" icon={Pencil} onClick={() => edit(b)}>Edit</Button>}
                    {b.status === 'DRAFT' && <Button size="sm" onClick={() => act.mutate({ id: b.id, action: 'publish' })}>Publish</Button>}
                    {b.status === 'PUBLISHED' && <Button size="sm" variant="outline" onClick={() => act.mutate({ id: b.id, action: 'unpublish' })}>Unpublish</Button>}
                    <Button size="sm" variant="ghost" icon={Copy} onClick={() => act.mutate({ id: b.id, action: 'duplicate' })}>Duplicate</Button>
                    {b.status !== 'ARCHIVED' && <Button size="sm" variant="ghost" onClick={() => act.mutate({ id: b.id, action: 'archive' })}>Archive</Button>}
                    {b.status !== 'PUBLISHED' && <Button size="sm" variant="ghost" icon={Trash2} className="text-danger" onClick={() => act.mutate({ id: b.id, action: 'delete' })}>Delete</Button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {data && <Pager page={page} size={data.size} total={data.total} onChange={setPage} />}
      </div>
      <CampaignEditor value={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }); }} />
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Preview">
        {preview && <CampaignPreview c={{ ...preview, desktop: { url: preview.desktopUrl }, mobile: { url: preview.mobileUrl } }} />}
      </Modal>
    </>
  );
}

function CampaignPreview({ c }) {
  const [mobile, setMobile] = useState(false);
  const img = mobile ? c.mobile?.url || c.desktop?.url : c.desktop?.url;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button className={cx('chip', !mobile && 'chip-active')} onClick={() => setMobile(false)}>Desktop</button>
        <button className={cx('chip', mobile && 'chip-active')} onClick={() => setMobile(true)}>Mobile</button>
      </div>
      <div className={cx('relative rounded-lg overflow-hidden bg-pale mx-auto w-full', mobile ? 'aspect-[4/5] max-w-[260px]' : 'aspect-[21/8]')}>
        {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-ink/75 via-ink/35 to-transparent" />
        <div className="absolute left-4 right-4 bottom-4 text-white">
          <p className="font-heading font-bold text-[18px] leading-tight">{c.title || 'Headline'}</p>
          {c.subtitle && <p className="text-[13px] text-white/90 mt-1 line-clamp-2">{c.subtitle}</p>}
          {c.ctaText && <span className="btn btn-primary btn-sm mt-3">{c.ctaText}</span>}
        </div>
      </div>
    </div>
  );
}

function CampaignEditor({ value, onClose, onSaved }) {
  const catalog = useCatalog();
  const [c, setC] = useState(value);
  const [library, setLibrary] = useState(null); // 'desktop' | 'mobile'
  const [aiFor, setAiFor] = useState(null);
  useEffect(() => setC(value), [value]);
  const save = useMutation({
    mutationFn: () => {
      const body = { title: c.title.trim(), subtitle: c.subtitle.trim() || null, ctaText: c.ctaText.trim() || null,
        destinationType: c.destinationType, destinationRef: ['CATEGORY', 'PROVIDER', 'PATH'].includes(c.destinationType) ? c.destinationRef.trim() : null,
        desktopAssetId: c.desktop?.id, mobileAssetId: c.mobile?.id || null, placements: c.placements,
        category: c.placements.includes('CATEGORY') ? c.category : null, priority: Number(c.priority) || 0,
        rotationSeconds: Number(c.rotationSeconds) || 6, startAt: toIso(c.startAt), endAt: toIso(c.endAt) };
      return c.id ? api.admin.updateCampaign(c.id, body) : api.admin.createCampaign(body);
    },
    onSuccess: onSaved,
  });
  if (!value || !c) return null;
  const set = (k) => (e) => setC({ ...c, [k]: e?.target ? e.target.value : e });
  const togglePlacement = (p) => setC({ ...c, placements: c.placements.includes(p) ? c.placements.filter((x) => x !== p) : [...c.placements, p] });
  const valid = c.title.trim() && c.desktop?.id && c.placements.length && (!c.placements.includes('CATEGORY') || c.category)
    && (!['CATEGORY', 'PROVIDER', 'PATH'].includes(c.destinationType) || c.destinationRef.trim());

  return (
    <Drawer open onClose={onClose} title={c.id ? 'Edit campaign' : 'New campaign'}
      footer={<Button className="w-full" disabled={!valid} loading={save.isPending} onClick={() => save.mutate()}>Save{c.id ? '' : ' as draft'}</Button>}>
      <div className="flex flex-col gap-4">
        {['desktop', 'mobile'].map((slot) => (
          <div key={slot} className="flex flex-col gap-2">
            <ImageAssetPicker label={slot === 'desktop' ? 'Desktop image' : 'Mobile image (optional)'} purpose="PLATFORM_BANNER"
              hint={slot === 'desktop' ? '2100 × 800 px' : '1080 × 1350 px'} ratio={slot === 'desktop' ? 'aspect-[21/8]' : 'aspect-[4/5] max-w-[200px]'}
              value={c[slot]} onChange={set(slot)} required={slot === 'desktop'} />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" icon={Images} onClick={() => setLibrary(slot)}>From library</Button>
              <Button size="sm" variant="ghost" icon={Sparkles} onClick={() => setAiFor(slot)}>Generate with AI</Button>
            </div>
          </div>
        ))}
        <Field label="Headline" value={c.title} onChange={set('title')} maxLength={120} required />
        <Field label="Subtitle" value={c.subtitle} onChange={set('subtitle')} maxLength={240} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button text" value={c.ctaText} onChange={set('ctaText')} maxLength={40} placeholder="e.g. Explore chefs" />
          <Field as="select" label="Button opens" value={c.destinationType} onChange={(e) => setC({ ...c, destinationType: e.target.value, destinationRef: '' })}>
            <option value="NONE">Nothing (no button)</option><option value="EXPLORE">Explore page</option><option value="CATEGORY">A service category</option>
            <option value="PROVIDER">A provider profile</option><option value="PATH">Another page on this site</option>
          </Field>
        </div>
        {c.destinationType === 'CATEGORY' && (
          <Field as="select" label="Category" value={c.destinationRef} onChange={set('destinationRef')}>
            <option value="">Choose</option>{catalog.categories.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}
          </Field>
        )}
        {c.destinationType === 'PROVIDER' && <ProviderSelect value={c.destinationRef} onChange={(id) => setC({ ...c, destinationRef: id })} />}
        {c.destinationType === 'PATH' && <Field label="Page path" placeholder="/explore?category=CATERER" value={c.destinationRef} onChange={set('destinationRef')} hint="Must start with “/”." />}
        <fieldset>
          <legend className="t-label mb-1">Where it appears</legend>
          {PLACEMENTS.map(([k, l]) => <Checkbox key={k} label={l} checked={c.placements.includes(k)} onChange={() => togglePlacement(k)} />)}
        </fieldset>
        {c.placements.includes('CATEGORY') && (
          <Field as="select" label="Show on category" value={c.category} onChange={set('category')}>
            <option value="">Choose</option>{catalog.categories.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority" type="number" min="-100" max="100" value={c.priority} onChange={set('priority')} hint="Higher shows first" />
          <Field label="Rotate every (s)" type="number" min="3" max="30" value={c.rotationSeconds} onChange={set('rotationSeconds')} />
          <Field label="Start (optional)" type="datetime-local" value={c.startAt} onChange={set('startAt')} />
          <Field label="End (optional)" type="datetime-local" value={c.endAt} onChange={set('endAt')} />
        </div>
        <div><p className="t-label mb-2">Preview</p><CampaignPreview c={c} /></div>
        <Alert>{save.error?.message}</Alert>
      </div>
      <LibraryPicker open={!!library} onClose={() => setLibrary(null)} onPick={(a) => { setC({ ...c, [library]: { id: a.id, url: a.url } }); setLibrary(null); }} />
      <AiGenerator open={!!aiFor} format={aiFor === 'mobile' ? 'MOBILE' : 'DESKTOP'} onClose={() => setAiFor(null)}
        onUse={(a) => { setC({ ...c, [aiFor]: { id: a.id, url: a.url } }); setAiFor(null); }} />
    </Drawer>
  );
}

function ProviderSelect({ value, onChange }) {
  const [q, setQ] = useState('');
  const { data } = useQuery({ queryKey: ['search', { q, size: 8 }], queryFn: () => api.search({ q, size: 8 }), enabled: q.trim().length > 1 });
  return (
    <div className="flex flex-col gap-2">
      <Field label="Provider" placeholder="Search published providers" value={q} onChange={(e) => setQ(e.target.value)} hint={value ? `Selected: ${value.slice(0, 8)}…` : undefined} />
      {data?.items?.length > 0 && (
        <ul className="panel divide-y divide-line max-h-48 overflow-y-auto">
          {data.items.map((p) => (
            <li key={p.id}><button className={cx('w-full text-left px-3 py-2 t-small hover:bg-canvas', value === p.id && 'bg-pale')} onClick={() => onChange(p.id)}>
              {p.businessName || p.name} <span className="text-muted">· {p.city}</span></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LibraryPicker({ open, onClose, onPick }) {
  const { data, isLoading } = useQuery({ queryKey: ['media', 'admin'], queryFn: () => api.media.list(), enabled: open });
  return (
    <Modal open={open} onClose={onClose} title="Image library">
      {isLoading ? <Spinner /> : !data?.items.length ? <p className="t-small text-muted">No images uploaded yet.</p> : (
        <div className="grid grid-cols-3 gap-2">
          {data.items.map((a) => (
            <button key={a.id} onClick={() => onPick(a)} className="relative aspect-square rounded-md overflow-hidden bg-canvas hover:ring-2 hover:ring-brand">
              <img src={a.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              {a.source === 'AI' && <span className="absolute left-1 top-1 px-1.5 rounded bg-white/90 text-[10px] font-semibold">AI</span>}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

function AiGenerator({ open, format, onClose, onUse }) {
  const config = useQuery({ queryKey: ['admin', 'aiConfig'], queryFn: api.admin.aiConfig, enabled: open });
  const [prompt, setPrompt] = useState('');
  const [preset, setPreset] = useState('');
  const [result, setResult] = useState(null);
  const gen = useMutation({ mutationFn: () => api.admin.aiGenerate({ prompt: prompt.trim() || null, preset: preset || null, format }), onSuccess: setResult });
  useEffect(() => { if (open) { setResult(null); gen.reset(); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  const cfg = config.data;
  return (
    <Modal open onClose={onClose} title={`Generate ${format === 'MOBILE' ? 'mobile' : 'desktop'} image`}
      footer={result ? <><Button variant="outline" loading={gen.isPending} onClick={() => gen.mutate()}>Regenerate</Button><Button onClick={() => onUse(result)}>Use this image</Button></>
        : <Button disabled={!cfg?.enabled || (!prompt.trim() && !preset)} loading={gen.isPending} onClick={() => gen.mutate()}>Generate</Button>}>
      {config.isLoading ? <Spinner /> : !cfg?.enabled ? (
        <Alert tone="warning">
          AI image generation is not available: {!cfg?.generatorConfigured ? 'no image-generation API key is configured on the server (OPENAI_API_KEY)' : 'image storage (ImageKit) is not configured'}.
          You can still upload images manually.
        </Alert>
      ) : (
        <div className="flex flex-col gap-3">
          <Field as="select" label="Campaign type" value={preset} onChange={(e) => setPreset(e.target.value)}>
            <option value="">Custom prompt only</option>
            {cfg.presets.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
          </Field>
          <Field as="textarea" rows={3} label="Describe the image" value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={800}
            hint="Realistic premium food/event photography. No text is added to the image." />
          {gen.isPending && <p className="t-small text-muted">Generating — this can take up to a minute…</p>}
          {result && <img src={result.url} alt="Generated" className={cx('rounded-md w-full object-cover', format === 'MOBILE' ? 'aspect-[2/3] max-w-[240px] mx-auto' : 'aspect-[3/2]')} />}
          <Alert>{gen.error?.message}</Alert>
        </div>
      )}
    </Modal>
  );
}

// =================================================================== provider promotions

export function AdminProviderPromotions() {
  const qc = useQueryClient();
  const catalog = useCatalog();
  const [status, setStatus] = useState('PENDING_APPROVAL');
  const [page, setPage] = useState(0);
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState('');
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'promotions', status, page], queryFn: () => api.admin.promotionQueue(status, page), placeholderData: keepPreviousData });
  const review = useMutation({ mutationFn: () => api.admin.reviewPromotion(decision.banner.id, decision.action, note.trim() || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'promotions'] }); setDecision(null); setNote(''); } });
  const needsNote = decision && ['reject', 'request-changes'].includes(decision.action);

  return (
    <>
      <PageHeader title="Provider promotions" subtitle="Banners submitted by providers. Nothing is public until approved." />
      <Tabs value={status} onChange={(v) => { setStatus(v); setPage(0); }} options={['PENDING_APPROVAL', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'PAUSED', 'EXPIRED'].map((s) => ({ value: s, label: BANNER_STATUS[s].label }))} />
      <div className="mt-4">
        {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.items.length ? <EmptyState title="Nothing here" /> : (
          <ul className="flex flex-col gap-3">
            {data.items.map((b) => (
              <li key={b.id} className="card overflow-hidden flex flex-col md:flex-row">
                <img src={b.desktopUrl} alt="" className="w-full md:w-72 aspect-[16/9] md:aspect-auto object-cover bg-canvas shrink-0" />
                <div className="p-4 flex-1 min-w-0 flex flex-col gap-1.5">
                  <p className="t-h4 break-words">{b.title}</p>
                  <p className="t-small text-muted">{b.businessName || b.providerName}{b.category && ` · ${catalog.categoryLabel(b.category)}`}{b.offerText && ` · ${b.offerText}`}</p>
                  {b.description && <p className="t-small break-words">{b.description}</p>}
                  <p className="t-caption">{b.submittedAt ? `Submitted ${relativeTime(b.submittedAt)}` : ''}{b.reviewNote ? ` · Note: ${b.reviewNote}` : ''} · {b.impressions} views, {b.clicks} clicks</p>
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {b.status === 'PENDING_APPROVAL' && <>
                      <Button size="sm" onClick={() => setDecision({ banner: b, action: 'approve' })}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => setDecision({ banner: b, action: 'request-changes' })}>Request changes</Button>
                      <Button size="sm" variant="danger" onClick={() => setDecision({ banner: b, action: 'reject' })}>Reject</Button>
                    </>}
                    {b.status === 'APPROVED' && <>
                      <Button size="sm" variant="outline" onClick={() => setDecision({ banner: b, action: 'pause' })}>Pause</Button>
                      <Button size="sm" variant="outline" onClick={() => setDecision({ banner: b, action: 'request-changes' })}>Request changes</Button>
                    </>}
                    {b.status !== 'ARCHIVED' && <Button size="sm" variant="ghost" onClick={() => setDecision({ banner: b, action: 'archive' })}>Archive</Button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {data && <Pager page={page} size={data.size} total={data.total} onChange={setPage} />}
      </div>
      <Modal open={!!decision} onClose={() => setDecision(null)} title={decision ? `${decision.action.replace('-', ' ')} “${decision.banner.title}”?` : ''}
        footer={<><Button variant="outline" onClick={() => setDecision(null)}>Back</Button>
          <Button loading={review.isPending} disabled={needsNote && !note.trim()} onClick={() => review.mutate()}>Confirm</Button></>}>
        <Field as="textarea" rows={3} label={needsNote ? 'Note to the provider' : 'Note (optional)'} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        <p className="t-caption mt-2">The provider is notified and the decision is recorded in the audit log.</p>
        <Alert className="mt-3">{review.error?.message}</Alert>
      </Modal>
    </>
  );
}

// =================================================================== featured providers

export function AdminFeatured() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'featured'], queryFn: api.admin.featured });
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ placement: 'HOME_FEATURED', priority: 0, startAt: '', endAt: '' });
  const search = useQuery({ queryKey: ['search', { q, size: 8 }], queryFn: () => api.search({ q, size: 8 }), enabled: q.trim().length > 1 });
  const feature = useMutation({ mutationFn: (id) => api.admin.feature(id, { placement: form.placement, priority: Number(form.priority) || 0, startAt: toIso(form.startAt), endAt: toIso(form.endAt) }),
    onSuccess: (list) => { qc.setQueryData(['admin', 'featured'], list); setQ(''); } });
  const remove = useMutation({ mutationFn: (f) => api.admin.unfeature(f.providerId, f.placement), onSuccess: (list) => qc.setQueryData(['admin', 'featured'], list) });

  return (
    <>
      <PageHeader title="Featured providers" subtitle="Featured placement is promotion only — it never marks a provider as verified." />
      <section className="card p-5 max-w-2xl flex flex-col gap-3">
        <h2 className="t-h4">Feature a provider</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field as="select" label="Placement" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
            <option value="HOME_FEATURED">Homepage — Featured chefs</option><option value="EXPLORE_FEATURED">Explore — featured</option>
          </Field>
          <Field label="Priority" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          <Field label="Start (optional)" type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
          <Field label="End (optional)" type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
        </div>
        <Field label="Find a published provider" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, cuisine or area" />
        {search.data?.items?.length > 0 && (
          <ul className="panel divide-y divide-line">
            {search.data.items.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="t-small min-w-0 truncate">{p.businessName || p.name} <span className="text-muted">· {p.city}</span></span>
                <Button size="sm" icon={Star} loading={feature.isPending} onClick={() => feature.mutate(p.id)}>Feature</Button>
              </li>
            ))}
          </ul>
        )}
        <Alert>{feature.error?.message}</Alert>
      </section>
      <h2 className="t-h4 mt-8 mb-3">Currently featured</h2>
      {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.length ? <p className="t-small text-muted">No featured providers.</p> : (
        <ul className="panel divide-y divide-line">
          {data.map((f) => (
            <li key={f.id} className="p-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="t-h4 truncate">{f.businessName || f.name}</p>
                <p className="t-caption">{f.placement === 'HOME_FEATURED' ? 'Homepage' : 'Explore'} · priority {f.priority}
                  {(f.startAt || f.endAt) && ` · ${f.startAt ? dateLabel(f.startAt) : 'now'} – ${f.endAt ? dateLabel(f.endAt) : 'no end'}`}</p>
              </div>
              <Badge tone={f.active && f.published ? 'green' : 'neutral'}>{!f.published ? 'Not published' : f.active ? 'Showing' : 'Scheduled/ended'}</Badge>
              <Button size="sm" variant="ghost" loading={remove.isPending} onClick={() => remove.mutate(f)}>Remove</Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// =================================================================== analytics & media

export function AdminBannerAnalytics() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'bannerAnalytics', days], queryFn: () => api.admin.bannerAnalytics(days) });
  const ctr = (r) => (Number(r.impressions) ? `${((Number(r.clicks) / Number(r.impressions)) * 100).toFixed(1)}%` : '—');
  const Table = ({ rows, cols }) => (
    <div className="panel overflow-x-auto">
      <table className="w-full t-small min-w-[560px]">
        <thead className="bg-canvas"><tr className="text-left">{[...cols.map((c) => c[0]), 'Views', 'Clicks', 'CTR'].map((h) => <th key={h} className="px-3 py-2.5 font-medium text-muted">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={r.id || i}>{cols.map(([, k]) => <td key={k} className="px-3 py-2.5">{r[k]}</td>)}
              <td className="px-3 py-2.5 tabular-nums">{r.impressions}</td><td className="px-3 py-2.5 tabular-nums">{r.clicks}</td><td className="px-3 py-2.5 tabular-nums">{ctr(r)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <>
      <PageHeader title="Banner analytics" subtitle="Unique views and clicks per visitor per day, from the database."
        action={<Field as="select" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period" className="w-36">
          <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></Field>} />
      {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : (
        <div className="flex flex-col gap-6">
          <section><h2 className="t-h4 mb-3">By placement</h2>{data.placements.length ? <Table rows={data.placements} cols={[['Placement', 'placement']]} /> : <p className="t-small text-muted">No banner activity yet.</p>}</section>
          <section><h2 className="t-h4 mb-3">Platform campaigns</h2>{data.campaigns.length ? <Table rows={data.campaigns} cols={[['Campaign', 'title'], ['Status', 'status']]} /> : <p className="t-small text-muted">No published campaigns yet.</p>}</section>
          <section><h2 className="t-h4 mb-3">Provider promotions</h2>{data.providerPromotions.length ? <Table rows={data.providerPromotions} cols={[['Banner', 'title'], ['Provider', 'providerName'], ['Status', 'status']]} /> : <p className="t-small text-muted">No approved provider promotions yet.</p>}</section>
        </div>
      )}
    </>
  );
}

export function AdminMedia() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useQuery({ queryKey: ['media', 'admin', page], queryFn: () => api.media.list(undefined, page), placeholderData: keepPreviousData });
  const remove = useMutation({ mutationFn: (id) => api.media.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }) });
  const copy = useMutation({ mutationFn: (id) => api.admin.copyToImageKit(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }); } });
  return (
    <>
      <PageHeader title="Image management" subtitle="Campaign images. “Bundled” images ship with the app; copy them to ImageKit once it is configured. Images used by a banner cannot be deleted." />
      <Alert className="mb-3">{copy.error?.message}</Alert>
      <div className="max-w-md mb-6"><ImageAssetPicker label="Upload a campaign image" purpose="CAMPAIGN_ASSET" value={null} onChange={() => qc.invalidateQueries({ queryKey: ['media'] })} /></div>
      <Alert className="mb-3">{remove.error?.message}</Alert>
      {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.items.length ? <EmptyState icon={Images} title="No images yet" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {data.items.map((a) => (
            <div key={a.id} className="panel overflow-hidden">
              <img src={a.url} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover bg-canvas" />
              <div className="p-2 flex items-center justify-between gap-2">
                <span className="t-caption truncate">{a.storage === 'BUNDLED' ? 'Bundled · ' : 'ImageKit · '}{a.source === 'AI' ? 'AI · ' : ''}{a.width && `${a.width}×${a.height}`}</span>
                <span className="flex shrink-0">
                  {a.storage === 'BUNDLED' && (
                    <Button size="sm" variant="ghost" loading={copy.isPending && copy.variables === a.id} onClick={() => copy.mutate(a.id)}>Copy to ImageKit</Button>
                  )}
                  <button className="btn-icon w-8 h-8 text-danger" aria-label="Delete image" onClick={() => remove.mutate(a.id)}><Trash2 className="w-4 h-4" /></button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {data && <Pager page={page} size={data.size} total={data.total} onChange={setPage} />}
    </>
  );
}
