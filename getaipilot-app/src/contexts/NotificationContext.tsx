import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type {
  Notification,
  EventSubscription,
  NotificationResponse,
} from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { AppState, Platform } from 'react-native';
import { NotificationService, PUSH_TOKEN_STORAGE_KEY } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NotificationsModule = typeof import('expo-notifications');

let Notifications: NotificationsModule | null = null;
try {
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  createdAt: string;
  isRead: boolean;
  type?:
  | 'lead'
  | 'message'
  | 'billing'
  | 'system'
  | 'general'
  | 'info'
  | 'broadcast'
  | 'announcement'
  | 'page_click'
  | 'page_view'
  | 'analytics';
}

export const NOTIFICATIONS_STORAGE_KEY = '@getaipilot_notifications_history';

export interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notification | null;
  clearNotification: () => void;
  permissionGranted: boolean;
  isDevice: boolean;
  isRegistering: boolean;
  requestPermissions: () => Promise<string | null>;
  forceRefreshToken: () => Promise<string | null>;
  sendTestNotification: (
    title?: string,
    body?: string,
    channelId?: string,
    route?: string,
    imageUrl?: string,
    delaySeconds?: number
  ) => Promise<void>;
  notificationsList: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  toggleReadStatus: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (
    item: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { id?: string }
  ) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  syncPageClickNotifications: () => Promise<void>;
  isRefreshing: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOOP_CONTEXT: NotificationContextType = {
  expoPushToken: null,
  notification: null,
  clearNotification: () => { },
  permissionGranted: false,
  isDevice: false,
  isRegistering: false,
  requestPermissions: async () => null,
  forceRefreshToken: async () => null,
  sendTestNotification: async () => { },
  notificationsList: [],
  unreadCount: 0,
  markAsRead: async () => { },
  toggleReadStatus: async () => { },
  markAllAsRead: async () => { },
  deleteNotification: async () => { },
  clearAllNotifications: async () => { },
  addNotification: async () => { },
  refreshNotifications: async () => { },
  syncPageClickNotifications: async () => { },
  isRefreshing: false,
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const canUseNotifications = Boolean(Notifications);

  const router = useRouter();
  const { user } = useAuth();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [notificationsList, setNotificationsList] = useState<AppNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const appIsActiveRef = useRef<boolean>(AppState.currentState === 'active');

  const getStorageKey = useCallback((uid?: string) => {
    return uid
      ? `@getaipilot_notifications_${uid}_v2`
      : '@getaipilot_notifications_guest_v2';
  }, []);

  // ------------------------------------------------------------------
  // ONE canonical dedupe namespace, keyed by row id.
  // ------------------------------------------------------------------
  const processedKeys = useRef<Set<string>>(new Set());

  const isDuplicate = useCallback((key: string, ttlMs = 5 * 60_000): boolean => {
    if (processedKeys.current.has(key)) return true;
    processedKeys.current.add(key);
    setTimeout(() => processedKeys.current.delete(key), ttlMs);
    return false;
  }, []);

  const notifKey = (id: string) => `notif:${id}`;

  // ------------------------------------------------------------------
  // Persistence
  // ------------------------------------------------------------------
  const persist = useCallback(
    async (items: AppNotification[], uid?: string) => {
      setNotificationsList(items);
      try {
        await AsyncStorage.setItem(getStorageKey(uid ?? user?.id), JSON.stringify(items));
      } catch (e) {
        console.warn('Failed to save notifications history:', e);
      }
    },
    [getStorageKey, user?.id]
  );

  const saveNotifications = useCallback(
    async (items: AppNotification[]) => {
      await persist(items, user?.id);
    },
    [persist, user?.id]
  );

  useEffect(() => {
    (async () => {
      try {
        const key = getStorageKey(user?.id);
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setNotificationsList(parsed);
            return;
          }
        }
        setNotificationsList([]);
      } catch (e) {
        console.warn('Failed to load notifications history:', e);
      }
    })();
  }, [user?.id, getStorageKey]);

  // ------------------------------------------------------------------
  // Route resolution
  // ------------------------------------------------------------------
  const resolveRoute = useCallback((data?: Record<string, any>): string | null => {
    if (!data) return null;
    if (data.route && typeof data.route === 'string') return data.route;
    if (data.url && typeof data.url === 'string') return data.url;

    const type = data.type || data.category;
    if (type === 'lead') return '/crm/contacts';
    if (type === 'deal') return '/crm/deals';
    if (type === 'task') return '/crm/tasks';
    if (type === 'message' || type === 'chat' || type === 'handover' || data.conversationId) {
      return data.conversationId ? `/inbox/${data.conversationId}` : '/inbox';
    }
    if (type === 'team' || type === 'team_member') return '/crm';
    if (type === 'social' || type === 'social_connected') return '/tools';
    if (type === 'whatsapp' || type === 'whatsapp_connected') return '/(tabs)';
    if (type === 'template' || type === 'template_verified') return '/(tabs)';
    if (type === 'billing' || type === 'quota') return '/account/plans';
    if (type === 'campaign') return '/fleet';
    if (type === 'call') return '/(tabs)/activity';
    if (type === 'broadcast' || type === 'announcement') return '/(tabs)';
    if (type === 'maintenance') return '/(tabs)';
    if (type === 'feature' || type === 'tools') return '/tools';
    if (type === 'offer' || type === 'pricing') return '/pricing';
    if (
      type === 'page_click' ||
      type === 'page_view' ||
      type === 'analytics' ||
      type === 'landing' ||
      type === 'bio'
    ) {
      return '/tools/my-designs';
    }
    return null;
  }, []);

  // ------------------------------------------------------------------
  // Upsert into list, keyed by AppNotification.id.
  // ------------------------------------------------------------------
  const upsertNotification = useCallback(
    (item: AppNotification, uid?: string) => {
      setNotificationsList((prev) => {
        const idx = prev.findIndex((p) => p.id === item.id);
        let next: AppNotification[];
        if (idx >= 0) {
          const existing = prev[idx];
          const merged: AppNotification = {
            ...existing,
            ...item,
            isRead: existing.isRead || item.isRead,
          };
          next = [merged, ...prev.filter((_, i) => i !== idx)];
        } else {
          next = [item, ...prev];
        }
        AsyncStorage.setItem(getStorageKey(uid ?? user?.id), JSON.stringify(next)).catch(() => { });
        return next;
      });
    },
    [getStorageKey, user?.id]
  );

  // ------------------------------------------------------------------
  // Fetch from Supabase — pure list-refresh. No local scheduling.
  // ------------------------------------------------------------------
  const fetchSupabaseNotifications = useCallback(
    async (userId?: string) => {
      const uid = userId || user?.id;
      if (!uid) return;

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${uid},user_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(60);

        if (error) {
          console.warn('⚠️ [NotificationContext] Supabase fetch notice:', error.message);
          return;
        }
        if (!Array.isArray(data)) return;

        const remoteItems: AppNotification[] = data.map((row: any) => ({
          id: String(row.id),
          title: row.title || 'Notification',
          body: row.description || '',
          data: {
            type: row.type,
            userId: row.user_id,
            route: resolveRoute({ type: row.type }),
            id: row.id,
          },
          createdAt: row.created_at || new Date().toISOString(),
          isRead: Boolean(row.is_read),
          type: (row.type as any) || 'general',
        }));

        setNotificationsList((prev) => {
          const prevById = new Map(prev.map((p) => [p.id, p]));
          const merged: AppNotification[] = [];

          for (const r of remoteItems) {
            const existing = prevById.get(r.id);
            merged.push(
              existing ? { ...existing, ...r, isRead: existing.isRead || r.isRead } : r
            );
            prevById.delete(r.id);
          }

          for (const leftover of prevById.values()) {
            const targetUid = leftover.data?.userId || leftover.data?.user_id;
            if (targetUid && targetUid !== uid) continue;
            merged.push(leftover);
          }

          merged.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(merged)).catch(() => { });
          return merged;
        });
      } catch (fetchErr) {
        console.warn('[NotificationContext] Error fetching remote notifications:', fetchErr);
      }
    },
    [user?.id, resolveRoute, getStorageKey]
  );

  // ------------------------------------------------------------------
  // Client no longer detects milestones or schedules pushes.
  // It just refreshes the list — server is the single source of truth.
  // ------------------------------------------------------------------
  const syncPageClickNotifications = useCallback(
    async (userId?: string) => {
      await fetchSupabaseNotifications(userId);
    },
    [fetchSupabaseNotifications]
  );

  const refreshNotifications = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchSupabaseNotifications(), syncPageClickNotifications()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchSupabaseNotifications, syncPageClickNotifications]);

  useEffect(() => {
    if (!user?.id) return;

    setNotificationsList((prev) => {
      const cleaned = prev.filter((p) => {
        const targetUid = p.data?.userId || p.data?.user_id;
        return !targetUid || targetUid === user.id;
      });
      if (cleaned.length !== prev.length) {
        AsyncStorage.setItem(getStorageKey(user.id), JSON.stringify(cleaned)).catch(() => { });
      }
      return cleaned;
    });

    fetchSupabaseNotifications(user.id);
    syncPageClickNotifications(user.id);
  }, [user?.id, fetchSupabaseNotifications, syncPageClickNotifications, getStorageKey]);

  // ------------------------------------------------------------------
  // Realtime: INSERT → update list only (NO scheduleLocalNotification).
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!user?.id) return;

    const uid = user.id;

    const channel = supabase
      .channel(`user-notifications-${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newRow = payload.new as any;
          if (!newRow) return;
          if (newRow.user_id && newRow.user_id !== uid) return;

          const id = String(newRow.id);
          if (isDuplicate(notifKey(id))) return;

          const item: AppNotification = {
            id,
            title: newRow.title || 'Notification',
            body: newRow.description || '',
            data: {
              type: newRow.type,
              userId: newRow.user_id,
              route: resolveRoute({ type: newRow.type }),
              id: newRow.id,
            },
            createdAt: newRow.created_at || new Date().toISOString(),
            isRead: Boolean(newRow.is_read),
            type: (newRow.type as any) || 'general',
          };

          // NOTE: Do NOT call NotificationService.scheduleLocalNotification here.
          // The backend push is what produces the OS banner. Adding a local
          // schedule here was the source of the duplicate banners.
          upsertNotification(item, uid);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          const updatedRow = payload.new as any;
          if (!updatedRow) return;
          if (updatedRow.user_id && updatedRow.user_id !== uid) return;

          setNotificationsList((prev) => {
            const next = prev.map((n) =>
              n.id === updatedRow.id
                ? {
                  ...n,
                  isRead: Boolean(updatedRow.is_read),
                  title: updatedRow.title || n.title,
                  body: updatedRow.description || n.body,
                }
                : n
            );
            AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(next)).catch(() => { });
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications' },
        (payload) => {
          const oldRow = payload.old as any;
          if (!oldRow?.id) return;
          setNotificationsList((prev) => {
            const next = prev.filter((n) => n.id !== oldRow.id);
            AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(next)).catch(() => { });
            return next;
          });
        }
      )
      // Page-metric tables only drive the list refresh (server owns milestone inserts)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'landing_template_submissions',
          filter: `user_id=eq.${uid}`,
        },
        () => fetchSupabaseNotifications(uid)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'free_template_submissions',
          filter: `user_id=eq.${uid}`,
        },
        () => fetchSupabaseNotifications(uid)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tg_landing_pages',
          filter: `user_id=eq.${uid}`,
        },
        () => fetchSupabaseNotifications(uid)
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      if (!appIsActiveRef.current) return;
      fetchSupabaseNotifications(uid);
    }, 30_000);

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      appIsActiveRef.current = nextState === 'active';
      if (nextState === 'active') {
        fetchSupabaseNotifications(uid);
        if (channel.state === 'closed' || channel.state === 'errored') {
          channel.subscribe();
        }
      }
    });

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      appStateSub.remove();
    };
  }, [
    user?.id,
    fetchSupabaseNotifications,
    resolveRoute,
    isDuplicate,
    upsertNotification,
    getStorageKey,
  ]);

  // ------------------------------------------------------------------
  // List mutations
  // ------------------------------------------------------------------
  const addNotification = async (
    item: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { id?: string }
  ) => {
    const newItem: AppNotification = {
      id: item.id || Date.now().toString() + Math.random().toString(36).substring(2, 6),
      title: item.title,
      body: item.body,
      data: item.data,
      imageUrl: item.imageUrl || item.data?.imageUrl || item.data?.image,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: item.type || 'general',
    };
    if (isDuplicate(notifKey(newItem.id))) return;
    upsertNotification(newItem, user?.id);
  };

  const markAsRead = async (id: string) => {
    const updated = notificationsList.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    await saveNotifications(updated);
    if (user?.id) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (e) {
        console.warn('[NotificationContext] Failed to sync markAsRead:', e);
      }
    }
  };

  const toggleReadStatus = async (id: string) => {
    const target = notificationsList.find((n) => n.id === id);
    const newStatus = target ? !target.isRead : true;
    const updated = notificationsList.map((n) => (n.id === id ? { ...n, isRead: newStatus } : n));
    await saveNotifications(updated);
    if (user?.id) {
      try {
        await supabase.from('notifications').update({ is_read: newStatus }).eq('id', id);
      } catch (e) {
        console.warn('[NotificationContext] Failed to sync toggleRead:', e);
      }
    }
  };

  const markAllAsRead = async () => {
    const updated = notificationsList.map((n) => ({ ...n, isRead: true }));
    await saveNotifications(updated);
    if (user?.id) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      } catch (e) {
        console.warn('[NotificationContext] Failed to sync markAllAsRead:', e);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    const updated = notificationsList.filter((n) => n.id !== id);
    await saveNotifications(updated);
    if (user?.id) {
      try {
        await supabase.from('notifications').delete().eq('id', id);
      } catch (e) {
        console.warn('[NotificationContext] Failed to sync delete:', e);
      }
    }
  };

  const clearAllNotifications = async () => {
    await saveNotifications([]);
    if (user?.id) {
      try {
        await supabase.from('notifications').delete().eq('user_id', user.id);
      } catch (e) {
        console.warn('[NotificationContext] Failed to sync clearAll:', e);
      }
    }
  };

  const unreadCount = notificationsList.filter((n) => !n.isRead).length;

  // ------------------------------------------------------------------
  // Foreground receive + tap response
  // ------------------------------------------------------------------
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);
  const lastHandledNotificationId = useRef<string | null>(null);

  const clearNotification = () => setNotification(null);

  const handleNotificationResponse = (response: NotificationResponse) => {
    const notifId = response?.notification?.request?.identifier;
    if (notifId && lastHandledNotificationId.current === notifId) return;
    if (notifId) lastHandledNotificationId.current = notifId;

    const data = response?.notification?.request?.content?.data as Record<string, any> | undefined;
    const targetUserId = data?.userId || data?.user_id;
    if (
      targetUserId &&
      user?.id &&
      targetUserId !== user.id &&
      !data?.isTest &&
      data?.type !== 'test' &&
      data?.type !== 'broadcast'
    ) {
      return;
    }

    const targetRoute = resolveRoute(data);
    if (!targetRoute) return;

    const navigate = (isRetry = false) => {
      try {
        router.push(targetRoute as any);
      } catch (routeErr) {
        console.warn(
          `[NotificationContext] Navigation error (retry=${isRetry}):`,
          routeErr
        );
        if (!isRetry) setTimeout(() => navigate(true), 1500);
      }
    };
    setTimeout(() => navigate(false), 800);
  };

  const requestPermissions = async (): Promise<string | null> => {
    if (!Notifications) return null;
    if (isRegistering) return expoPushToken;
    setIsRegistering(true);
    try {
      const result = await NotificationService.registerForPushNotificationsAsync();
      const granted = result.status === 'granted';
      setPermissionGranted(granted);

      if (result.token) {
        setExpoPushToken(result.token);
        if (user?.id) {
          await NotificationService.syncPushTokenWithBackend(result.token, user.id);
        }
        return result.token;
      }
      return null;
    } catch (err) {
      console.warn('❌ [NotificationContext] Registration error:', err);
      return null;
    } finally {
      setIsRegistering(false);
    }
  };

  const forceRefreshToken = async (): Promise<string | null> => {
    setIsRegistering(true);
    try {
      const token = await NotificationService.forceRefreshToken(user?.id);
      if (token) setExpoPushToken(token);
      return token;
    } finally {
      setIsRegistering(false);
    }
  };

  const sendTestNotification = async (
    title = 'GetAiPilot Push Notification',
    body = 'Your push notifications are configured and active in your ecosystem.',
    channelId = 'default',
    route = '/account/plans',
    imageUrl?: string,
    delaySeconds?: number
  ) => {
    if (!Notifications) return;
    await NotificationService.scheduleLocalNotification({
      title,
      body,
      channelId,
      imageUrl,
      delaySeconds,
      data: { route, ...(imageUrl ? { imageUrl } : {}) },
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
        if (cached) setExpoPushToken(cached);
      } catch {
        /* noop */
      }
    })();
  }, []);

  useEffect(() => {
    if (!canUseNotifications || !Notifications) return;
    if (Platform.OS === 'web') return;

    NotificationService.setupChannels().catch((err) => {
      console.warn('[NotificationContext] Channel setup error:', err);
    });

    Notifications.getPermissionsAsync()
      .then(({ status }) => setPermissionGranted(status === 'granted'))
      .catch(() => { });

    requestPermissions().catch(() => { });
  }, [canUseNotifications]);

  useEffect(() => {
    if (user?.id && expoPushToken) {
      NotificationService.syncPushTokenWithBackend(expoPushToken, user.id).catch(() => { });
    }
  }, [user?.id, expoPushToken]);

  useEffect(() => {
    if (!canUseNotifications || !Notifications) return;
    if (Platform.OS === 'web') return;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleNotificationResponse(response);
      })
      .catch(() => { });

    notificationListener.current = Notifications.addNotificationReceivedListener((incoming) => {
      const content = incoming?.request?.content;
      if (!content) return;

      const data = (content.data || {}) as Record<string, any>;
      const targetUserId = data.userId || data.user_id;

      if (
        targetUserId &&
        user?.id &&
        targetUserId !== user.id &&
        !data.isTest &&
        data.type !== 'test' &&
        data.type !== 'broadcast'
      ) {
        return;
      }

      // Canonical id = the DB row id. The Expo identifier is only a fallback.
      const canonicalId = String(data.id || incoming.request.identifier);
      if (isDuplicate(notifKey(canonicalId))) return;

      setNotification(incoming);

      const type = (data.type as any) || (data.category as any) || 'general';
      const notifImageUrl = data.imageUrl || data.image || (content as any).imageUrl;
      const newItem: AppNotification = {
        id: canonicalId,
        title: content.title || 'New Alert',
        body: content.body || '',
        data,
        imageUrl: notifImageUrl,
        createdAt: new Date().toISOString(),
        isRead: false,
        type,
      };

      upsertNotification(newItem, user?.id);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, canUseNotifications, user?.id, isDuplicate, upsertNotification]);

  if (!canUseNotifications || !Notifications) {
    return (
      <NotificationContext.Provider value={NOOP_CONTEXT}>{children}</NotificationContext.Provider>
    );
  }

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        clearNotification,
        permissionGranted,
        isDevice: Boolean(Device.isDevice),
        isRegistering,
        requestPermissions,
        forceRefreshToken,
        sendTestNotification,
        notificationsList,
        unreadCount,
        markAsRead,
        toggleReadStatus,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        refreshNotifications,
        syncPageClickNotifications,
        isRefreshing,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}