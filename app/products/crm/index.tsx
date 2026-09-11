import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMHomeScreen } from '../../../src/features/crm/screens/CRMHomeScreen';
import { LeadListScreen } from '../../../src/features/crm/screens/LeadListScreen';
import { LeadDetailScreen } from '../../../src/features/crm/screens/LeadDetailScreen';
import { PipelineScreen } from '../../../src/features/crm/screens/PipelineScreen';
import { TasksScreen } from '../../../src/features/crm/screens/TasksScreen';
import { ContactsScreen } from '../../../src/features/crm/screens/ContactsScreen';
import { ActivitiesScreen } from '../../../src/features/crm/screens/ActivitiesScreen';
import { CRMMoreScreen } from '../../../src/features/crm/screens/CRMMoreScreen';

type CRMTab = 'home' | 'leads' | 'pipeline' | 'tasks' | 'more';
type MoreSection = 'main' | 'contacts' | 'activities';

export default function CRMIndexRoute() {
  const [activeTab, setActiveTab] = useState<CRMTab>('home');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [moreSection, setMoreSection] = useState<MoreSection>('main');

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
              if (tab === 'leads' || tab === 'pipeline' || tab === 'tasks' || tab === 'more') {
                setActiveTab(tab as CRMTab);
              }
            }}
            onSelectLead={(id) => setSelectedLeadId(id)}
          />
        )}

        {activeTab === 'leads' && (
          <LeadListScreen
            onSelectLead={(id) => setSelectedLeadId(id)}
          />
        )}

        {activeTab === 'pipeline' && <PipelineScreen />}

        {activeTab === 'tasks' && <TasksScreen />}

        {activeTab === 'more' && (
          <>
            {moreSection === 'main' && (
              <CRMMoreScreen
                onSelectSection={(section) => setMoreSection(section)}
              />
            )}
            {moreSection === 'contacts' && (
              <ContactsScreen
                onSelectContact={(id) => setSelectedLeadId(id)}
              />
            )}
            {moreSection === 'activities' && <ActivitiesScreen />}
          </>
        )}
      </View>

      {/* Floating Modern CRM Bottom Bar */}
      <View style={styles.bottomBar}>
        {[
          { key: 'home', label: 'Home', icon: 'home' as const },
          { key: 'leads', label: 'Leads', icon: 'people' as const },
          { key: 'pipeline', label: 'Pipeline', icon: 'briefcase' as const },
          { key: 'tasks', label: 'Tasks', icon: 'checkbox' as const },
          { key: 'more', label: 'More', icon: 'grid' as const },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabItem, isSelected && styles.tabItemSelected]}
              onPress={() => {
                setActiveTab(tab.key as CRMTab);
                if (tab.key === 'more') {
                  setMoreSection('main');
                }
              }}
              hitSlop={6}
            >
              <Ionicons
                name={isSelected ? tab.icon : (`${tab.icon}-outline` as any)}
                size={20}
                color={isSelected ? '#3B82F6' : '#9CA3AF'}
              />
              <Text style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#181A20',
    borderTopWidth: 1,
    borderTopColor: '#262A34',
    paddingBottom: 18,
    paddingTop: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  tabLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },
  tabLabelSelected: {
    color: '#60A5FA',
    fontWeight: '700',
  },
});
