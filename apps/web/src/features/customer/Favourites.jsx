import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Heart, Star } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { useFavourites } from '../../hooks/useFavourites';
import { Alert, Avatar, EmptyState, PageHeader, Spinner } from '../../components/ui';

export default function Favourites() {
  const catalog = useCatalog();
  const favs = useFavourites();
  const { data, isLoading, error } = useQuery({ queryKey: ['favourites'], queryFn: api.customer.favourites });

  return (
    <div className="page max-w-3xl pb-10">
      <PageHeader title="Favourites" subtitle="Providers you saved" />
      {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.length ? (
        <EmptyState icon={Heart} title="No favourites yet" action={<Link to="/explore" className="btn btn-primary">Explore providers</Link>}>
          Tap the heart on any provider to save them here.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((p) => (
            <li key={p.id} className="panel p-4 flex items-center gap-3">
              <Avatar src={p.avatarUrl} name={p.name} size={52} />
              <Link to={`/p/${p.id}`} className="min-w-0 flex-1">
                <p className="t-h4 truncate hover:text-navy">{p.businessName || p.name}</p>
                <p className="t-small text-muted truncate">{[catalog.categoryLabel(p.primaryCategory), p.locality, p.city].filter(Boolean).join(' · ')}</p>
                <p className="t-caption flex items-center gap-3 mt-1">
                  {p.verified && <span className="flex items-center gap-1 text-success"><BadgeCheck className="w-3.5 h-3.5" />Verified</span>}
                  {p.averageRating != null && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />{Number(p.averageRating).toFixed(1)} ({p.reviewCount})</span>}
                  {!p.available && <span className="text-warning">Not taking bookings</span>}
                </p>
              </Link>
              <button className="btn-icon" onClick={() => favs.toggle(p.id)} aria-label={`Remove ${p.name} from favourites`}>
                <Heart className="w-5 h-5 fill-danger text-danger" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
