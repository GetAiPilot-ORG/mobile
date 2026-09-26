
import {
  Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React,
  { useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { crmApi } from '../api/crm.api';
import { useTheme, getColors } from '@/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function GoogleCalendarScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  /*
   * --------------------------------------------------------------------------
   * Theme
   * --------------------------------------------------------------------------
   */

  const theme = useMemo(
    () => ({
      background: isDark ? '#0F1117' : '#F6F8FB',
      surface: isDark ? '#181B23' : '#FFFFFF',
      surfaceSecondary: isDark ? '#20242E' : '#F8FAFC',

      text: isDark ? '#FFFFFF' : '#0F172A',
      secondaryText: isDark ? '#A1A1AA' : '#64748B',
      mutedText: isDark ? '#71717A' : '#94A3B8',

      border: isDark ? '#2A2F3A' : '#E2E8F0',

      primary: '#3B82F6',
      primarySoft: isDark ? '#172A46' : '#EFF6FF',

      success: '#10B981',
      successSoft: isDark ? '#102C25' : '#ECFDF5',

      purple: '#8B5CF6',
      purpleSoft: isDark ? '#251C3D' : '#F5F3FF',

      orange: '#F59E0B',
      orangeSoft: isDark ? '#352A12' : '#FFFBEB',

      pink: '#EC4899',
      pinkSoft: isDark ? '#351A2B' : '#FDF2F8',
    }),
    [isDark],
  );

  /*
   * --------------------------------------------------------------------------
   * Organization
   * --------------------------------------------------------------------------
   */

  const {
    data: organization,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['crm-organization'],
    queryFn: crmApi.getOrganization,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const calendarId = organization?.google_calendar_id;

  /*
   * --------------------------------------------------------------------------
   * URL helpers
   * --------------------------------------------------------------------------
   */

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://calendar.google.com');
      }
    } catch {
      try {
        await Linking.openURL('https://calendar.google.com');
      } catch {
        // Ignore linking failure.
      }
    }
  };

  const openCalendar = () => {
    if (!calendarId) {
      openUrl('https://calendar.google.com');
      return;
    }

    const url =
      `https://calendar.google.com/calendar/r?cid=` +
      encodeURIComponent(calendarId);

    openUrl(url);
  };

  const openGoogleCalendar = () => {
    openUrl('https://calendar.google.com');
  };

  const openToday = () => {
    openUrl('https://calendar.google.com/calendar/r/day');
  };

  const openWeek = () => {
    openUrl('https://calendar.google.com/calendar/r/week');
  };

  const openMonth = () => {
    openUrl('https://calendar.google.com/calendar/r/month');
  };

  const openCreateEvent = () => {
    openUrl(
      'https://calendar.google.com/calendar/r/eventedit',
    );
  };

  const openTeamCalendar = () => {
    if (!calendarId) {
      openGoogleCalendar();
      return;
    }

    const url =
      `https://calendar.google.com/calendar/r?cid=` +
      encodeURIComponent(calendarId);

    openUrl(url);
  };

  const openCalendarEmbed = () => {
    if (!calendarId) {
      return;
    }

    const url =
      `https://calendar.google.com/calendar/embed?src=` +
      `${encodeURIComponent(calendarId)}` +
      `&ctz=Asia%2FKolkata`;

    openUrl(url);
  };

  /*
   * --------------------------------------------------------------------------
   * Quick actions
   * --------------------------------------------------------------------------
   */

  const quickActions: {
    title: string;
    description: string;
    icon: IoniconName;
    color: string;
    background: string;
    onPress: () => void;
  }[] = [
      {
        title: 'Create Event',
        description: 'Create a new Google Calendar event',
        icon: 'add-circle-outline',
        color: theme.purple,
        background: theme.purpleSoft,
        onPress: openCreateEvent,
      },
      {
        title: "Today's Schedule",
        description: 'View your events for today',
        icon: 'today-outline',
        color: theme.orange,
        background: theme.orangeSoft,
        onPress: openToday,
      },
      {
        title: 'Week View',
        description: 'View your weekly schedule',
        icon: 'calendar-outline',
        color: theme.success,
        background: theme.successSoft,
        onPress: openWeek,
      },
      {
        title: 'Month View',
        description: 'View your monthly schedule',
        icon: 'grid-outline',
        color: theme.primary,
        background: theme.primarySoft,
        onPress: openMonth,
      },
    ];

  /*
   * --------------------------------------------------------------------------
   * Loading
   * --------------------------------------------------------------------------
   */

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.background },
        ]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <View
            style={[
              styles.loadingIcon,
              { backgroundColor: theme.primarySoft },
            ]}
          >
            <Ionicons
              name="calendar"
              size={30}
              color={theme.primary}
            />
          </View>

          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={styles.loadingSpinner}
          />

          <Text
            style={[
              styles.loadingTitle,
              { color: theme.text },
            ]}
          >
            Loading Calendar
          </Text>

          <Text
            style={[
              styles.loadingDescription,
              { color: theme.secondaryText },
            ]}
          >
            Checking your organisation calendar...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * --------------------------------------------------------------------------
   * Main UI
   * --------------------------------------------------------------------------
   */

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.background },
      ]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text
              style={[
                styles.headerTitle,
                { color: theme.text },
              ]}
            >
              Google Calendar
            </Text>

            <Text
              style={[
                styles.headerSubtitle,
                { color: theme.secondaryText },
              ]}
              numberOfLines={1}
            >
              {organization?.name || 'Organisation Calendar'}
            </Text>
          </View>

          <View
            style={[
              styles.headerIcon,
              { backgroundColor: theme.primarySoft },
            ]}
          >
            <Ionicons
              name="calendar"
              size={25}
              color={theme.primary}
            />
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Error */}
        {/* ---------------------------------------------------------------- */}

        {isError && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: theme.surface,
                borderColor: '#EF4444',
              },
            ]}
          >
            <View
              style={[
                styles.errorIcon,
                { backgroundColor: '#FEF2F2' },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color="#EF4444"
              />
            </View>

            <View style={styles.flexOne}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: theme.text },
                ]}
              >
                Unable to load calendar
              </Text>

              <Text
                style={[
                  styles.cardDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Please refresh and try again.
              </Text>
            </View>

            <Pressable
              onPress={() => refetch()}
              style={({ pressed }) => [
                styles.retryButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.retryText,
                  { color: theme.primary },
                ]}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Connected calendar */}
        {/* ---------------------------------------------------------------- */}

        {calendarId && (
          <>
            <View
              style={[
                styles.connectedCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.success,
                },
              ]}
            >
              <View
                style={[
                  styles.connectedIcon,
                  { backgroundColor: theme.successSoft },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={25}
                  color={theme.success}
                />
              </View>

              <View style={styles.flexOne}>
                <View style={styles.connectedTitleRow}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.text },
                    ]}
                  >
                    Calendar Connected
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: theme.successSoft },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: theme.success },
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        { color: theme.success },
                      ]}
                    >
                      Active
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.calendarId,
                    { color: theme.secondaryText },
                  ]}
                  numberOfLines={1}
                >
                  {calendarId}
                </Text>
              </View>
            </View>

            {/* ------------------------------------------------------------ */}
            {/* Main buttons */}
            {/* ------------------------------------------------------------ */}

            <View style={styles.primaryActions}>
              <Pressable
                onPress={openCalendar}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="open-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.primaryButtonText}>
                  Open Google Calendar
                </Text>
              </Pressable>

              <Pressable
                onPress={openCreateEvent}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={theme.primary}
                />

                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.text },
                  ]}
                >
                  Create Event
                </Text>
              </Pressable>
            </View>

            {/* ------------------------------------------------------------ */}
            {/* Quick Actions */}
            {/* ------------------------------------------------------------ */}

            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.text },
                  ]}
                >
                  Quick Actions
                </Text>

                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.secondaryText },
                  ]}
                >
                  Manage your calendar quickly
                </Text>
              </View>
            </View>

            <View style={styles.quickList}>
              {quickActions.map((item) => (
                <Pressable
                  key={item.title}
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.quickCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.quickIcon,
                      { backgroundColor: item.background },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={21}
                      color={item.color}
                    />
                  </View>

                  <View style={styles.flexOne}>
                    <Text
                      style={[
                        styles.quickTitle,
                        { color: theme.text },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={[
                        styles.quickDescription,
                        { color: theme.secondaryText },
                      ]}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.mutedText}
                  />
                </Pressable>
              ))}
            </View>

            {/* ------------------------------------------------------------ */}
            {/* Team Calendar */}
            {/* ------------------------------------------------------------ */}

            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.text },
                  ]}
                >
                  Team Calendar
                </Text>

                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.secondaryText },
                  ]}
                >
                  Access your shared organisation calendar
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.teamCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.teamIcon,
                  { backgroundColor: theme.pinkSoft },
                ]}
              >
                <Ionicons
                  name="people-outline"
                  size={23}
                  color={theme.pink}
                />
              </View>

              <View style={styles.flexOne}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: theme.text },
                  ]}
                >
                  Shared Team Calendar
                </Text>

                <Text
                  style={[
                    styles.cardDescription,
                    { color: theme.secondaryText },
                  ]}
                >
                  Open the organisation's shared Google Calendar.
                </Text>
              </View>

              <Pressable
                onPress={openTeamCalendar}
                style={({ pressed }) => [
                  styles.smallActionButton,
                  {
                    backgroundColor: theme.primarySoft,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="open-outline"
                  size={18}
                  color={theme.primary}
                />
              </Pressable>
            </View>

            {/* ------------------------------------------------------------ */}
            {/* Public Embed */}
            {/* ------------------------------------------------------------ */}

            <Pressable
              onPress={openCalendarEmbed}
              style={({ pressed }) => [
                styles.embedCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.embedIcon,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <Ionicons
                  name="globe-outline"
                  size={21}
                  color={theme.primary}
                />
              </View>

              <View style={styles.flexOne}>
                <Text
                  style={[
                    styles.quickTitle,
                    { color: theme.text },
                  ]}
                >
                  View Calendar Embed
                </Text>

                <Text
                  style={[
                    styles.quickDescription,
                    { color: theme.secondaryText },
                  ]}
                >
                  Open the calendar's public embed view
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.mutedText}
              />
            </Pressable>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* No calendar */}
        {/* ---------------------------------------------------------------- */}

        {!calendarId && !isError && (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={48}
                color={theme.primary}
              />
            </View>

            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text },
              ]}
            >
              No Calendar Connected
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                { color: theme.secondaryText },
              ]}
            >
              Your organisation has not configured a Google Calendar yet.
              Connect a calendar from your organisation settings to use team
              calendar features.
            </Text>

            <Pressable
              onPress={openGoogleCalendar}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.emptyButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name="logo-google"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.primaryButtonText}>
                Open Google Calendar
              </Text>
            </Pressable>

            {/* ------------------------------------------------------------ */}
            {/* Quick Links */}
            {/* ------------------------------------------------------------ */}

            <View
              style={[
                styles.linksCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.linksTitle,
                  { color: theme.text },
                ]}
              >
                Quick Links
              </Text>

              <EmptyLink
                icon="add-circle-outline"
                color={theme.purple}
                label="Create Event"
                onPress={openCreateEvent}
                theme={theme}
              />

              <EmptyLink
                icon="today-outline"
                color={theme.orange}
                label="Today's Schedule"
                onPress={openToday}
                theme={theme}
              />

              <EmptyLink
                icon="calendar-outline"
                color={theme.success}
                label="Week View"
                onPress={openWeek}
                theme={theme}
              />

              <EmptyLink
                icon="grid-outline"
                color={theme.primary}
                label="Month View"
                onPress={openMonth}
                theme={theme}
                last
              />
            </View>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * ============================================================================
 * Empty Link
 * ============================================================================
 */

