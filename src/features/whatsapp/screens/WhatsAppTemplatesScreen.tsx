import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WhatsAppTemplatesSkeleton } from '../../../components/skeletonScreen';
import { TemplateCard } from '../components';
import { useWhatsAppTemplates } from '../hooks/useWhatsAppTemplates';

interface WhatsAppTemplatesScreenProps {
  onBack?: () => void;
}

export const WhatsAppTemplatesScreen: React.FC<WhatsAppTemplatesScreenProps> = ({ onBack }) => {
  const router = useRouter();

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/whatsapp');
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');

  const { data: templates, isLoading, refetch, isRefetching } = useWhatsAppTemplates();

  const categoryOptions = [
    { val: 'ALL', label: 'All Templates' },
    { val: 'UTILITY', label: 'Utility' },
    { val: 'MARKETING', label: 'Marketing' },
    { val: 'AUTHENTICATION', label: 'Authentication' },
  ];

  // Calculate Status Counts
  const stats = useMemo(() => {
    const list = templates || [];
    const approved = list.filter((t) => t.status === 'APPROVED').length;
    const pending = list.filter((t) => t.status === 'PENDING').length;
    const rejected = list.filter((t) => t.status === 'REJECTED' || t.status === 'PAUSED').length;
    return { approved, pending, rejected, total: list.length };
  }, [templates]);

  // Filter templates by category, status, and search query
  const filteredTemplates = useMemo(() => {
    let list = templates || [];

    if (activeCategory !== 'ALL') {
      list = list.filter((t) => (t.category || '').toUpperCase() === activeCategory);
    }

    if (activeStatus !== 'ALL') {
      list = list.filter((t) => (t.status || '').toUpperCase() === activeStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(q);
        const bodyComp = t.components?.find((c: any) => c.type === 'BODY');
        const bodyMatch = bodyComp?.text ? bodyComp.text.toLowerCase().includes(q) : false;
        return nameMatch || bodyMatch;
      });
    }

    return list;
  }, [templates, activeCategory, activeStatus, searchQuery]);

  return (
    <SafeAreaView
      className="flex-1 bg-[#0B0D10]"
      edges={['top', 'left', 'right']}
    >
      <View className="flex-1">
        {/* Top Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-[#262930] bg-[#181A1F]">
          <Pressable
            className="w-10 h-10 rounded-full bg-[#111317] border border-[#262930] items-center justify-center mr-3 active:opacity-70"
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color="#F8FAFC"
            />
          </Pressable>

          <Text className="text-lg font-bold text-white tracking-tight">
            Message Templates
          </Text>
        </View>

        {/* Filter & Search Controls Card */}
        <View className="mx-4 mt-2.5 mb-1.5 rounded-2xl p-3 bg-[#181A1F] border border-[#262930]">
          {/* Search Bar */}
          <View className="flex-row items-center rounded-xl px-2.5 h-10 mb-2.5 bg-[#111317] border border-[#262930]">
            <Ionicons
              name="search-outline"
              size={16}
              color="#94A3B8"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-xs text-white"
              placeholder="Search template name or message..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1.5 pb-2.5"
          >
            {categoryOptions.map((cat) => {
              const isSelected = activeCategory === cat.val;
              return (
                <Pressable
                  key={cat.val}
                  className={`px-3 py-1.5 rounded-lg border ${
                    isSelected
                      ? 'bg-[#0084FF] border-[#0084FF]'
                      : 'bg-[#111317] border-[#262930] active:bg-[#262930]'
                  }`}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setActiveCategory(cat.val);
                  }}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Status Stats Row with Clickable Badges */}
          <View className="flex-row items-center justify-between border-t border-[#262930] pt-2.5">
            <View className="flex-row items-center gap-1.5">
              {/* All Badge */}
              <Pressable
                className={`flex-row items-center px-2 py-1 rounded-md border ${
                  activeStatus === 'ALL'
                    ? 'bg-[#262930] border-slate-600'
                    : 'bg-[#111317] border-[#262930]'
                }`}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus('ALL');
                }}
              >
                <Text className="text-[11px] font-semibold text-slate-400">
                  All: <Text className="font-bold text-white">{stats.total}</Text>
                </Text>
              </Pressable>

              {/* Approved Badge */}
              <Pressable
                className={`flex-row items-center gap-1 px-2 py-1 rounded-md border ${
                  activeStatus === 'APPROVED'
                    ? 'bg-emerald-500/20 border-emerald-500'
                    : 'bg-[#111317] border-[#262930]'
                }`}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus(activeStatus === 'APPROVED' ? 'ALL' : 'APPROVED');
                }}
              >
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text className="text-[11px] font-bold text-emerald-400">{stats.approved}</Text>
              </Pressable>

              {/* Pending Badge */}
              <Pressable
                className={`flex-row items-center gap-1 px-2 py-1 rounded-md border ${
                  activeStatus === 'PENDING'
                    ? 'bg-amber-500/20 border-amber-500'
                    : 'bg-[#111317] border-[#262930]'
                }`}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus(activeStatus === 'PENDING' ? 'ALL' : 'PENDING');
                }}
              >
                <Ionicons name="time-outline" size={12} color="#F59E0B" />
                <Text className="text-[11px] font-bold text-amber-400">{stats.pending}</Text>
              </Pressable>

              {/* Rejected Badge */}
              <Pressable
                className={`flex-row items-center gap-1 px-2 py-1 rounded-md border ${
                  activeStatus === 'REJECTED'
                    ? 'bg-rose-500/20 border-rose-500'
                    : 'bg-[#111317] border-[#262930]'
                }`}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus(activeStatus === 'REJECTED' ? 'ALL' : 'REJECTED');
                }}
              >
                <Ionicons name="close-circle" size={12} color="#EF4444" />
                <Text className="text-[11px] font-bold text-rose-400">{stats.rejected}</Text>
              </Pressable>
            </View>

            {/* Sync Meta Templates Button */}
            <Pressable
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0084FF]/10 border border-[#0084FF]/20 active:opacity-70"
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                refetch();
              }}
              disabled={isRefetching}
            >
              <Ionicons
                name="refresh-outline"
                size={13}
                color="#0084FF"
              />
              <Text className="text-xs font-bold text-[#0084FF]">{isRefetching ? 'Syncing...' : 'Sync'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Templates FlatList / Grid */}
        {isLoading && !templates ? (
          <WhatsAppTemplatesSkeleton />
        ) : (
          <FlatList
            data={filteredTemplates}
            keyExtractor={(item) => item.id || item.name}
            renderItem={({ item }) => <TemplateCard template={item} />}
            contentContainerClassName="p-4 pb-32"
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#0084FF"
              />
            }
            ListEmptyComponent={
              <View className="py-14 px-6 items-center">
                <Ionicons name="document-text-outline" size={44} color="#64748B" />
                <Text className="text-base font-bold text-white mt-3">
                  No WhatsApp Templates Found
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed">
                  {searchQuery || activeCategory !== 'ALL' || activeStatus !== 'ALL'
                    ? 'No templates match your active filters. Try clearing filters or search query.'
                    : 'No WhatsApp message templates available for this account.'}
                </Text>
              </View>
            }
          />
        )}

        {/* Meta Status Bar Footer */}
        <View className="flex-row items-center justify-between px-4 py-2.5 border-t border-[#262930] bg-[#181A1F]">
          <Text className="text-xs text-slate-400">
            Showing {filteredTemplates.length} of {templates?.length || 0} templates
          </Text>

          <View className="flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <Text className="text-xs font-bold text-emerald-400">Meta Cloud Live</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
