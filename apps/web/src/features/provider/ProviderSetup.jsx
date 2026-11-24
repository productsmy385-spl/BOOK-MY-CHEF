import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import { Alert, Button, Spinner, cx } from '../../components/ui';
import { useProviderMe } from './useProviderMe';
import { AvailabilitySection, CategoriesSection, CuisinesSection, DocumentsSection, PortfolioSection, ProfileSection, PublishSection, ServicesSection } from './sections';

/** Guided onboarding. Every step saves to the server; the provider can leave and resume any time. */
export default function ProviderSetup() {
  const { data: me, isLoading, error } = useProviderMe();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const [i, setI] = useState(0);

  if (isLoading) return <Spinner />;
  if (error) return <div className="page py-8"><Alert>{error.message}</Alert></div>;

  const culinary = me.categories.some((c) => catalog.category(c)?.culinary);
  const steps = [
    { key: 'basics', title: 'Basic information', hint: 'How customers will see you.', body: <ProfileSection me={me} onSaved={() => setI((x) => x + 1)} />, auto: true },
    { key: 'categories', title: 'Services you offer', hint: 'Pick everything you do. You can change this later.', body: <CategoriesSection me={me} onSaved={() => setI((x) => x + 1)} />, auto: true },
    culinary && { key: 'cuisines', title: 'Cuisines & specialities', hint: 'What you cook best.', body: <CuisinesSection me={me} onSaved={() => setI((x) => x + 1)} />, auto: true },
    { key: 'services', title: 'Service details & pricing', hint: 'Each service has its own price — per person, per plate, per event and more.', body: <ServicesSection me={me} /> },
    { key: 'availability', title: 'Availability', hint: 'When you work and how much notice you need.', body: <AvailabilitySection me={me} onSaved={() => setI((x) => x + 1)} />, auto: true },
    { key: 'portfolio', title: 'Portfolio', hint: 'Photos and videos of your work (optional).', body: <PortfolioSection me={me} /> },
    { key: 'verification', title: 'Verification', hint: 'Submit documents to get the Verified badge (optional, recommended).', body: <DocumentsSection me={me} /> },
    { key: 'publish', title: 'Review & publish', hint: 'Go live when the essentials are complete.', body: <PublishSection me={me} /> },
  ].filter(Boolean);
  const idx = Math.min(i, steps.length - 1);
  const step = steps[idx];

  return (
    <div className="page max-w-3xl py-6 pb-16">
      <p className="t-caption">Step {idx + 1} of {steps.length}</p>
      <div className="flex gap-1 mt-2" aria-hidden>
        {steps.map((s, j) => <span key={s.key} className={cx('h-1 flex-1 rounded-full', j <= idx ? 'bg-brand' : 'bg-line')} />)}
      </div>
      <nav className="hidden sm:flex flex-wrap gap-x-4 gap-y-1 mt-4" aria-label="Setup steps">
        {steps.map((s, j) => (
          <button key={s.key} onClick={() => setI(j)} className={cx('t-small flex items-center gap-1', j === idx ? 'text-navy font-semibold' : 'text-muted hover:text-ink')}>
            {j < idx && <Check className="w-3.5 h-3.5" />}{s.title}
          </button>
        ))}
      </nav>

      <h1 className="t-h2 mt-6">{step.title}</h1>
      <p className="t-small text-muted mt-1 mb-6">{step.hint}</p>
      {step.body}

      <div className="flex justify-between gap-3 mt-10 pt-5 border-t border-line">
        <Button variant="ghost" icon={ArrowLeft} disabled={idx === 0} onClick={() => setI(idx - 1)}>Back</Button>
        {idx < steps.length - 1 ? (
          <Button variant="outline" onClick={() => setI(idx + 1)}>{step.auto ? 'Skip for now' : 'Continue'} <ArrowRight className="w-4 h-4" /></Button>
        ) : (
          <Button variant="outline" onClick={() => navigate('/provider/dashboard')}>Go to dashboard</Button>
        )}
      </div>
    </div>
  );
}
