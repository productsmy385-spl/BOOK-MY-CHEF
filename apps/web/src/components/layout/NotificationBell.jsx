import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { api } from '../../services/api';

export default function NotificationBell({ to = '/notifications' }) {
  const { data } = useQuery({ queryKey: ['unread'], queryFn: api.notifications.unread, refetchInterval: 60_000 });
  const count = data?.count || 0;
  return (
    <Link to={to} className="btn-icon relative" aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}>
      <Bell className="w-5 h-5" aria-hidden />
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
