import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function formatISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(isoString?: string | null): string {
  if (!isoString) return '';
  const parts = isoString.split('-');
  if (parts.length !== 3) return isoString;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return isoString;

  const today = new Date();
  const todayISO = formatISODate(today);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = formatISODate(tomorrow);

  if (isoString === todayISO) {
    return 'Today, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (isoString === tomorrowISO) {
    return 'Tomorrow, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateISO: string) => void;
  selectedDate?: string | null; // Format: 'YYYY-MM-DD'
  title?: string;
  minDate?: string | null; // Format: 'YYYY-MM-DD'
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  title = 'Select Date',
  minDate,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Parse current selection or default to today
  const initialDate = useMemo(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const parsed = new Date(y, m, d);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
    return new Date();
  }, [selectedDate]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());
  const [highlightedISO, setHighlightedISO] = useState<string>(
    selectedDate || formatISODate(new Date())
  );

  // Sync state whenever modal opens or selectedDate changes
  useEffect(() => {
    if (visible) {
      if (selectedDate) {
        setHighlightedISO(selectedDate);
        const parts = selectedDate.split('-');
        if (parts.length === 3) {
          setCurrentYear(parseInt(parts[0], 10));
          setCurrentMonth(parseInt(parts[1], 10) - 1);
        }
      } else {
        const now = new Date();
        setHighlightedISO(formatISODate(now));
        setCurrentYear(now.getFullYear());
        setCurrentMonth(now.getMonth());
      }
    }
  }, [visible, selectedDate]);

  // Calendar math
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  const todayISO = useMemo(() => formatISODate(new Date()), []);

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleDaySelect = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    const iso = formatISODate(d);
    Haptics.selectionAsync().catch(() => {});
    setHighlightedISO(iso);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelectDate(highlightedISO);
    onClose();
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectDate('');
    onClose();
  };

  // Quick preset shortcuts
  const presets = useMemo(() => {
    const today = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const in3Days = new Date();
    in3Days.setDate(today.getDate() + 3);

    // Next Monday
    const nextMon = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilNextMon = ((8 - dayOfWeek) % 7) || 7;
    nextMon.setDate(today.getDate() + daysUntilNextMon);

    // In 2 weeks
    const in2Weeks = new Date();
    in2Weeks.setDate(today.getDate() + 14);

    // End of this month
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return [
      { label: 'Today', date: today },
      { label: 'Tomorrow', date: tomorrow },
      { label: 'In 3 Days', date: in3Days },
      { label: 'Next Week', date: nextMon },
      { label: 'In 2 Weeks', date: in2Weeks },
      { label: 'End of Month', date: endOfMonth },
    ];
  }, []);

  const handleApplyPreset = (d: Date) => {
    Haptics.selectionAsync().catch(() => {});
    const iso = formatISODate(d);
    setHighlightedISO(iso);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#181A20' : '#FFFFFF',
              borderColor: isDark ? '#262A34' : '#E2E8F0',
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Grabber */}
          <View style={[styles.grabber, { backgroundColor: isDark ? '#2D323F' : '#E2E8F0' }]} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {title}
              </Text>
              <Text style={[styles.headerSelectedDate, { color: '#3B82F6' }]}>
                {formatDateDisplay(highlightedISO) || 'No date selected'}
              </Text>
            </View>

            <Pressable
              style={[styles.closeBtn, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={isDark ? '#9CA3AF' : '#64748B'} />
            </Pressable>
          </View>

          {/* Quick Preset Shortcut Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsContainer}
          >
            {presets.map((p) => {
              const pISO = formatISODate(p.date);
              const isSelected = highlightedISO === pISO;
              return (
                <Pressable
                  key={p.label}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isSelected
                        ? '#3B82F6'
                        : isDark
                        ? '#222630'
                        : '#F1F5F9',
                      borderColor: isSelected ? '#3B82F6' : isDark ? '#2D323F' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => handleApplyPreset(p.date)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      { color: isSelected ? '#FFFFFF' : isDark ? '#D1D5DB' : '#334155' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Month & Year Navigation Row */}
          <View style={styles.monthNavRow}>
            <Pressable
              style={[styles.navArrowBtn, { backgroundColor: isDark ? '#222630' : '#F1F5F9' }]}
              onPress={handlePrevMonth}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={18} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </Pressable>

            <Text style={[styles.monthYearText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>

            <Pressable
              style={[styles.navArrowBtn, { backgroundColor: isDark ? '#222630' : '#F1F5F9' }]}
              onPress={handleNextMonth}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </Pressable>
          </View>

          {/* Weekday Header */}
          <View style={styles.weekDaysRow}>
            {WEEK_DAYS.map((dayName, idx) => (
              <View key={idx} style={styles.dayCol}>
                <Text
                  style={[
                    styles.weekDayText,
                    { color: idx === 0 || idx === 6 ? '#9CA3AF' : isDark ? '#6B7280' : '#94A3B8' },
                  ]}
                >
                  {dayName}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Days Grid */}
          <View style={styles.calendarGrid}>
            {/* Empty slots for first week padding */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const cellDate = new Date(currentYear, currentMonth, dayNum);
              const cellISO = formatISODate(cellDate);
              const isSelected = highlightedISO === cellISO;
              const isToday = todayISO === cellISO;
              const isDisabled = minDate ? cellISO < minDate : false;

              return (
                <Pressable
                  key={`day-${dayNum}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                    isDisabled && { opacity: 0.3 },
                  ]}
                  disabled={isDisabled}
                  onPress={() => handleDaySelect(dayNum)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && { color: '#3B82F6', fontWeight: '700' },
                    ]}
                  >
                    {dayNum}
                  </Text>
                  {isToday && !isSelected && <View style={styles.todayDot} />}
                </Pressable>
              );
            })}
          </View>

          {/* Footer Actions */}
          <View style={[styles.footerRow, { borderTopColor: isDark ? '#262A34' : '#E2E8F0' }]}>
            <Pressable
              style={[styles.clearBtn, { backgroundColor: isDark ? '#222630' : '#F1F5F9' }]}
              onPress={handleClear}
            >
              <Text style={[styles.clearBtnText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                Clear
              </Text>
            </Pressable>

            <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Set Date</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

interface DatePickerFieldProps {
  label: string;
  value?: string | null; // Format 'YYYY-MM-DD'
  onChangeDate: (dateISO: string) => void;
  placeholder?: string;
  minDate?: string | null;
  error?: string;
  disabled?: boolean;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChangeDate,
  placeholder = 'Select date...',
  minDate,
  error,
  disabled,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [modalVisible, setModalVisible] = useState(false);

  const displayString = value ? formatDateDisplay(value) : '';

  return (
    <View style={styles.fieldWrapper}>
      {label ? (
        <Text style={[styles.fieldLabel, { color: isDark ? '#D1D5DB' : '#334155' }]}>
          {label}
        </Text>
      ) : null}

      <Pressable
        style={[
          styles.fieldInput,
          {
            backgroundColor: isDark ? '#121316' : '#F8FAFC',
            borderColor: error
              ? '#EF4444'
              : modalVisible
              ? '#3B82F6'
              : isDark
              ? '#262A34'
              : '#CBD5E1',
          },
          disabled && { opacity: 0.6 },
        ]}
        disabled={disabled}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setModalVisible(true);
        }}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={value ? '#3B82F6' : isDark ? '#6B7280' : '#94A3B8'}
          style={styles.fieldIcon}
        />

        <Text
          style={[
            styles.fieldText,
            displayString
              ? { color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: '500' }
              : { color: isDark ? '#6B7280' : '#94A3B8' },
          ]}
          numberOfLines={1}
        >
          {displayString || placeholder}
        </Text>

        {value ? (
          <Pressable
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onChangeDate('');
            }}
          >
            <Ionicons name="close-circle" size={16} color={isDark ? '#6B7280' : '#94A3B8'} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={16} color={isDark ? '#6B7280' : '#94A3B8'} />
        )}
      </Pressable>

      {error ? <Text style={styles.fieldError}>{error}</Text> : null}

      <DatePickerModal
        visible={modalVisible}
        title={label || 'Select Date'}
        selectedDate={value}
        minDate={minDate}
        onClose={() => setModalVisible(false)}
        onSelectDate={onChangeDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSelectedDate: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsContainer: {
    gap: 8,
    paddingVertical: 6,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayCol: {
    width: (SCREEN_WIDTH - 40) / 7,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: (SCREEN_WIDTH - 40) / 7,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    position: 'absolute',
    bottom: 5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  clearBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldText: {
    flex: 1,
    fontSize: 14,
  },
  fieldError: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
  },
});
