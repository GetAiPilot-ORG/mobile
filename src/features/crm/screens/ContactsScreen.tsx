import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useContacts, useCreateContact } from '../hooks/useContacts';
import { LeadCard } from '../components/LeadCard';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { CrmListSkeleton } from '../../../components/skeletonScreen';
import { useTheme, getColors } from '@/theme';

interface ContactsScreenProps {
  onSelectContact: (contactId: string) => void;
  onBack?: () => void;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({ onSelectContact, onBack }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading, isRefetching, refetch } = useContacts({
    search: search.trim() || undefined,
  });

  const createContact = useCreateContact();
  const contacts = data?.contacts || [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <Pressable
              style={[styles.backBtn, { backgroundColor: isDark ? '#1E2028' : '#F1F5F9' }]}
              onPress={onBack}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </Pressable>
          ) : null}
          <View>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>All Contacts</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Complete customer and partner phonebook</Text>
          </View>
        </View>

        <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)} hitSlop={8}>
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Contact</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: isDark ? '#181A20' : '#FFFFFF', borderColor: isDark ? '#262A34' : '#E2E8F0' }]}>
        <Ionicons name="search" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
          placeholder="Search all contacts & companies..."
          placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
          </Pressable>
        ) : null}
      </View>

      {/* List */}
      {isLoading && !data ? (
        <CrmListSkeleton />
      ) : contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={isDark ? '#4B5563' : '#CBD5E1'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>No contacts found</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            {search ? `No records matching "${search}"` : 'Your contact book is currently empty.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeadCard lead={item} onPress={() => onSelectContact(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
        />
      )}

      {/* Add Modal */}
      <CreateLeadModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (c) => {
          await createContact.mutateAsync(c);
        }}
        isLoading={createContact.isPending}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E2028',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});
