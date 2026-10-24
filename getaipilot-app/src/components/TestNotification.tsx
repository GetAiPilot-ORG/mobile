import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '../core/api/client';
import { Pressable, Text, View, Alert, Platform, Image } from 'react-native';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export function TestNotificationButton() {
  const { user } = useAuth();
  const { sendTestNotification, expoPushToken, requestPermissions, forceRefreshToken } = useNotifications();
  const [tokenText, setTokenText] = useState<string | null>(expoPushToken);
  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    if (expoPushToken) {
      setTokenText(expoPushToken);
      console.log('====================================================');
      console.log('🔥 [TestNotification] Push Token Ready:');
      console.log(expoPushToken);
      console.log('====================================================');
    }
  }, [expoPushToken]);

  const handleConsoleToken = async () => {
    let token = await forceRefreshToken();
    if (!token) {
      token = expoPushToken || (await requestPermissions());
    }
    setTokenText(token);

    console.log('====================================================');
    console.log('🔔 [NOTIFICATION TEST] CONSOLE PUSH TOKEN:');
    if (token) {
      console.log('👉 TOKEN:', token);
    } else if (isExpoGo) {
      console.log('ℹ️ Running in Expo Go. Remote push tokens require Development Client (APK).');
      console.log('👉 Local notifications (Send Test Notification) WORK in Expo Go!');
    } else {
      console.log('⚠️ Token not generated yet. Ensure device has network and notifications allowed.');
    }
    console.log('====================================================');

    if (token) {
      try {
        await Clipboard.setStringAsync(token);
        Alert.alert(
          '🔥 Push Token Copied!',
          `${token}\n\n(Token copied to clipboard & printed in terminal console)`,
          [{ text: 'OK' }]
        );
      } catch {
        Alert.alert('Push Token', token);
      }
    } else if (isExpoGo) {
      Alert.alert(
        'Running in Expo Go',
        'Google FCM remote push tokens require a Development Build (APK).\n\nLekin aap "Send Test Notification" button daba kar phone par notification popup, sound aur icon abhi test kar sakte hain!',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Push Token', 'Token requesting in background... check terminal console.');
    }
  };

  const TEST_IMAGE_URL = 'https://uklxlappjcuvdqjvecfh.supabase.co/storage/v1/object/public/landing-page-logos/notification_large_icon.png';

  const handleSendTestNotification = async () => {
    try {
      console.log('🔔 Sending test notification...');
      let token = expoPushToken;
      if (!token) {
        token = await requestPermissions();
      }

      // If token is available, dispatch via Expo Push API so FCM renders the image on the right-hand side!
      if (token) {
        console.log('📡 Dispatching remote push with image via Expo Push API...');
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: token,
            title: '🚀 GetAiPilot Lead Alert',
            body: 'Naya prospect assign hua hai! Tap karke lead details dekhein.',
            sound: 'default',
            priority: 'high',
            channelId: 'leads',
            badge: 1,
            data: { route: '/crm/contacts', imageUrl: TEST_IMAGE_URL },
            richContent: {
              image: TEST_IMAGE_URL,
            },
          }),
        });

        const json = await res.json();
        const ticket = json?.data?.[0];
        if (ticket?.status === 'ok') {
          const ticketId = ticket.id;
          // Verify with FCM delivery receipts
          if (ticketId) {
            setTimeout(async () => {
              try {
                const rRes = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ids: [ticketId] }),
                });
                const rJson = await rRes.json();
                const receipt = rJson?.data?.[ticketId];
                if (receipt?.status === 'error' && receipt?.details?.error === 'DeviceNotRegistered') {
                  console.warn('⚠️ [FCM] Token DeviceNotRegistered! Refreshing token...');
                  const fresh = await forceRefreshToken();
                  setTokenText(fresh);
                  Alert.alert(
                    'Token Expired & Refreshed 🔄',
                    'Old push token had expired. Generated fresh active token!\n\nPlease tap "🔔 Local Test" once more to receive the push notification with image.',
                    [{ text: 'OK' }]
                  );
                }
              } catch (e) {
                console.log('Receipt check notice:', e);
              }
            }, 2000);
          }

          Alert.alert(
            'Push Dispatched! 🔔🖼️',
            'FCM remote notification with image dispatched!\n\nCheck notification bar in 1-3 seconds.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Fallback: Local notification (Android does not support remote URL image downloads for offline local notifications)
      await sendTestNotification(
        '🚀 GetAiPilot Lead Alert',
        'Naya prospect assign hua hai! Tap karke lead details dekhein.',
        'leads',
        '/crm/contacts',
        TEST_IMAGE_URL
      );
      Alert.alert(
        'Local Notification Sent! 🔔',
        'Android system bar me web image dikhane ke liye FCM push token required hota hai.\n\nAap "📋 Token" check karein aur Dev Build me test karein jahan FCM image ko right-hand side par render karta hai.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.warn('Notification test error:', err);
      Alert.alert('Notification Error', err?.message || 'Failed to trigger notification');
    }
  };

  const handleSendBackgroundTestNotification = async () => {
    try {
      console.log('🔔 Scheduling background test notification in 5 seconds...');
      await sendTestNotification(
        '🚀 GetAiPilot Lead Alert',
        'Naya prospect assign hua hai! Tap karke lead details dekhein.',
        'leads',
        '/crm/contacts',
        TEST_IMAGE_URL,
        5
      );
      Alert.alert(
        '⏳ 5s Timer Started!',
        'Abhi app ko minimize karein (Home button dabayein).\n\n5 seconds me notification bar & lockscreen par notification pop up hoga!',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.warn('Background notification test error:', err);
      Alert.alert('Notification Error', err?.message || 'Failed to trigger background notification');
    }
  };

  const [isSendingRemote, setIsSendingRemote] = useState(false);

  const handleSendRemotePushNotification = async () => {
    let token = expoPushToken;
    if (!token) {
      token = await requestPermissions();
    }
    if (!token) {
      Alert.alert('Push Token Missing', 'Please grant notification permissions and wait for token generation.');
      return;
    }

    try {
      setIsSendingRemote(true);
      console.log('📡 Sending real remote push to Expo Push Service for token:', token);

      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            to: token,
            title: '🔥 GetAiPilot Kill Mode Test',
            body: 'This is a REAL remote FCM push notification delivered in background/kill mode!',
            sound: 'default',
            priority: 'high',
            channelId: 'default',
            badge: 1,
            data: { route: '/tools', imageUrl: TEST_IMAGE_URL },
            richContent: {
              image: TEST_IMAGE_URL,
            },
          },
        ]),
      });

      const json = await res.json();
      console.log('📡 Push service response:', JSON.stringify(json));

      const ticket = Array.isArray(json?.data) ? json?.data?.[0] : json?.data;
      if (ticket?.status === 'ok') {
        Alert.alert(
          '🚀 Remote Push Dispatched! 🖼️',
          'Abhi agle 3-5 seconds me app ko SWIPE AWAY (Kill / Close) karein!\n\n💡 Android Note: Notification bar me aane ke baad notification card ko niche drag/swipe (pull down) karein to expand full large banner image!',
          [{ text: 'OK' }]
        );
      } else {
        const errorMsg = ticket?.message || json?.errors?.[0]?.message || 'Unknown error';
        const errorDetail = ticket?.details?.error || '';
        Alert.alert(
          '❌ Expo/FCM Ticket Error',
          `Server Error: ${errorMsg}\nDetail: ${errorDetail}\n\nNote: Agar "InvalidCredentials" hai, toh Firebase Console se Service Account Key download karke Expo Dashboard par FCM V1 me upload karein.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      Alert.alert('Network Error', err?.message || 'Failed to dispatch remote push');
    } finally {
      setIsSendingRemote(false);
    }
  };

  const [isSendingServer, setIsSendingServer] = useState(false);

  const handleSendServerPushNotification = async () => {
    let token = expoPushToken;
    if (!token) {
      token = await forceRefreshToken();
    }
    if (!token) {
      Alert.alert('Push Token Missing', 'Please grant notification permissions and wait for token generation.');
      return;
    }

    try {
      setIsSendingServer(true);
      console.log('📡 Triggering server push via BFF for user:', user?.id || 'anonymous');

      // First guarantee current token is synced to backend profile
      if (user?.id) {
        await apiClient.post('/mobile/v1/user/push-token', {
          user_id: user.id,
          push_token: token,
          platform: Platform.OS,
        }, { skipAuth: true });
      }

      const res = await apiClient.post(
        '/mobile/v1/user/test-push',
        {
          userId: user?.id,
          push_token: token,
          title: '🔥 Server Push Alert',
          body: 'Real push notification dispatched from GetAiPilot BFF server!',
          imageUrl: TEST_IMAGE_URL,
          route: '/tools',
        },
        { skipAuth: true }
      );

      console.log('📡 Server push response:', JSON.stringify(res));

      if (res?.success) {
        Alert.alert(
          '🚀 Server Push Dispatched! 🖼️',
          'BFF backend ne Google FCM se notification with image dispatch kiya hai.\n\nAbhi app ko minimize karein ya swipe away (Kill) karein!\n\n💡 Tip: Notification aane ke baad notification shade me card ko niche pull down karein to see large expanded banner!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ Server Push Issue',
          `Server Reason: ${res?.reason || res?.error || JSON.stringify(res)}\n\nAgar "no registered push token" hai, toh "📋 Token" par tap karke token sync karein.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.warn('Server push test error:', err);
      Alert.alert('Server Push Error', err?.message || 'Failed to dispatch via BFF server');
    } finally {
      setIsSendingServer(false);
    }
  };

  return (
    <View style={{
      backgroundColor: '#1E1B2E',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: '#3730A3',
      marginVertical: 12,
      gap: 12
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="notifications" size={20} color="#10B981" />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
            Notification Tester
          </Text>
        </View>
        <View style={{
          backgroundColor: isExpoGo ? '#F59E0B20' : '#10B98120',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8
        }}>
          <Text style={{
            color: isExpoGo ? '#F59E0B' : '#10B981',
            fontSize: 11,
            fontWeight: '600'
          }}>
            {isExpoGo ? 'Expo Go' : 'Dev Build'}
          </Text>
        </View>
      </View>

      {/* Live Notification Preview Box with White Background Image */}
      <View style={{
        backgroundColor: '#27233D',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderWidth: 1,
        borderColor: '#4338CA',
      }}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
            <Text style={{ color: '#E0E7FF', fontSize: 13, fontWeight: '700' }}>
              Notification Preview
            </Text>
          </View>
          <Text style={{ color: '#C7D2FE', fontSize: 12, lineHeight: 16 }} numberOfLines={2}>
            Naya prospect assign hua hai! Tap karke lead details dekhein.
          </Text>
        </View>

        {/* Logo Image with Solid White Background */}
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Image
            source={require('../../assets/images/logo-white-bg.png')}
            style={{ width: 40, height: 40, borderRadius: 8 }}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Row 1: Local test & Token */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {/* Button 1: Console & Copy Push Token */}
        <Pressable
          onPress={handleConsoleToken}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? '#3730A3' : '#4F46E5',
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center'
          })}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12, textAlign: 'center' }}>
            📋 Token
          </Text>
        </Pressable>

        {/* Button 2: Immediate Foreground Notification */}
        <Pressable
          onPress={handleSendTestNotification}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? '#059669' : '#10B981',
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center'
          })}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12, textAlign: 'center' }}>
            🔔 Local Test
          </Text>
        </Pressable>

        {/* Button 3: Background Notification (5s delay) */}
        <Pressable
          onPress={handleSendBackgroundTestNotification}
          style={({ pressed }) => ({
            flex: 1.2,
            backgroundColor: pressed ? '#D97706' : '#F59E0B',
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center'
          })}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12, textAlign: 'center' }}>
            ⏳ Local (5s)
          </Text>
        </Pressable>
      </View>

      {/* Row 2: REAL REMOTE PUSH TESTER (For Kill & Background Mode) */}
      <Pressable
        onPress={handleSendRemotePushNotification}
        disabled={isSendingRemote}
        style={({ pressed }) => ({
          backgroundColor: isSendingRemote ? '#4338CA' : pressed ? '#7C3AED' : '#8B5CF6',
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6
        })}
      >
        <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13, textAlign: 'center' }}>
          {isSendingRemote ? '⏳ Sending via Server...' : '🚀 Test REAL Remote Push (Kill Mode)'}
        </Text>
      </Pressable>

      {/* Row 3: Test Server Push directly via BFF Backend */}
      <Pressable
        onPress={handleSendServerPushNotification}
        disabled={isSendingServer}
        style={({ pressed }) => ({
          backgroundColor: isSendingServer ? '#047857' : pressed ? '#059669' : '#10B981',
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
        })}
      >
        <Ionicons name="server" size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13, textAlign: 'center' }}>
          {isSendingServer ? '⏳ Dispatching from BFF...' : '📡 Test Server Push (BFF Backend)'}
        </Text>
      </Pressable>

      {tokenText ? (
        <Text style={{ color: '#A5B4FC', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }} numberOfLines={1} ellipsizeMode="middle">
          Token: {tokenText}
        </Text>
      ) : null}
    </View>
  );
}
