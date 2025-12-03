import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notifications/notificationService';

interface NotificationCenterProps {
  onNavigate?: (page: string, options?: any) => void;
}

export default function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      loadUnreadCount();

      const unsubscribe = notificationService.subscribeToNotifications(
        profile.id,
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      );

      return () => unsubscribe();
    }
  }, [profile?.id]);

  const loadUnreadCount = async () => {
    if (!profile?.id) return;

    const result = await notificationService.getUnreadCount(profile.id);
    if (result.success) {
      setUnreadCount(result.count);
    }
  };

  const handleClick = () => {
    if (onNavigate) {
      onNavigate('notifications');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
    >
      <Bell className="w-6 h-6 text-gray-700" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
