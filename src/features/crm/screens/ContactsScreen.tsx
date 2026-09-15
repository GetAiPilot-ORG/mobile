import React, { useState } from 'react';
import {
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useContacts, useCreateContact } from '../hooks/useContacts';
import { LeadCard } from '../components/LeadCard';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { CrmListSkeleton } from '../../../components/skeletonScreen';

interface ContactsScreenProps {
  onSelectContact?: (contactId: string) => void;
  onBack?: () => void;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({ onSelectContact, onBack }) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading, isRefetching, refetch } = useContacts({
    search: search.trim() || undefined,
  });

  const createContact = useCreateContact();
  const contacts = data?.contacts || [];

  return (
    <SafeAreaView className="flex-1 bg-[#0B0D10]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-2.5">
          {onBack ? (
            <Pressable
              className="p-1.5 rounded-lg bg-[#181A1F] border border-[#262930]"
              onPress={onBack}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
          ) : null}
          <View>
            <Text className="text-white text-xl font-bold tracking-tight">All Contacts</Text>
            <Text className="text-slate-400 text-xs mt-0.5">Complete customer and partner phonebook</Text>
          </View>
        </View>

        <Pressable
          className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-2 rounded-xl"
          onPress={() => setShowAddModal(true)}
          hitSlop={8}
        >
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold">Contact</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View className="flex-row items-center gap-2 rounded-xl px-3 py-2 mx-4 mb-3 bg-[#181A1F] border border-[#262930]">
        <Ionicons name="search" size={16} color="#94A3B8" />
        <TextInput
          className="flex-1 text-white text-sm py-0.5"
          placeholder="Search all contacts & companies..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>

      {/* List */}
      {isLoading && !data ? (
        <CrmListSkeleton />
      ) : contacts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="people-outline" size={48} color="#475569" />
          <Text className="text-white text-base font-semibold mt-3">No contacts found</Text>
          <Text className="text-slate-400 text-xs text-center mt-1.5">
            {search ? `No records matching "${search}"` : 'Your contact book is currently empty.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeadCard lead={item} onPress={() => onSelectContact?.(item.id)} />
          )}
          contentContainerClassName="px-4 pb-28"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#0084FF"
              colors={['#0084FF']}
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
