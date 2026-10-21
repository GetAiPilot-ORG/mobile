import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type {
  Notification,
  EventSubscription,
  NotificationResponse,
} from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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
  sendTestNotification: (
    title?: string,
    body?: string,
    channelId?: string,
    route?: string
  ) => Promise<void>;
  notificationsList: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  toggleReadStatus: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (item: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { id?: string }) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  syncPageClickNotifications: () => Promise<void>;
  isRefreshing: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * No-op context used when running in Expo Go (notifications unavailable).
 * All hooks in NotificationProvider still run; consumers simply receive inert values.
 */
const NOOP_CONTEXT: NotificationContextType = {
  expoPushToken: null,
  notification: null,
  clearNotification: () => { },
  permissionGranted: false,
  isDevice: false,
  isRegistering: false,
  requestPermissions: async () => null,
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
  // Can use notifications if module loaded
  const canUseNotifications = Boolean(Notifications);

  const router = useRouter();
  const { user } = useAuth();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [notificationsList, setNotificationsList] = useState<AppNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStorageKey = useCallback((uid?: string) => {
    return uid ? `@getaipilot_notifications_${uid}_v2` : '@getaipilot_notifications_guest_v2';
  }, []);

  // Load notifications from AsyncStorage whenever user changes or on mount
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
        } else {
          setNotificationsList([]);
        }
      } catch (e) {
        console.warn('Failed to load notifications history:', e);
      }
    })();
  }, [user?.id, getStorageKey]);

  const saveNotifications = async (items: AppNotification[]) => {
    setNotificationsList(items);
    try {
      const key = getStorageKey(user?.id);
      await AsyncStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save notifications history:', e);
    }
  };

  // Deduplication tracker to prevent duplicate notifications from firing within 12s
  const processedNotificationKeys = useRef<Set<string>>(new Set());

  const isDuplicateNotification = useCallback((key: string): boolean => {
    if (processedNotificationKeys.current.has(key)) return true;
    processedNotificationKeys.current.add(key);
    setTimeout(() => {
      processedNotificationKeys.current.delete(key);
    }, 12000);
    return false;
  }, []);

  /**
   * Helper to map notification data payload to an app route
   */
  const resolveRoute = useCallback((data?: Record<string, any>): string | null => {
    if (!data) return null;
    if (data.route && typeof data.route === 'string') return data.route;
    if (data.url && typeof data.url === 'string') return data.url;

    // By event/type fallback
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

    // Admin & system broadcast updates for regular mobile users
    if (type === 'broadcast' || type === 'announcement') return '/(tabs)';
    if (type === 'maintenance') return '/(tabs)';
    if (type === 'feature' || type === 'tools') return '/tools';
    if (type === 'offer' || type === 'pricing') return '/pricing';

    // Landing & Bio Page Clicks & Views
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

  /**
   * Fetch user notifications from Supabase `notifications` table
   * Matches notifications generated by admin RPC `broadcast_notification`
   */
  const fetchSupabaseNotifications = useCallback(async (userId?: string) => {
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
        console.warn('⚠️ [NotificationContext] Supabase notifications fetch notice:', error.message);
        return;
      }

      if (Array.isArray(data)) {
        const remoteItems: AppNotification[] = data.map((row: any) => ({
          id: row.id,
          title: row.title || 'Notification',
          body: row.description || '',
          data: { type: row.type, userId: row.user_id, route: resolveRoute({ type: row.type }) },
          createdAt: row.created_at || new Date().toISOString(),
          isRead: Boolean(row.is_read),
          type: (row.type as any) || 'general',
        }));

        setNotificationsList((prev) => {
          // Merge remote items, preserving any local items not yet in remote,
          // but strictly ensure notifications targeted for other users are filtered out
          const remoteIds = new Set(remoteItems.map((r) => r.id));
          const localOnly = prev.filter((p) => {
            if (remoteIds.has(p.id)) return false;
            const targetUid = p.data?.userId || p.data?.user_id;
            if (targetUid && targetUid !== uid) return false;
            return true;
          });
          const merged = [...remoteItems, ...localOnly].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(merged)).catch(() => {});
          return merged;
        });
      }
    } catch (fetchErr) {
      console.warn('[NotificationContext] Error fetching remote notifications:', fetchErr);
    }
  }, [user?.id, resolveRoute]);

  /**
   * Monitor user's landing pages and bio pages for click count and view updates.
   * Scoped strictly to pages where user_id === user.id.
   * Sends real-time notification to the user when their page receives new clicks.
   */
  const syncPageClickNotifications = useCallback(async (userId?: string) => {
    const uid = userId || user?.id;
    if (!uid) return;

    try {
      // 1. Fetch current landing and bio page stats for this specific user
      const [bioRes, landingRes, tgRes] = await Promise.all([
        supabase
          .from('free_template_submissions')
          .select('id, page_title, slug, page_views, button_clicks')
          .eq('user_id', uid),
        supabase
          .from('landing_template_submissions')
          .select('id, page_title, slug, page_views, button_clicks')
          .eq('user_id', uid),
        supabase
          .from('tg_landing_pages')
          .select('id, title, slug, view_count')
          .eq('user_id', uid),
      ]);

      const currentPages: Record<string, { clicks: number; views: number; title: string; type: 'landing' | 'bio' }> = {};

      if (Array.isArray(bioRes.data)) {
        for (const item of bioRes.data) {
          currentPages[`bio_${item.id}`] = {
            clicks: Number(item.button_clicks || 0),
            views: Number(item.page_views || 0),
            title: item.page_title || item.slug || 'Bio Page',
            type: 'bio',
          };
        }
      }

      if (Array.isArray(landingRes.data)) {
        for (const item of landingRes.data) {
          currentPages[`landing_${item.id}`] = {
            clicks: Number(item.button_clicks || 0),
            views: Number(item.page_views || 0),
            title: item.page_title || item.slug || 'Landing Page',
            type: 'landing',
          };
        }
      }

      if (Array.isArray(tgRes.data)) {
        for (const item of tgRes.data) {
          currentPages[`tg_${item.id}`] = {
            clicks: 0,
            views: Number(item.view_count || 0),
            title: item.title || item.slug || 'TG Landing Page',
            type: 'landing',
          };
        }
      }

      const cacheKey = `@getaipilot_page_metrics_${uid}`;
      const storedCache = await AsyncStorage.getItem(cacheKey);

      if (!storedCache) {
        // First initialization for this user: store baseline without triggering historic alerts
        await AsyncStorage.setItem(
          cacheKey,
          JSON.stringify({ pages: currentPages, updatedAt: new Date().toISOString() })
        );
        return;
      }

      let parsedCache: { pages: Record<string, { clicks: number; views: number; title: string; type: 'landing' | 'bio' }> };
      try {
        parsedCache = JSON.parse(storedCache);
      } catch {
        parsedCache = { pages: {} };
      }

      const cachedPages = parsedCache?.pages || {};

      for (const [key, current] of Object.entries(currentPages)) {
        const cached = cachedPages[key];
        if (!cached) continue; // Newly created page, establish baseline on next save

        const prevClicks = cached.clicks || 0;
        const currClicks = current.clicks || 0;
        const prevMilestone = Math.floor(prevClicks / 50) * 50;
        const currMilestone = Math.floor(currClicks / 50) * 50;

        // 1. Detect 50-Click Achievement Milestones (50, 100, 150, 200, 250, ...)
        if (currMilestone >= 50 && currMilestone > prevMilestone) {
          const pageTypeLabel = current.type === 'bio' ? 'Bio' : 'Landing';
          const title = `🏆 ${currMilestone} Clicks Milestone on ${pageTypeLabel} Page!`;
          const description = `Congratulations! Your ${pageTypeLabel.toLowerCase()} page "${current.title}" just crossed ${currMilestone} clicks! Total clicks: ${currClicks} 🎉`;

          const dedupeKey = `${uid}_click_milestone_${currMilestone}_${current.title}`;
          if (!isDuplicateNotification(dedupeKey)) {
            if (Notifications) {
              try {
                await NotificationService.scheduleLocalNotification({
                  title,
                  body: description,
                  channelId: 'analytics',
                  data: {
                    route: '/tools/my-designs',
                    type: 'page_click',
                    milestone: currMilestone,
                  },
                });

                const newItem: AppNotification = {
                  id: `milestone_${currMilestone}_${Date.now()}`,
                  title,
                  body: description,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                  type: 'page_click',
                  data: { route: '/tools/my-designs', type: 'page_click', milestone: currMilestone },
                };

                setNotificationsList((prev) => {
                  const next = [newItem, ...prev.filter((p) => p.id !== newItem.id)];
                  AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(next)).catch(() => {});
                  return next;
                });
              } catch (pushErr) {
                console.warn('[NotificationContext] Local push alert error:', pushErr);
              }
            }
          }
        }

        // 2. Detect 100-View Achievement Milestones (100, 200, 300, ...)
        const prevViews = cached.views || 0;
        const currViews = current.views || 0;
        const prevViewMilestone = Math.floor(prevViews / 100) * 100;
        const currViewMilestone = Math.floor(currViews / 100) * 100;

        if (currViewMilestone >= 100 && currViewMilestone > prevViewMilestone) {
          const pageTypeLabel = current.type === 'bio' ? 'Bio' : 'Landing';
          const title = `👀 ${currViewMilestone} Views Milestone on ${pageTypeLabel} Page!`;
          const description = `Awesome! Your ${pageTypeLabel.toLowerCase()} page "${current.title}" just crossed ${currViewMilestone} views! Total views: ${currViews} 🚀`;

          const dedupeKey = `${uid}_view_milestone_${currViewMilestone}_${current.title}`;
          if (!isDuplicateNotification(dedupeKey)) {
            if (Notifications) {
              try {
                await NotificationService.scheduleLocalNotification({
                  title,
                  body: description,
                  channelId: 'analytics',
                  data: {
                    route: '/tools/my-designs',
                    type: 'page_view',
                    milestone: currViewMilestone,
                  },
                });

                const newItem: AppNotification = {
                  id: `view_milestone_${currViewMilestone}_${Date.now()}`,
                  title,
                  body: description,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                  type: 'page_view',
                  data: { route: '/tools/my-designs', type: 'page_view', milestone: currViewMilestone },
                };

                setNotificationsList((prev) => {
                  const next = [newItem, ...prev.filter((p) => p.id !== newItem.id)];
                  AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(next)).catch(() => {});
                  return next;
                });
              } catch (pushErr) {
                console.warn('[NotificationContext] Local push alert error:', pushErr);
              }
            }
          }
        }
      }

      // Always update cache to latest state
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({ pages: currentPages, updatedAt: new Date().toISOString() })
      );
    } catch (err) {
      console.warn('[NotificationContext] Error in syncPageClickNotifications:', err);
    }
  }, [user?.id]);

  const refreshNotifications = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchSupabaseNotifications(),
        syncPageClickNotifications(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchSupabaseNotifications, syncPageClickNotifications]);

  // Fetch from Supabase whenever user ID changes or logs in
  useEffect(() => {
    if (user?.id) {
      // Purge any stale cached notifications that were meant for a different user
      setNotificationsList((prev) => {
        const cleaned = prev.filter((p) => {
          const targetUid = p.data?.userId || p.data?.user_id;
          return !targetUid || targetUid === user.id;
        });
        if (cleaned.length !== prev.length) {
          AsyncStorage.setItem(getStorageKey(user.id), JSON.stringify(cleaned)).catch(() => {});
        }
        return cleaned;
      });

      fetchSupabaseNotifications(user.id);
      syncPageClickNotifications(user.id);
    }
  }, [user?.id, fetchSupabaseNotifications, syncPageClickNotifications]);

  // Listen for Supabase Realtime INSERTs from admin `broadcast_notification` & page clicks
  useEffect(() => {
    if (!user?.id) return;

    console.log(`🔌 [NotificationContext] Subscribing to Supabase Realtime for user: ${user.id}`);
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          const newRow = payload.new as any;
          if (!newRow) return;

          // Process only if addressed to this user or is a broadcast
          if (newRow.user_id && newRow.user_id !== user.id) return;

          const dedupeKey = `realtime_${newRow.id || (newRow.title + '_' + Date.now())}`;
          if (isDuplicateNotification(dedupeKey)) {
            console.log('🛑 [NotificationContext] Realtime skipping duplicate push:', dedupeKey);
            return;
          }

          console.log('🔔 [Realtime Notification Received]:', newRow.title);

          // 1. Immediately trigger native push notification banner on the device
          if (Notifications) {
            try {
              await NotificationService.scheduleLocalNotification({
                title: newRow.title || 'GetAiPilot Notification',
                body: newRow.description || '',
                channelId: newRow.type === 'page_click' || newRow.type === 'page_view' ? 'analytics' : 'default',
                data: {
                  id: newRow.id,
                  type: newRow.type,
                  route: resolveRoute({ type: newRow.type }),
                },
              });
            } catch (pushErr) {
              console.warn('[NotificationContext] Failed to trigger local notification popup:', pushErr);
            }
          }

          // 2. Add to local notifications list and persist
          const newItem: AppNotification = {
            id: newRow.id,
            title: newRow.title || 'Notification',
            body: newRow.description || '',
            data: { type: newRow.type, userId: newRow.user_id, route: resolveRoute({ type: newRow.type }) },
            createdAt: newRow.created_at || new Date().toISOString(),
            isRead: Boolean(newRow.is_read),
            type: (newRow.type as any) || 'general',
          };

          setNotificationsList((prev) => {
            const filtered = prev.filter((p) => p.id !== newItem.id);
            const next = [newItem, ...filtered];
            AsyncStorage.setItem(getStorageKey(user.id), JSON.stringify(next)).catch(() => {});
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const updatedRow = payload.new as any;
          if (!updatedRow) return;
          if (updatedRow.user_id && updatedRow.user_id !== user.id) return;

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
            AsyncStorage.setItem(getStorageKey(user.id), JSON.stringify(next)).catch(() => {});
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const oldRow = payload.old as any;
          if (!oldRow?.id) return;

          setNotificationsList((prev) => {
            const next = prev.filter((n) => n.id !== oldRow.id);
            AsyncStorage.setItem(getStorageKey(user.id), JSON.stringify(next)).catch(() => {});
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'landing_template_submissions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('📊 [Realtime] Landing page metrics changed, checking click counts...');
          syncPageClickNotifications(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'free_template_submissions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('📊 [Realtime] Bio page metrics changed, checking click counts...');
          syncPageClickNotifications(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tg_landing_pages',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('📊 [Realtime] TG landing page metrics changed, checking click counts...');
          syncPageClickNotifications(user.id);
        }
      )
      .subscribe((status) => {
        console.log(`📡 [Notification Realtime Channel Status]:`, status);
      });

    // Poll every 30 seconds as background fallback while active
    const pollInterval = setInterval(() => {
      fetchSupabaseNotifications(user.id);
      syncPageClickNotifications(user.id);
    }, 30000);

    // Refresh when app comes to foreground from background
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        fetchSupabaseNotifications(user.id);
        syncPageClickNotifications(user.id);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      appStateSub.remove();
    };
  }, [user?.id, fetchSupabaseNotifications, syncPageClickNotifications, resolveRoute]);

  const addNotification = async (item: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { id?: string }) => {
    const newItem: AppNotification = {
      id: item.id || Date.now().toString() + Math.random().toString(36).substring(2, 6),
      title: item.title,
      body: item.body,
      data: item.data,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: item.type || 'general',
    };
    const updated = [newItem, ...notificationsList.filter((n) => n.id !== newItem.id)];
    await saveNotifications(updated);
  };

  const markAsRead = async (id: string) => {
    const updated = notificationsList.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    await saveNotifications(updated);
    if (user?.id) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (e) {
        console.warn('[NotificationContext] Failed to sync markAsRead to Supabase:', e);
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
        console.warn('[NotificationContext] Failed to sync toggleRead to Supabase:', e);
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
        console.warn('[NotificationContext] Failed to sync markAllAsRead to Supabase:', e);
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
        console.warn('[NotificationContext] Failed to sync delete to Supabase:', e);
      }
    }
  };

  const clearAllNotifications = async () => {
    await saveNotifications([]);
    if (user?.id) {
      try {
        await supabase.from('notifications').delete().eq('user_id', user.id);
      } catch (e) {
        console.warn('[NotificationContext] Failed to sync clearAll to Supabase:', e);
      }
    }
  };

  const unreadCount = notificationsList.filter((n) => !n.isRead).length;

  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);
  const lastHandledNotificationId = useRef<string | null>(null);

  const clearNotification = () => {
    setNotification(null);
  };

  /**
   * Core handler for user tapping a notification (Kill, Background, or Foreground mode)
   */
  const handleNotificationResponse = (response: NotificationResponse) => {
    const notifId = response?.notification?.request?.identifier;
    if (notifId && lastHandledNotificationId.current === notifId) {
      return; // Deduplicate so cold-boot doesn't execute twice
    }
    if (notifId) {
      lastHandledNotificationId.current = notifId;
    }

    const data = response?.notification?.request?.content?.data as Record<string, any> | undefined;
    const targetUserId = data?.userId || data?.user_id;
    if (targetUserId && user?.id && targetUserId !== user.id) {
      console.log('🛑 [NotificationContext] Ignored tap: notification targeted for another user:', targetUserId);
      return;
    }

    const targetRoute = resolveRoute(data);

    if (targetRoute) {
      // Delay ensures the router and root stack are mounted, especially on cold boot (Kill mode)
      setTimeout(() => {
        try {
          router.push(targetRoute as any);
        } catch (routeErr) {
          console.warn('[NotificationContext] Navigation error on notification response:', routeErr);
        }
      }, 350);
    }
  };

  // Request permissions and register token
  const requestPermissions = async (): Promise<string | null> => {
    if (!Notifications) {
      console.log('ℹ️ [NotificationContext] Notifications module not available (e.g. Expo Go)');
      return null;
    }
    if (isRegistering) {
      console.log('⏳ [NotificationContext] Already requesting token, waiting...');
      return expoPushToken;
    }
    setIsRegistering(true);
    try {
      console.log('🔄 [NotificationContext] Requesting push permissions & token for user:', user?.id || 'anonymous');
      const result = await NotificationService.registerForPushNotificationsAsync();
      const granted = result.status === 'granted';
      setPermissionGranted(granted);

      if (result.token) {
        console.log('==============================================');
        console.log('🔥 [PUSH TOKEN ACQUIRED]:', result.token);
        console.log('==============================================');
        setExpoPushToken(result.token);
        if (user?.id) {
          console.log('📡 [NotificationContext] Syncing token to backend for user:', user.id);
          await NotificationService.syncPushTokenWithBackend(result.token, user.id);
        }
        return result.token;
      } else {
        console.warn('⚠️ [PUSH TOKEN NULL]:', result.error || `Status: ${result.status}`);
      }
      return null;
    } catch (err) {
      console.warn('❌ [NotificationContext] Registration error:', err);
      return null;
    } finally {
      setIsRegistering(false);
    }
  };

  // Trigger test notification locally across any channel & route
  const sendTestNotification = async (
    title = 'GetAiPilot Push Notification',
    body = 'Your push notifications are configured and active in your ecosystem.',
    channelId = 'default',
    route = '/account/plans'
  ) => {
    if (!Notifications) return;
    await NotificationService.scheduleLocalNotification({
      title,
      body,
      channelId,
      data: { route },
    });
  };

  // 1. Restore cached push token on mount and log to console immediately
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
        if (cached) {
          setExpoPushToken(cached);
          console.log('==============================================');
          console.log('📲 [PUSH TOKEN CACHED]:', cached);
          console.log('==============================================');
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  // 2. Automatically setup channels, request permissions & fetch push token on app mount
  useEffect(() => {
    if (!canUseNotifications) return;
    if (!Notifications) return;
    if (Platform.OS === 'web') return;

    // Immediately setup Android channels so background/kill mode notifications have channels ready
    NotificationService.setupChannels().catch((err) => {
      console.warn('[NotificationContext] Channel setup error:', err);
    });

    // Check existing permissions on mount
    Notifications.getPermissionsAsync()
      .then(({ status }) => {
        setPermissionGranted(status === 'granted');
      })
      .catch(() => { });

    // Always fetch push token on mount so it prints to console immediately
    requestPermissions().catch((e) => {
      console.warn('[NotificationContext] Auto-register notice:', e);
    });
  }, [canUseNotifications]);

  // 3. Whenever user session becomes available and token exists, sync to backend
  useEffect(() => {
    if (user?.id && expoPushToken) {
      console.log('📡 [NotificationContext] Syncing token to backend for user:', user.id);
      NotificationService.syncPushTokenWithBackend(expoPushToken, user.id).catch((e) => {
        console.warn('[NotificationContext] Sync token error:', e);
      });
    }
  }, [user?.id, expoPushToken]);

  // Set up notification received & response listeners for Foreground, Background, and Kill modes
  useEffect(() => {
    if (!canUseNotifications) return;
    if (!Notifications) return;
    if (Platform.OS === 'web') return;

    // 1. KILL / QUIT MODE: Check if the app was launched by tapping a push notification from cold state
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          console.log('[NotificationContext] Cold boot from Kill mode detected, navigating...');
          handleNotificationResponse(response);
        }
      })
      .catch((err) => {
        console.warn('[NotificationContext] Error getting initial notification response:', err);
      });

    // 2. FOREGROUND MODE: Notification received while the user is actively inside the app
    notificationListener.current = Notifications.addNotificationReceivedListener((incoming) => {
      const content = incoming?.request?.content;
      if (content) {
        const notifId = incoming?.request?.identifier;
        const data = (content.data || {}) as Record<string, any>;
        const targetUserId = data.userId || data.user_id;

        // If explicitly addressed to a specific user, ensure it matches current user
        if (targetUserId && user?.id && targetUserId !== user.id) {
          console.log('🛑 [NotificationContext] Discarding push notification intended for another user:', targetUserId);
          return;
        }

        setNotification(incoming);

        const title = content.title || 'New Alert';
        const body = content.body || '';
        const dedupeKey = `foreground_${notifId || (title + '_' + Date.now())}`;
        if (isDuplicateNotification(dedupeKey)) {
          return;
        }

        const type = (data.type as any) || (data.category as any) || 'general';
        const newItem: AppNotification = {
          id: notifId || Date.now().toString(),
          title,
          body,
          data,
          createdAt: new Date().toISOString(),
          isRead: false,
          type,
        };
        setNotificationsList((prev) => {
          if (prev.some((p) => p.id === newItem.id || (p.title === newItem.title && p.body === newItem.body))) {
            return prev;
          }
          const next = [newItem, ...prev];
          AsyncStorage.setItem(getStorageKey(user?.id), JSON.stringify(next)).catch(() => {});
          return next;
        });
      }
    });

    // 3. BACKGROUND & FOREGROUND TAP: User taps a notification banner while app is in background or foreground
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router, canUseNotifications]);

  // When notifications are unavailable (Expo Go), render children with an inert context.
  // All hooks above have already run unconditionally, so this early return is safe.
  if (!canUseNotifications || !Notifications) {
    return (
      <NotificationContext.Provider value={NOOP_CONTEXT}>
        {children}
      </NotificationContext.Provider>
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