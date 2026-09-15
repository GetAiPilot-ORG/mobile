import React, { useState, useEffect } from 'react';
import { BackHandler, StyleSheet, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CRMHomeScreen } from '../../../src/features/crm/screens/CRMHomeScreen';
import { LeadListScreen } from '../../../src/features/crm/screens/LeadListScreen';
import { LeadDetailScreen } from '../../../src/features/crm/screens/LeadDetailScreen';
import { PipelineScreen } from '../../../src/features/crm/screens/PipelineScreen';
import { TasksScreen } from '../../../src/features/crm/screens/TasksScreen';
import { ContactsScreen } from '../../../src/features/crm/screens/ContactsScreen';
import { ActivitiesScreen } from '../../../src/features/crm/screens/ActivitiesScreen';
import { CRMMoreScreen } from '../../../src/features/crm/screens/CRMMoreScreen';
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from '../../../src/components/ProductFloatingBottomBar';

type CRMTab = 'home' | 'leads' | 'pipeline' | 'tasks' | 'contacts' | 'activities' | 'more';

const CRM_TABS: ProductTabItem[] = [
  {
    key: 'home',
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  {
    key: 'leads',
    label: 'Leads',
    activeIcon: 'people',
    inactiveIcon: 'people-outline',
  },
  {
    key: 'pipeline',
    label: 'Pipeline',
    activeIcon: 'briefcase',
    inactiveIcon: 'briefcase-outline',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    activeIcon: 'checkbox',
    inactiveIcon: 'checkbox-outline',
  },
  {
    key: 'contacts',
    label: 'Contacts',
    activeIcon: 'book',
    inactiveIcon: 'book-outline',
    description: 'All organization contacts & clients',
  },
  {
    key: 'activities',
    label: 'Activities',
    activeIcon: 'pulse',
    inactiveIcon: 'pulse-outline',
    description: 'Calls, meetings, emails & note logs',
  },
  {
    key: 'more',
    label: 'Team & Hub',
    activeIcon: 'grid',
    inactiveIcon: 'grid-outline',
    description: 'Team directory & advanced features',
  },
];

export default function CRMIndexRoute() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<CRMTab>('home');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    const onHardwareBack = () => {
      if (selectedLeadId) {
        setSelectedLeadId(null);
        return true;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
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
  }, [selectedLeadId, activeTab]);

  // If a lead is selected, show LeadDetailScreen
  if (selectedLeadId) {
    return (
      <LeadDetailScreen
        leadId={selectedLeadId}
        onBack={() => setSelectedLeadId(null)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]}>
      <View style={styles.screenContainer}>
        {activeTab === 'home' && (
          <CRMHomeScreen
            onNavigateTab={(tab) => {
              if (
                tab === 'leads' ||
                tab === 'pipeline' ||
                tab === 'tasks' ||
                tab === 'contacts' ||
                tab === 'activities' ||
                tab === 'more'
              ) {
                setActiveTab(tab as CRMTab);
              }
            }}
            onSelectLead={(id) => setSelectedLeadId(id)}
            onBack={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/products');
              }
            }}
          />
        )}

        {activeTab === 'leads' && (
          <LeadListScreen
            onSelectLead={(id) => setSelectedLeadId(id)}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelineScreen onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'tasks' && (
          <TasksScreen onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'contacts' && (
          <ContactsScreen
            onSelectContact={(id) => setSelectedLeadId(id)}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'activities' && (
          <ActivitiesScreen onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'more' && (
          <CRMMoreScreen
            onSelectSection={(section) => {
              if (section === 'contacts') setActiveTab('contacts');
              else if (section === 'activities') setActiveTab('activities');
            }}
            onBack={() => setActiveTab('home')}
          />
        )}
      </View>

      {/* Floating Home-Style Product Bottom Navigation Bar */}
      <ProductFloatingBottomBar
        items={CRM_TABS}
        activeKey={activeTab}
        onChangeTab={(key) => setActiveTab(key as CRMTab)}
        accentColor="#3B82F6"
        moreMenuTitle="CRM Tools & Management"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
