import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
    description: 'Team members, roles & settings',
  },
];

export default function CRMIndexRoute() {
  const [activeTab, setActiveTab] = useState<CRMTab>('home');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

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
    <View style={styles.container}>
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
          />
        )}

        {activeTab === 'leads' && (
          <LeadListScreen onSelectLead={(id) => setSelectedLeadId(id)} />
        )}

        {activeTab === 'pipeline' && <PipelineScreen />}

        {activeTab === 'tasks' && <TasksScreen />}

        {activeTab === 'contacts' && (
          <ContactsScreen onSelectContact={(id) => setSelectedLeadId(id)} />
        )}

        {activeTab === 'activities' && <ActivitiesScreen />}

        {activeTab === 'more' && (
          <CRMMoreScreen
            onSelectSection={(section) => {
              if (section === 'contacts') setActiveTab('contacts');
              else if (section === 'activities') setActiveTab('activities');
            }}
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
    backgroundColor: '#0F1015',
  },
  screenContainer: {
    flex: 1,
  },
});
