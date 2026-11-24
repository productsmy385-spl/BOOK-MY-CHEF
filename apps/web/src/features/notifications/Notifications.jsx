import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellOff } from 'lucide-react';
import { api } from '../../services/api';
import { relativeTime } from '../../lib/format';
import { Alert, Button, EmptyState, PageHeader, Spinner, cx } from '../../components/ui';

export default function Notifications() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({ queryKey: ['notifications'], queryFn: () => api.notifications.list(0) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unread'] }); };
  const readAll = useMutation({ mutationFn: api.notifications.readAll, onSuccess: refresh });
  const open = async (n) => {
    if (!n.read) { await api.notifications.read(n.id).catch(() => {}); refresh(); }
    if (n.actionUrl) navigate(n.actionUrl);
  };
  const unread = data?.items.some((n) => !n.read);

  return (
    <div className="page max-w-3xl pb-10">
      <PageHeader title="Notifications" action={unread && <Button variant="ghost" size="sm" loading={readAll.isPending} onClick={() => readAll.mutate()}>Mark all read</Button>} />
      {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : !data.items.length ? (
        <EmptyState icon={BellOff} title="You're all caught up">Updates about your bookings will appear here.</EmptyState>
      ) : (
        <ul className="panel divide-y divide-line overflow-hidden">
          {data.items.map((n) => (
            <li key={n.id}>
              <button onClick={() => open(n)} className={cx('w-full text-left p-4 flex gap-3 hover:bg-canvas', !n.read && 'bg-pale/50')}>
                <span className={cx('w-2 h-2 rounded-full mt-2 shrink-0', n.read ? 'bg-transparent' : 'bg-brand')} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="t-h4 block">{n.title}</span>
                  <span className="t-small text-muted block break-words">{n.message}</span>
                  <span className="t-caption block mt-1">{relativeTime(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
