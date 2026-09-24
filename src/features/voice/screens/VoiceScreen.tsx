import { getColors } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, useColorScheme, View } from 'react-native';
import { AppScreen } from '../../../components/AppScreen';
import { AppTopBar } from '../../../components/AppTopBar';
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from '../../../components/ProductFloatingBottomBar';
import { CallsScreen } from './CallsScreen';
import { CampaignsScreen } from './CampaignsScreen';
import { ContactsScreen } from './ContactsScreen';
import { PhoneNumbersScreen } from './PhoneNumbersScreen';
import { VoiceOverviewScreen } from './VoiceOverviewScreen';

type VoiceTabKey = 'overview' | 'numbers' | 'calls' | 'campaigns' | 'contacts';

const VOICE_TABS: ProductTabItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    activeIcon: 'grid',
    inactiveIcon: 'grid-outline',
    description: 'Dashboard & Telemetry',
  },
  {
    key: 'numbers',
    label: 'Numbers',
    activeIcon: 'keypad',
    inactiveIcon: 'keypad-outline',
    description: 'Virtual lines & assistant routing',
  },
  {
    key: 'calls',
    label: 'Calls',
    activeIcon: 'call',
    inactiveIcon: 'call-outline',
    description: 'Dedicated caller ID & logs',
  },
  {
    key: 'campaigns',
    label: 'Campaigns',
    activeIcon: 'rocket',
    inactiveIcon: 'rocket-outline',
    description: 'Automated bulk telecalling',
  },
  {
    key: 'contacts',
    label: 'Contacts',
    activeIcon: 'people',
    inactiveIcon: 'people-outline',
    description: 'CRM leads & calling history',
  },
];

export const VoiceScreen: React.FC = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);
  const [activeTab, setActiveTab] = useState<VoiceTabKey>('overview');

  useEffect(() => {
    const onHardwareBack = () => {
      if (activeTab !== 'overview') {
        setActiveTab('overview');
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace('/(tabs)/products');
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [activeTab, router]);

  return (
    <AppScreen safeArea={false}>
      <AppTopBar
        title="VoicePilot"
        subtitle="AI Telecalling & Voice Agents"
        showBack={true}
      />

      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.screenContainer}>
          {activeTab === 'overview' && (
            <VoiceOverviewScreen
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'numbers' && <PhoneNumbersScreen />}
          {activeTab === 'calls' && <CallsScreen />}
          {activeTab === 'campaigns' && <CampaignsScreen />}
          {activeTab === 'contacts' && <ContactsScreen />}
        </View>

        <ProductFloatingBottomBar
          items={VOICE_TABS}
          activeKey={activeTab}
          onChangeTab={(key) => setActiveTab(key as VoiceTabKey)}
          accentColor="#8B5CF6"
          moreMenuTitle="Voice Navigation"
        />
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
