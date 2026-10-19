import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Pressable, Text, View, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export function TestNotificationButton() {
  const { sendTestNotification, expoPushToken, requestPermissions } = useNotifications();
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
    let token = expoPushToken;
    if (!token) {
      token = await requestPermissions();
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

  const handleSendTestNotification = async () => {
    try {
      console.log('🔔 Sending test notification in 1 second...');
      await sendTestNotification(
        '🚀 GetAiPilot Lead Alert',
        'Naya prospect assign hua hai! Tap karke lead details dekhein.',
        'leads',
        '/crm/contacts'
      );
      Alert.alert(
        'Notification Sent! 🔔',
        '1-2 seconds me aapke phone ke notification bar me alert aayega!',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.warn('Notification test error:', err);
      Alert.alert('Notification Error', err?.message || 'Failed to trigger notification');
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

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Button 1: Console & Copy Push Token */}
        <Pressable
          onPress={handleConsoleToken}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? '#3730A3' : '#4F46E5',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center'
          })}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13, textAlign: 'center' }}>
            📋 Console Token
          </Text>
        </Pressable>

        {/* Button 2: Send Test Notification */}
        <Pressable
          onPress={handleSendTestNotification}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? '#059669' : '#10B981',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center'
          })}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13, textAlign: 'center' }}>
            🔔 Test Notification
          </Text>
        </Pressable>
      </View>

      {tokenText ? (
        <Text style={{ color: '#A5B4FC', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }} numberOfLines={1} ellipsizeMode="middle">
          Token: {tokenText}
        </Text>
      ) : null}
    </View>
  );
}
