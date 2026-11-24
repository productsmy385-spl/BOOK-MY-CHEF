import { Link } from 'react-router-dom';
import { BadgeCheck, Heart, MapPin, Star } from 'lucide-react';
import { priceLabel } from '../../lib/format';
import { Avatar, cx } from '../ui';

/** Marketplace result card. Renders only values that exist; never fills gaps with invented data. */
export default function ProviderCard({ p, catalog, favourite, onToggleFavourite }) {
  const location = [p.locality, p.city].filter(Boolean).join(', ');
  return (
    <article className="relative card overflow-hidden flex flex-col group hover:shadow-raised transition-shadow">
      <Link to={`/p/${p.id}`} className="relative block aspect-[16/9] bg-pale overflow-hidden" aria-label={`View ${p.name}`}>
        {p.coverImageUrl || p.avatarUrl ? (
          <img src={p.coverImageUrl || p.avatarUrl} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar name={p.name} size={64} />
          </div>
        )}
        {p.matchedCategory && (
          <span className="absolute left-3 top-3 h-6 px-2 rounded bg-white/95 text-[12px] font-medium text-navy flex items-center">
            {catalog.categoryLabel(p.matchedCategory)}
          </span>
        )}
      </Link>
      {onToggleFavourite && (
        <button onClick={() => onToggleFavourite(p.id)} aria-pressed={favourite}
          aria-label={favourite ? `Remove ${p.name} from favourites` : `Save ${p.name} to favourites`}
          className="absolute right-3 top-3 w-9 h-9 rounded-full bg-white/95 shadow-card flex items-center justify-center hover:bg-white">
          <Heart className={cx('w-[18px] h-[18px]', favourite ? 'fill-danger text-danger' : 'text-ink')} />
        </button>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/p/${p.id}`} className="min-w-0">
            <h3 className="t-h4 truncate hover:text-navy">{p.businessName || p.name}</h3>
            {p.businessName && <p className="t-caption truncate">{p.name}</p>}
          </Link>
          {p.averageRating != null ? (
            <span className="flex items-center gap-1 shrink-0 t-small font-semibold" aria-label={`Rated ${p.averageRating} from ${p.reviewCount} reviews`}>
              <Star className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" aria-hidden />
              {p.averageRating.toFixed(1)}
              <span className="font-normal text-muted">({p.reviewCount})</span>
            </span>
          ) : (
            <span className="t-caption shrink-0">New</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 t-caption">
          {p.verified && (
            <span className="flex items-center gap-1 text-success font-medium"><BadgeCheck className="w-4 h-4" aria-hidden /> Verified</span>
          )}
          {location && <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden /><span className="truncate">{location}</span></span>}
          {p.distanceKm != null && <span>{p.distanceKm} km away</span>}
          {p.experienceYears > 0 && <span>{p.experienceYears} yrs experience</span>}
        </div>
        {p.cuisines?.length > 0 && (
          <p className="t-small text-muted truncate">{p.cuisines.slice(0, 3).join(' · ')}</p>
        )}
        <div className="mt-auto pt-3 border-t border-line flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="t-caption">Starting from</p>
            <p className="font-heading font-semibold text-[15px] truncate">{priceLabel(p.startingPrice, p.pricingModel, catalog.pricingLabels)}</p>
          </div>
          <Link to={`/p/${p.id}`} className="btn btn-outline btn-sm shrink-0">View</Link>
        </div>
      </div>
    </article>
  );
}
