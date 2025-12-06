import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Bell, Check, Trash2, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, Notification, NotificationType } from '../services/notifications/notificationService';
import { supabase } from '../lib/supabase';

interface NotificationsPageProps {
  onBack: () => void;
  onNavigate?: (page: string, options?: any) => void;
}

export default function NotificationsPage({ onBack, onNavigate }: NotificationsPageProps) {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | NotificationType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (profile?.id) {
      loadNotifications();
      subscribeToRealtime();
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [profile?.id]);

  const subscribeToRealtime = () => {
    if (!user?.id) return;

    // Remove existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  const loadNotifications = async () => {
    if (!profile?.id) {
      setError('User not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await notificationService.getNotifications(profile.id, 100);
      if (result.success) {
        setNotifications(result.notifications || []);
      } else {
        setError(result.error || 'Failed to load notifications');
        console.error('[NotificationsPage] Error loading notifications:', result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[NotificationsPage] Exception loading notifications:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        );
      } else {
        console.error('[NotificationsPage] Failed to mark as read:', result.error);
      }
    } catch (err) {
      console.error('[NotificationsPage] Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!profile?.id) return;

    try {
      const result = await notificationService.markAllAsRead(profile.id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
      } else {
        console.error('[NotificationsPage] Failed to mark all as read:', result.error);
      }
    } catch (err) {
      console.error('[NotificationsPage] Error marking all as read:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } else {
        console.error('[NotificationsPage] Failed to delete notification:', result.error);
      }
    } catch (err) {
      console.error('[NotificationsPage] Error deleting notification:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.related_prospect_id && onNavigate) {
      onNavigate('prospect-detail', { prospectId: notification.related_prospect_id });
    }
  };

  const filteredNotifications =
    filter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="flex items-center justify-center size-9 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="size-5" />
              </button>

              <div className="min-w-0">
                <h1 className="text-xl font-bold">Notifications</h1>
                <p className="text-white/80 text-xs">
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : 'All caught up!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                  <span className="sm:hidden">Read all</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'hot_lead', 'followup_due', 'sequence_action', 'streak_reminder', 'weekly_report'] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  filter === f
                    ? 'bg-[#1877F2] text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {f === 'all' ? (
                  <>
                    <Filter className="w-4 inline mr-2" />
                    All
                  </>
                ) : (
                  <>
                    <span className="mr-2">
                      {notificationService.getNotificationIcon(f as NotificationType)}
                    </span>
                    {f.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </>
                )}
              </button>
            )
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 mb-1">Error loading notifications</p>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? "You don't have any notifications yet."
                : `No ${filter.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} notifications.`}
            </p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const icon = notificationService.getNotificationIcon(notification.type);
              const color = notificationService.getNotificationColor(notification.type);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-lg transition-all cursor-pointer ${
                    !notification.is_read ? 'border-blue-200 bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 text-white text-xl`}
                    >
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 leading-tight">{notification.title}</h3>
                        {!notification.is_read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-gray-700 leading-relaxed mb-3">{notification.message}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{getTimeAgo(notification.created_at)}</span>

                        <div className="flex gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark read</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