function EmptyLink({
  icon,
  color,
  label,
  onPress,
  theme,
  last = false,
}: {
  icon: IoniconName;
  color: string;
  label: string;
  onPress: () => void;
  theme: {
    surface: string;
    border: string;
    text: string;
    secondaryText: string;
  };
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.emptyLink,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
        },
        {
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={19}
        color={color}
      />

      <Text
        style={[
          styles.emptyLinkText,
          { color: theme.text },
        ]}
      >
        {label}
      </Text>

      <Ionicons
        name="open-outline"
        size={16}
        color={theme.secondaryText}
      />
    </Pressable>
  );
}

/*
 * ============================================================================
 * Styles
 * ============================================================================
 */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  flexOne: {
    flex: 1,
  },

  /*
   * Header
   */

  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },

  headerContent: {
    flex: 1,
    paddingRight: 16,
  },

  headerTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },

  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /*
   * Loading
   */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  loadingSpinner: {
    marginBottom: 12,
  },

  loadingTitle: {
    fontSize: 17,
    fontWeight: '700',
  },

  loadingDescription: {
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',
  },

  /*
   * Error
   */

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },

  errorIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryButton: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },

  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /*
   * Connected card
   */

  connectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    gap: 12,
  },

  connectedIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  connectedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  calendarId: {
    fontSize: 11,
    marginTop: 5,
  },

  /*
   * Buttons
   */

  primaryActions: {
    gap: 10,
    marginBottom: 24,
  },

  primaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  secondaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 8,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  /*
   * Section
   */

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  /*
   * Quick actions
   */

  quickList: {
    gap: 8,
    marginBottom: 24,
  },

  quickCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
    gap: 12,
  },

  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },

  quickDescription: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },

  /*
   * Team calendar
   */

  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },

  teamIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallActionButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /*
   * Embed
   */

  embedCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
    gap: 12,
  },

  embedIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /*
   * Generic card text
   */

  cardTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },

  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  /*
   * Empty state
   */

  emptyContainer: {
    alignItems: 'center',
    paddingTop: 36,
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  emptyDescription: {
    maxWidth: 330,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 9,
  },

  emptyButton: {
    width: '100%',
    marginTop: 22,
  },

  /*
   * Quick links
   */

  linksCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginTop: 24,
    overflow: 'hidden',
  },

  linksTitle: {
    fontSize: 15,
    fontWeight: '800',
    paddingTop: 15,
    paddingBottom: 4,
  },

  emptyLink: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  emptyLinkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },

  bottomSpace: {
    height: 100,
  },
});
