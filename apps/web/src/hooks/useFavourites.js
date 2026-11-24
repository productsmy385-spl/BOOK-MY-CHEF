import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';

/** Saved providers for the signed-in customer; prompts sign-in otherwise. */
export function useFavourites() {
  const { status, account } = useAuthStore();
  const isCustomer = status === 'ready' && account?.userType === 'CUSTOMER';
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['favouriteIds'], queryFn: api.customer.favouriteIds, enabled: isCustomer });
  const ids = new Set(data || []);

  const mutation = useMutation({
    mutationFn: ({ id, add }) => (add ? api.customer.addFavourite(id) : api.customer.removeFavourite(id)),
    onMutate: async ({ id, add }) => {
      await qc.cancelQueries({ queryKey: ['favouriteIds'] });
      const prev = qc.getQueryData(['favouriteIds']) || [];
      qc.setQueryData(['favouriteIds'], add ? [...prev, id] : prev.filter((x) => x !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['favouriteIds'], ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['favouriteIds'] });
      qc.invalidateQueries({ queryKey: ['favourites'] });
    },
  });

  const toggle = (id) => {
    if (!isCustomer) {
      navigate(`/auth/customer?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    mutation.mutate({ id, add: !ids.has(id) });
  };

  return { ids, toggle, enabled: status !== 'ready' || isCustomer };
}
