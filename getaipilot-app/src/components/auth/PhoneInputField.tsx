import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COUNTRIES,
  CountryItem,
  DEFAULT_COUNTRY,
  validatePhoneNumber,
} from "../../lib/phoneUtils";

interface PhoneInputFieldProps {
  value: string;
  onChange: (raw: string, normalized: string, isValid: boolean) => void;
  disabled?: boolean;
  isDark?: boolean;
  placeholderColor?: string;
  onSubmitEditing?: () => void;
}

export function PhoneInputField({
  value,
  onChange,
  disabled = false,
  isDark = false,
  placeholderColor = "#9CA3AF",
  onSubmitEditing,
}: PhoneInputFieldProps) {
  const insets = useSafeAreaInsets();
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(DEFAULT_COUNTRY);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    const numericQ = q.replace(/\D/g, "");
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.isoCode.toLowerCase().includes(q) ||
        (numericQ.length > 0 && c.phonecode.includes(numericQ))
    );
  }, [searchQuery]);

  const handleCountrySelect = (country: CountryItem) => {
    setSelectedCountry(country);
    setModalVisible(false);
    setSearchQuery("");
    const validation = validatePhoneNumber(value, country.isoCode, country.phonecode);
    onChange(value, validation.normalized, validation.isValid);
  };

  const handleTextChange = (raw: string) => {
    const validation = validatePhoneNumber(
      raw,
      selectedCountry.isoCode,
      selectedCountry.phonecode
    );
    onChange(raw, validation.normalized, validation.isValid);
  };

  return (
    <>
      <View style={[styles.container, isDark && styles.containerDark, disabled && styles.disabled]}>
        <Pressable
          style={[styles.countryTrigger, isDark && styles.countryTriggerDark]}
          onPress={() => {
            if (!disabled) setModalVisible(true);
          }}
          disabled={disabled}
          hitSlop={6}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={[styles.dialCode, isDark && styles.dialCodeDark]}>
            +{selectedCountry.phonecode}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />
        </Pressable>

        <View style={[styles.verticalDivider, isDark && styles.verticalDividerDark]} />

        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder={selectedCountry.isoCode === "IN" ? "98765 43210" : "Phone number"}
          placeholderTextColor={placeholderColor}
          value={value}
          onChangeText={handleTextChange}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          editable={!disabled}
          returnKeyType="done"
          onSubmitEditing={onSubmitEditing}
        />

        {value.length > 0 && !disabled && (
          <Pressable
            onPress={() => handleTextChange("")}
            hitSlop={10}
            style={styles.clearBtn}
          >
            <Ionicons
              name="close-circle"
              size={16}
              color={isDark ? "#6B7280" : "#9CA3AF"}
            />
          </Pressable>
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              isDark && styles.modalSheetDark,
              { paddingBottom: Math.max(insets.bottom + 12, 20) },
            ]}
          >
            <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                Select Country
              </Text>
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery("");
                }}
                hitSlop={10}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? "#E5E7EB" : "#111827"}
                />
              </Pressable>
            </View>

            <View style={[styles.searchBox, isDark && styles.searchBoxDark]}>
              <Ionicons
                name="search"
                size={16}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <TextInput
                style={[styles.searchInput, isDark && styles.searchInputDark]}
                placeholder="Search country or dial code..."
                placeholderTextColor={placeholderColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={isDark ? "#6B7280" : "#9CA3AF"}
                  />
                </Pressable>
              )}
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => `${item.isoCode}-${item.phonecode}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.isoCode === selectedCountry.isoCode;
                return (
                  <Pressable
                    style={[
                      styles.countryRow,
                      isSelected && (isDark ? styles.countryRowSelectedDark : styles.countryRowSelected),
                    ]}
                    onPress={() => handleCountrySelect(item)}
                  >
                    <View style={styles.countryRowLeft}>
                      <Text style={styles.rowFlag}>{item.flag}</Text>
                      <Text
                        style={[styles.countryName, isDark && styles.countryNameDark]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <View style={styles.countryRowRight}>
                      <Text style={[styles.rowCode, isDark && styles.rowCodeDark]}>
                        +{item.phonecode}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={isDark ? "#FFFFFF" : "#17171C"}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                    No countries found
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EEF8",
    borderRadius: 16,
    minHeight: 52,
    paddingRight: 14,
    overflow: "hidden",
  },
  containerDark: {
    backgroundColor: "#252230",
  },
  disabled: {
    opacity: 0.65,
  },
  countryTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  countryTriggerDark: {},
  flag: {
    fontSize: 18,
  },
  dialCode: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  dialCodeDark: {
    color: "#FFFFFF",
  },
  verticalDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: "#D8D4E8",
    marginRight: 12,
  },
  verticalDividerDark: {
    backgroundColor: "#3A3549",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
    paddingVertical: 14,
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  inputDark: {
    color: "#FFFFFF",
  },
  clearBtn: {
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    paddingTop: 16,
  },
  modalSheetDark: {
    backgroundColor: "#1D1B26",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  modalHeaderDark: {
    borderBottomColor: "#322E42",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  modalTitleDark: {
    color: "#FFFFFF",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  searchBoxDark: {
    backgroundColor: "#2A2638",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  searchInputDark: {
    color: "#FFFFFF",
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  countryRowSelected: {
    backgroundColor: "#F0EEF8",
  },
  countryRowSelectedDark: {
    backgroundColor: "#2A2638",
  },
  countryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  rowFlag: {
    fontSize: 20,
  },
  countryName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
  },
  countryNameDark: {
    color: "#F3F4F6",
  },
  countryRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  rowCodeDark: {
    color: "#9CA3AF",
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyTextDark: {
    color: "#9CA3AF",
  },
});
