import { Link } from 'react-router-dom';
import { ikUrl } from '../../lib/imagekit';
import { trackClick, useImpression } from './useBannerTracking';

/** One approved provider promotion. Always labelled "Sponsored" to separate it from organic results. */
export default function PromoCard({ promo, placement, catalog }) {
  const ref = useImpression(promo, placement);
  return (
    <Link ref={ref} to={promo.href} onClick={() => trackClick(promo, placement)}
      className="group relative block w-[300px] sm:w-[340px] shrink-0 aspect-[16/9] rounded-lg overflow-hidden bg-pale shadow-card">
      <picture>
        <source media="(max-width: 639px)" srcSet={ikUrl(promo.mobileUrl, { w: 640 })} />
        <img src={ikUrl(promo.desktopUrl, { w: 720 })} alt="" loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
      <span className="absolute left-3 top-3 h-6 px-2 rounded bg-white/95 text-[11px] font-semibold text-muted flex items-center">Sponsored</span>
      {promo.offerText && (
        <span className="absolute right-3 top-3 h-6 px-2 rounded bg-brand text-white text-[11px] font-semibold flex items-center max-w-[60%] truncate">{promo.offerText}</span>
      )}
      <div className="absolute left-3 right-3 bottom-3 text-white">
        <p className="font-heading font-semibold text-[16px] leading-snug line-clamp-2">{promo.title}</p>
        <p className="text-[12px] text-white/85 mt-0.5 truncate">
          {promo.businessName || promo.providerName}{promo.category && catalog ? ` · ${catalog.categoryLabel(promo.category)}` : ''}
        </p>
      </div>
    </Link>
  );
}
