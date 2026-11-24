import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';

/** The provider's own full profile. Every mutation returns the fresh profile from the server. */
export function useProviderMe() {
  return useQuery({ queryKey: ['providerMe'], queryFn: api.me.get });
}

export function useProviderMutation(fn) {
  const qc = useQueryClient();
  const patchAccount = useAuthStore((s) => s.patchAccount);
  return useMutation({
    mutationFn: fn,
    onSuccess: (me) => {
      if (me && me.id) {
        qc.setQueryData(['providerMe'], me);
        patchAccount({ providerOnboardingStatus: me.onboardingStatus, providerVerificationStatus: me.verificationStatus,
          avatarUrl: me.avatarUrl, fullName: me.name });
      }
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      // Customer-facing views read the same data; make sure they refetch.
      qc.invalidateQueries({ queryKey: ['search'] });
      qc.invalidateQueries({ queryKey: ['provider'] });
    },
  });
}
