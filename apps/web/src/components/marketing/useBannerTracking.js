import { useEffect, useRef } from 'react';
import { api } from '../../services/api';

const KEY = 'bmc_visitor_id';

/** Anonymous per-browser id used only to de-duplicate banner analytics. */
export function visitorId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return undefined; // server falls back to IP + user agent
  }
}

const seen = new Set();

/** Sends one impression when at least half of the element is visible (once per session per banner). */
export function useImpression(banner, placement) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !banner) return undefined;
    const key = `${banner.kind}:${banner.id}:${placement}`;
    if (seen.has(key)) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !seen.has(key)) {
        seen.add(key);
        api.public.event(banner.id, 'impression', { kind: banner.kind, placement, visitorId: visitorId() }).catch(() => {});
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [banner, placement]);
  return ref;
}

export function trackClick(banner, placement) {
  api.public.event(banner.id, 'click', { kind: banner.kind, placement, visitorId: visitorId() }).catch(() => {});
}
