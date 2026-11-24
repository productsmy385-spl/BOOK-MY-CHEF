import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { ikSrcSet, ikUrl } from '../../lib/imagekit';
import { cx } from '../ui';
import { trackClick, useImpression } from './useBannerTracking';

/**
 * Platform campaign carousel for a placement. Renders nothing when no campaign is live.
 * Auto-rotates (pauses on hover/focus and for reduced-motion users), supports swipe,
 * arrows and dots, and serves separate desktop/mobile images.
 */
export default function BannerCarousel({ placement, category, variant = 'hero', className }) {
  const { data } = useQuery({
    queryKey: ['banners', placement, category],
    queryFn: () => api.public.banners(placement, category),
    staleTime: 60_000,
  });
  const banners = data || [];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef(null);
  const n = banners.length;
  const go = useCallback((d) => setI((x) => (n ? (x + d + n) % n : 0)), [n]);

  useEffect(() => { if (i >= n) setI(0); }, [i, n]);
  useEffect(() => {
    if (n < 2 || paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setTimeout(() => go(1), (banners[i]?.rotationSeconds || 6) * 1000);
    return () => clearTimeout(t);
  }, [i, n, paused, go, banners]);

  if (!n) return null;
  const compact = variant === 'compact';

  return (
    <section aria-roledescription="carousel" aria-label="Promotions"
      className={cx('relative overflow-hidden rounded-lg bg-pale', compact ? 'aspect-[16/7]' : 'aspect-[4/5] sm:aspect-[21/8]', className)}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        setPaused(false);
      }}>
      <div className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map((b, idx) => <Slide key={b.id} b={b} placement={placement} active={idx === i} compact={compact} eager={idx === 0} />)}
      </div>
      {n > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous promotion"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-card items-center justify-center hover:bg-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => go(1)} aria-label="Next promotion"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-card items-center justify-center hover:bg-white">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {banners.map((b, idx) => (
              <button key={b.id} onClick={() => setI(idx)} aria-label={`Show promotion ${idx + 1} of ${n}`} aria-current={idx === i}
                className={cx('h-2 rounded-full transition-all', idx === i ? 'w-6 bg-white' : 'w-2 bg-white/60')} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Slide({ b, placement, active, compact, eager }) {
  const ref = useImpression(active ? b : null, placement);
  const content = (
    <>
      <picture>
        <source media="(max-width: 639px)" srcSet={ikSrcSet(b.mobileUrl, [480, 768]) || b.mobileUrl} />
        <img src={ikUrl(b.desktopUrl, { w: 1600 })} srcSet={ikSrcSet(b.desktopUrl)} sizes="(max-width: 1200px) 100vw, 1200px"
          alt="" loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-ink/75 via-ink/35 to-transparent" />
      <div className={cx('absolute text-white max-w-[560px]', compact ? 'left-4 right-4 bottom-4' : 'left-5 right-5 bottom-10 sm:left-10 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2')}>
        <h2 className={cx('font-heading font-bold text-white leading-tight', compact ? 'text-[18px]' : 'text-[24px] sm:text-[34px]')}>{b.title}</h2>
        {b.subtitle && <p className={cx('mt-2 text-white/90', compact ? 'text-[13px] line-clamp-2' : 'text-[15px] sm:text-[17px]')}>{b.subtitle}</p>}
        {b.ctaText && b.href && <span className={cx('btn btn-primary mt-4', compact && 'btn-sm')}>{b.ctaText}</span>}
      </div>
    </>
  );
  return (
    <div ref={ref} className="relative w-full h-full shrink-0" aria-hidden={!active}>
      {b.href ? (
        <Link to={b.href} onClick={() => trackClick(b, placement)} tabIndex={active ? 0 : -1} className="block w-full h-full" aria-label={b.title}>
          {content}
        </Link>
      ) : content}
    </div>
  );
}
