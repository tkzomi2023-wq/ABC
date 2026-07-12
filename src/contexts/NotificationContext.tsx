import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, Notification } from '../lib/supabase';
import { useAuth } from './AuthContext';

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  adminUnreadMessages: number;
  totalBadge: number;
  pushSupported: boolean;
  pushEnabled: boolean;
  markAllRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  enablePush: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  adminUnreadMessages: 0,
  totalBadge: 0,
  pushSupported: false,
  pushEnabled: false,
  markAllRead: async () => {},
  markAsRead: async () => {},
  enablePush: async () => {},
  refreshNotifications: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminUnreadMessages, setAdminUnreadMessages] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  }, [user]);

  const fetchAdminUnread = useCallback(async () => {
    if (!user || profile?.role !== 'admin') return;
    const { count } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    setAdminUnreadMessages(count ?? 0);
  }, [user, profile]);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
    await fetchAdminUnread();
  }, [fetchNotifications, fetchAdminUnread]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchAdminUnread();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchNotifications, fetchAdminUnread]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const enablePush = useCallback(async () => {
    if (!pushSupported || !user) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: undefined,
      });

      const token = sub.endpoint;
      await supabase.from('push_subscriptions').upsert(
        { user_id: user.id, fcm_token: token, device_type: 'web' },
        { onConflict: 'user_id' }
      );
      setPushEnabled(true);
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
  }, [pushSupported, user]);

  useEffect(() => {
    if (pushSupported && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setPushEnabled(!!sub);
      }).catch(() => {});
    }
  }, [pushSupported]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const totalBadge = unreadCount + adminUnreadMessages;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        adminUnreadMessages,
        totalBadge,
        pushSupported,
        pushEnabled,
        markAllRead,
        markAsRead,
        enablePush,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
