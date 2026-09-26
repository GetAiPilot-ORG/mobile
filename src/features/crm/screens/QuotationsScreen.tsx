import {
  Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { crmApi } from '../api/crm.api';
import { CRMQuotation, QuotationStatus } from '../types';
import { useTheme, getColors } from '@/theme';

const WEB_APP_URL = 'https://getaipilot.in';

const PRIMARY = '#8B5CF6';

type StatusStyle = {
  bg: string;
  text: string;
};

const STATUS_COLOR: Record<QuotationStatus, StatusStyle> = {
  DRAFT: {
    bg: '#F1F5F9',
    text: '#64748B',
  },
  SENT: {
    bg: '#EFF6FF',
    text: '#3B82F6',
  },
  ACCEPTED: {
    bg: '#ECFDF5',
    text: '#10B981',
  },
  REJECTED: {
    bg: '#FEF2F2',
    text: '#EF4444',
  },
  CONVERTED: {
    bg: '#F5F3FF',
    text: '#8B5CF6',
  },
};

const FILTERS: Array<QuotationStatus | undefined> = [
  undefined,
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'CONVERTED',
];

const LABELS: string[] = [
  'All',
  'Draft',
  'Sent',
  'Accepted',
  'Rejected',
  'Converted',
];

export function QuotationsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [filter, setFilter] = useState<QuotationStatus | undefined>(
    undefined,
  );

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['crm-quotations', filter],
    queryFn: () =>
      crmApi.getQuotations({
        status: filter,
      }),
  });

  const quotations: CRMQuotation[] = data?.quotations ?? [];

  // ---------------------------------------------
  // Theme
  // ---------------------------------------------

  const bg = isDark ? '#0B0D12' : '#F8FAFC';
  const card = isDark ? '#151820' : '#FFFFFF';
  const text = isDark ? '#F8FAFC' : '#0F172A';
  const sub = isDark ? '#9CA3AF' : '#64748B';
  const border = isDark ? '#252936' : '#E2E8F0';

  // ---------------------------------------------
  // Open quotation
  // ---------------------------------------------

  const openQuotation = (quotation: CRMQuotation) => {
    const url = `${WEB_APP_URL}/dashboard/crm/quotations/${quotation.id}`;

    Linking.openURL(url).catch(() => {
      // Ignore URL open errors
    });
  };

  // ---------------------------------------------
  // Create quotation
  // ---------------------------------------------

  const openCreateQuotation = () => {
    const url = `${WEB_APP_URL}/dashboard/crm/quotations/create`;

    Linking.openURL(url).catch(() => {
      // Ignore URL open errors
    });
  };

  // ---------------------------------------------
  // Render filter
  // ---------------------------------------------

  const renderFilter = ({
    item,
    index,
  }: {
    item: QuotationStatus | undefined;
    index: number;
  }) => {
    const selected = filter === item;

    return (
      <Pressable
        onPress={() => setFilter(item)}
        style={({ pressed }) => [
          styles.filterChip,
          {
            backgroundColor: selected ? PRIMARY : card,
            borderColor: selected ? PRIMARY : border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.filterText,
            {
              color: selected ? '#FFFFFF' : sub,
            },
          ]}
        >
          {LABELS[index]}
        </Text>
      </Pressable>
    );
  };

  // ---------------------------------------------
  // Render quotation
  // ---------------------------------------------

  const renderQuotation = ({
    item,
  }: {
    item: CRMQuotation;
  }) => {
    /*
     * If your API type defines status as string instead of
     * QuotationStatus, this cast prevents the Record indexing error.
     */
    const status = item.status as QuotationStatus;

    const statusStyle: StatusStyle =
      STATUS_COLOR[status] ?? STATUS_COLOR.DRAFT;

    const clientName = item.contact
      ? `${item.contact.first_name ?? ''} ${item.contact.last_name ?? ''
        }`.trim() || 'No client'
      : 'No client';

    const formattedDate = item.date
      ? new Date(item.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      : '-';

    const totalAmount = Number(item.total_amount ?? 0);

    const formattedAmount = totalAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return (
      <Pressable
        onPress={() => openQuotation(item)}
        style={({ pressed }) => [
          styles.quotationCard,
          {
            backgroundColor: card,
            borderColor: border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {/* Left section */}
        <View style={styles.quotationLeft}>
          <View style={styles.numberRow}>
            <View
              style={[
                styles.documentIcon,
                {
                  backgroundColor: isDark
                    ? '#241D3A'
                    : '#F5F3FF',
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={19}
                color={PRIMARY}
              />
            </View>

            <View style={styles.numberContainer}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.quoteNumber,
                  {
                    color: text,
                  },
                ]}
              >
                {item.quote_number || 'Quotation'}
              </Text>

              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.clientName,
                  {
                    color: sub,
                  },
                ]}
              >
                {clientName}
              </Text>
            </View>
          </View>

          {/* Date */}
          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={sub}
            />

            <Text
              style={[
                styles.dateText,
                {
                  color: sub,
                },
              ]}
            >
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* Right section */}
        <View style={styles.quotationRight}>
          <Text
            numberOfLines={1}
            style={[
              styles.amount,
              {
                color: text,
              },
            ]}
          >
            ₹{formattedAmount}
          </Text>

          {/* Status */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isDark
                  ? `${statusStyle.text}22`
                  : statusStyle.bg,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusStyle.text,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: statusStyle.text,
                },
              ]}
            >
              {status}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={17}
            color={sub}
            style={styles.arrow}
          />
        </View>
      </Pressable>
    );
  };

  // ---------------------------------------------
  // Screen
  // ---------------------------------------------

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: bg,
        },
      ]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.title,
              {
                color: text,
              },
            ]}
          >
            Quotations
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: sub,
              },
            ]}
          >
            {data?.total_count ?? 0} total quotations
          </Text>
        </View>

        <Pressable
          onPress={openCreateQuotation}
          style={({ pressed }) => [
            styles.createButton,
            {
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons
            name="add"
            size={19}
            color="#FFFFFF"
          />

          <Text style={styles.createButtonText}>
            Create
          </Text>
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FlatList<QuotationStatus | undefined>
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => String(index)}
          renderItem={renderFilter}
          contentContainerStyle={styles.filterContent}
        />
      </View>

      {/* Loading */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={PRIMARY}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color: sub,
              },
            ]}
          >
            Loading quotations...
          </Text>
        </View>
      ) : quotations.length === 0 ? (
        /* Empty state */
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.emptyIconContainer,
              {
                backgroundColor: isDark
                  ? '#241D3A'
                  : '#F5F3FF',
              },
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={42}
              color={PRIMARY}
            />
          </View>

          <Text
            style={[
              styles.emptyTitle,
              {
                color: text,
              },
            ]}
          >
            No Quotations
          </Text>

          <Text
            style={[
              styles.emptyDescription,
              {
                color: sub,
              },
            ]}
          >
            {filter
              ? `No ${filter.toLowerCase()} quotations found.`
              : 'You have not created any quotations yet.'}
          </Text>

          {!filter && (
            <Pressable
              onPress={openCreateQuotation}
              style={({ pressed }) => [
                styles.emptyCreateButton,
                {
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons
                name="add"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.emptyCreateText}>
                Create Quotation
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        /* Quotations */
        <FlatList<CRMQuotation>
          data={quotations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderQuotation}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={PRIMARY}
              colors={[PRIMARY]}
            />
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // ---------------------------------------------
  // Header
  // ---------------------------------------------

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },

  headerContent: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    marginTop: 3,
  },

  // ---------------------------------------------
  // Create button
  // ---------------------------------------------

  createButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: PRIMARY,
    gap: 5,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ---------------------------------------------
  // Filters
  // ---------------------------------------------

  filterContainer: {
    marginBottom: 4,
  },

  filterContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },

  filterChip: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },

  filterText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  // ---------------------------------------------
  // List
  // ---------------------------------------------

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
  },

  separator: {
    height: 8,
  },

  // ---------------------------------------------
  // Quotation card
  // ---------------------------------------------

  quotationCard: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 15,
    borderWidth: 1,
  },

  quotationLeft: {
    flex: 1,
    paddingRight: 12,
  },

  quotationRight: {
    minWidth: 105,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // ---------------------------------------------
  // Number / client
  // ---------------------------------------------

  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  documentIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  numberContainer: {
    flex: 1,
  },

  quoteNumber: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },

  clientName: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    marginTop: 2,
  },

  // ---------------------------------------------
  // Date
  // ---------------------------------------------

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },

  dateText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },

  // ---------------------------------------------
  // Amount
  // ---------------------------------------------

  amount: {
    maxWidth: 125,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'right',
  },

  // ---------------------------------------------
  // Status
  // ---------------------------------------------

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 25,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 7,
    gap: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },

  arrow: {
    marginTop: 7,
  },

  // ---------------------------------------------
  // Loading
  // ---------------------------------------------

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
  },

  // ---------------------------------------------
  // Empty state
  // ---------------------------------------------

  emptyIconContainer: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },

  emptyDescription: {
    maxWidth: 280,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },

  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: PRIMARY,
    marginTop: 18,
    gap: 5,
  },

  emptyCreateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});