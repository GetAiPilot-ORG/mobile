import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CanvasConfig,
  CanvasTemplateId,
  QRStyles,
  QRType,
} from './types';
import { useTheme, getColors } from '@/theme';
import * as Haptics from 'expo-haptics';

interface FormInputsProps {
  canvasId: CanvasTemplateId;
  config: CanvasConfig;
  onChangeConfig: React.Dispatch<React.SetStateAction<CanvasConfig>>;
  styles: QRStyles;
  onChangeStyles: React.Dispatch<React.SetStateAction<QRStyles>>;
  qrType: QRType;
  onChangeQrType: (type: QRType) => void;
  title: string;
  onChangeTitle: (title: string) => void;
  // Specific payload states
  urlContent: string;
  onChangeUrlContent: (val: string) => void;
  wifiSsid: string;
  onChangeWifiSsid: (val: string) => void;
  wifiPassword: string;
  onChangeWifiPassword: (val: string) => void;
  wifiEncryption: 'WPA' | 'WEP' | 'nopass';
  onChangeWifiEncryption: (val: 'WPA' | 'WEP' | 'nopass') => void;
  vcardFirst: string;
  onChangeVcardFirst: (val: string) => void;
  vcardLast: string;
  onChangeVcardLast: (val: string) => void;
  vcardPhone: string;
  onChangeVcardPhone: (val: string) => void;
  vcardEmail: string;
  onChangeVcardEmail: (val: string) => void;
  vcardOrg: string;
  onChangeVcardOrg: (val: string) => void;
  vcardTitle: string;
  onChangeVcardTitle: (val: string) => void;
  vcardUrl: string;
  onChangeVcardUrl: (val: string) => void;
  googleReviewUrl: string;
  onChangeGoogleReviewUrl: (val: string) => void;
  reviewBizName: string;
  onChangeReviewBizName: (val: string) => void;
  reviewSuccessMsg: string;
  onChangeReviewSuccessMsg: (val: string) => void;
  reviewDesc: string;
  onChangeReviewDesc: (val: string) => void;
  emailTo: string;
  onChangeEmailTo: (val: string) => void;
  emailSubject: string;
  onChangeEmailSubject: (val: string) => void;
  emailBody: string;
  onChangeEmailBody: (val: string) => void;
  onNextStep: () => void;
}

const COLOR_PRESETS = [
  { name: 'Classic Black', hex: '#000000' },
  { name: 'Forest Green', hex: '#0A4737' },
  { name: 'Royal Blue', hex: '#1D4ED8' },
  { name: 'Crimson Wine', hex: '#991B1B' },
  { name: 'Amethyst Violet', hex: '#6D28D9' },
  { name: 'Warm Amber', hex: '#B45309' },
];

export const CanvasFormInputs: React.FC<FormInputsProps> = ({
  canvasId,
  config,
  onChangeConfig,
  styles: qrStyles,
  onChangeStyles,
  qrType,
  onChangeQrType,
  title,
  onChangeTitle,
  urlContent,
  onChangeUrlContent,
  wifiSsid,
  onChangeWifiSsid,
  wifiPassword,
  onChangeWifiPassword,
  wifiEncryption,
  onChangeWifiEncryption,
  vcardFirst,
  onChangeVcardFirst,
  vcardLast,
  onChangeVcardLast,
  vcardPhone,
  onChangeVcardPhone,
  vcardEmail,
  onChangeVcardEmail,
  vcardOrg,
  onChangeVcardOrg,
  vcardTitle,
  onChangeVcardTitle,
  vcardUrl,
  onChangeVcardUrl,
  googleReviewUrl,
  onChangeGoogleReviewUrl,
  reviewBizName,
  onChangeReviewBizName,
  reviewSuccessMsg,
  onChangeReviewSuccessMsg,
  reviewDesc,
  onChangeReviewDesc,
  emailTo,
  onChangeEmailTo,
  emailSubject,
  onChangeEmailSubject,
  emailBody,
  onChangeEmailBody,
  onNextStep,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [activeTab, setActiveTab] = useState<'canvas' | 'payload'>('canvas');

  const updateField = (key: keyof CanvasConfig, value: any) => {
    onChangeConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateNested = <K extends keyof CanvasConfig>(
    section: K,
    key: keyof CanvasConfig[K],
    value: any
  ) => {
    onChangeConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value,
      },
    }));
  };

  return (
    <View style={styles.container}>
      {/* Editorial Sub-Tabs */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDark ? '#1C1B24' : '#F1F5F9',
            borderColor: colors.border,
          },
        ]}
      >
        <Pressable
          style={[
            styles.tabItem,
            activeTab === 'canvas' && [
              styles.tabItemActive,
              { backgroundColor: isDark ? '#262435' : '#FFFFFF' },
            ],
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('canvas');
          }}
        >
          <Ionicons
            name="cube-outline"
            size={16}
            color={activeTab === 'canvas' ? '#0A4737' : colors.mutedForeground}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'canvas' ? (isDark ? '#34D399' : '#0A4737') : colors.mutedForeground,
                fontWeight: activeTab === 'canvas' ? '800' : '600',
              },
            ]}
          >
            1. Standee Design & Text
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabItem,
            activeTab === 'payload' && [
              styles.tabItemActive,
              { backgroundColor: isDark ? '#262435' : '#FFFFFF' },
            ],
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('payload');
          }}
        >
          <Ionicons
            name="link-outline"
            size={16}
            color={activeTab === 'payload' ? '#0A4737' : colors.mutedForeground}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'payload' ? (isDark ? '#34D399' : '#0A4737') : colors.mutedForeground,
                fontWeight: activeTab === 'payload' ? '800' : '600',
              },
            ]}
          >
            2. QR Link & Destination
          </Text>
        </Pressable>
      </View>

      {/* ── TAB 1: STANDEE DESIGN & TEXT ── */}
      {activeTab === 'canvas' && (
        <View style={styles.formSection}>
          {/* Core Business Details Card */}
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: isDark ? '#181722' : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="business-outline" size={18} color="#0A4737" />
              <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                Business & Brand Details
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Business / Store Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#222030' : '#F8FAFC',
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={config.brandName}
                onChangeText={(val) => updateField('brandName', val)}
                placeholder="e.g. GetAiPilot or Blue Lagoon Hotel"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {/* Template Specific Inputs */}
            {canvasId === 'bold-retail-promo' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Poster Headline
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.boldRetailPromo?.headline}
                    onChangeText={(v) => updateNested('boldRetailPromo', 'headline', v)}
                    placeholder="SCAN HERE"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Subheadline
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.boldRetailPromo?.subheadline}
                    onChangeText={(v) => updateNested('boldRetailPromo', 'subheadline', v)}
                    placeholder="TO SEE OUR BEST PRODUCTS"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Discount Callout Text
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.boldRetailPromo?.discountText}
                    onChangeText={(v) => updateNested('boldRetailPromo', 'discountText', v)}
                    placeholder="GET DISCOUNT UP TO 50% OFF!"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </>
            )}

            {canvasId === 'curved-wave-menu' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Menu Title
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.curvedWaveMenu?.menuTitle}
                    onChangeText={(v) => updateNested('curvedWaveMenu', 'menuTitle', v)}
                    placeholder="E-MENU"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Menu Subtitle
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.curvedWaveMenu?.menuSubtitle}
                    onChangeText={(v) => updateNested('curvedWaveMenu', 'menuSubtitle', v)}
                    placeholder="For a contactless menu, scan QR code"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </>
            )}

            {canvasId === 'acrylic-standee' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Review Instruction Tagline
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.acrylic?.tagline}
                    onChangeText={(v) => updateNested('acrylic', 'tagline', v)}
                    placeholder="Scan this QR code to review our stay on Google"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Rating Badge Text
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.acrylic?.googleRatingText}
                    onChangeText={(v) => updateNested('acrylic', 'googleRatingText', v)}
                    placeholder="Google 4.9 ★★★★★"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                {/* Wood Finish Options */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Hardwood Base Finish
                  </Text>
                  <View style={styles.chipRow}>
                    {(['oak', 'walnut', 'birch', 'black'] as const).map((finish) => (
                      <Pressable
                        key={finish}
                        onPress={() => updateNested('acrylic', 'woodFinish', finish)}
                        style={[
                          styles.selectionChip,
                          {
                            backgroundColor:
                              config.acrylic.woodFinish === finish
                                ? '#0A4737'
                                : isDark
                                ? '#222030'
                                : '#F1F5F9',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectionChipText,
                            {
                              color:
                                config.acrylic.woodFinish === finish
                                  ? '#FFFFFF'
                                  : colors.foreground,
                            },
                          ]}
                        >
                          {finish.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}

            {canvasId === 'tent-stand' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Headline Text
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.tent?.headline}
                    onChangeText={(v) => updateNested('tent', 'headline', v)}
                    placeholder="SCAN QR CODE"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Table Number
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.tent?.tableNumber}
                    onChangeText={(v) => updateNested('tent', 'tableNumber', v)}
                    placeholder="TABLE #04"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </>
            )}

            {canvasId === 'retail-pay' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Top Ribbon Banner Text
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.retailPay?.ribbonText}
                    onChangeText={(v) => updateNested('retailPay', 'ribbonText', v)}
                    placeholder="SCAN & PAY"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Payment Header Title
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={config.retailPay?.title}
                    onChangeText={(v) => updateNested('retailPay', 'title', v)}
                    placeholder="QRIS / UPI PAY"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </>
            )}
          </View>

          {/* QR Code Aesthetics (Color & Center Logo) */}
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: isDark ? '#181722' : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="color-palette-outline" size={18} color="#0A4737" />
              <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                QR Code Styling
              </Text>
            </View>

            {/* Color Palette Presets */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                QR Code Color
              </Text>
              <View style={styles.colorRow}>
                {COLOR_PRESETS.map((p) => {
                  const isSelected = (qrStyles.fgColor || '#000000') === p.hex;
                  return (
                    <Pressable
                      key={p.hex}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onChangeStyles((prev) => ({ ...prev, fgColor: p.hex }));
                      }}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: p.hex },
                        isSelected && styles.colorCircleSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Center Logo Toggle */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchTitle, { color: colors.foreground }]}>
                  Show Center Brand Logo
                </Text>
                <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>
                  Adds the official GetAiPilot emblem inside the QR center.
                </Text>
              </View>
              <Switch
                value={config.showCenterLogo !== false}
                onValueChange={(val) => updateField('showCenterLogo', val)}
                trackColor={{ false: colors.border, true: '#0A4737' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
      )}

      {/* ── TAB 2: QR LINK & DESTINATION (PAYLOAD) ── */}
      {activeTab === 'payload' && (
        <View style={styles.formSection}>
          {/* QR Type Selector Chips */}
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: isDark ? '#181722' : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardHeaderTitle, { color: colors.foreground, marginBottom: 8 }]}>
              Select What Happens on Scan
            </Text>

            <View style={styles.typeGrid}>
              {[
                { id: 'review', label: 'Review Gate', icon: 'star', badge: 'Google' },
                { id: 'url', label: 'Website Link', icon: 'link', badge: 'Direct' },
                { id: 'wifi', label: 'Wi-Fi Access', icon: 'wifi', badge: 'Fast' },
                { id: 'vcard', label: 'vCard Profile', icon: 'person', badge: 'Contact' },
                { id: 'email', label: 'Email Mailto', icon: 'mail', badge: 'Inbox' },
              ].map((t) => {
                const isSelected = qrType === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onChangeQrType(t.id as QRType);
                    }}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#143126'
                            : '#ECFDF5'
                          : isDark
                          ? '#222030'
                          : '#F8FAFC',
                        borderColor: isSelected ? '#0A4737' : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={t.icon as any}
                      size={18}
                      color={isSelected ? '#0A4737' : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#6EE7B7'
                              : '#0A4737'
                            : colors.foreground,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Title / Internal Label */}
            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                QR Standee Internal Title
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#222030' : '#F8FAFC',
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={title}
                onChangeText={onChangeTitle}
                placeholder="e.g. Reception Desk Standee"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          {/* ── TYPE 1: GOOGLE REVIEW GATE ── */}
          {qrType === 'review' && (
            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: isDark ? '#231D12' : '#FFFBEB',
                  borderColor: isDark ? '#78350F' : '#FDE68A',
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Ionicons name="star" size={18} color="#D97706" />
                <Text style={[styles.cardHeaderTitle, { color: '#B45309' }]}>
                  Google Review Smart Filter
                </Text>
              </View>
              <Text style={[styles.tipText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                Guests who give 4 or 5 stars are forwarded directly to your Google Review page.
                Guests who give 1 to 3 stars submit private feedback directly to your dashboard so
                you can resolve issues without negative Google ratings!
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Google Review URL
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={googleReviewUrl}
                  onChangeText={onChangeGoogleReviewUrl}
                  placeholder="https://g.page/r/your-google-place/review"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Business Name on Review Page
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={reviewBizName}
                  onChangeText={onChangeReviewBizName}
                  placeholder="e.g. The Grand Vista Hotel"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Prompt Message
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={reviewDesc}
                  onChangeText={onChangeReviewDesc}
                  placeholder="Please rate your stay with us today"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>
          )}

          {/* ── TYPE 2: WEBSITE URL ── */}
          {qrType === 'url' && (
            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: isDark ? '#181722' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Destination Website URL
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#222030' : '#F8FAFC',
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={urlContent}
                onChangeText={(v) => {
                  onChangeUrlContent(v);
                  updateField('targetUrl', v);
                }}
                placeholder="https://getaipilot.in/menu or your payment link"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
              />
              <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                Smartphones scanning this code will immediately open this webpage in their browser.
              </Text>
            </View>
          )}

          {/* ── TYPE 3: WI-FI ACCESS ── */}
          {qrType === 'wifi' && (
            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: isDark ? '#181722' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Wi-Fi Network Name (SSID)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#222030' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={wifiSsid}
                  onChangeText={onChangeWifiSsid}
                  placeholder="e.g. Cafe_Guest_Wifi"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Wi-Fi Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#222030' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={wifiPassword}
                  onChangeText={onChangeWifiPassword}
                  placeholder="Leave empty if open"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Security Encryption
                </Text>
                <View style={styles.chipRow}>
                  {[
                    { id: 'WPA', label: 'WPA / WPA2' },
                    { id: 'WEP', label: 'WEP' },
                    { id: 'nopass', label: 'Open' },
                  ].map((enc) => (
                    <Pressable
                      key={enc.id}
                      onPress={() => onChangeWifiEncryption(enc.id as any)}
                      style={[
                        styles.selectionChip,
                        {
                          backgroundColor:
                            wifiEncryption === enc.id
                              ? '#0A4737'
                              : isDark
                              ? '#222030'
                              : '#F1F5F9',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectionChipText,
                          {
                            color:
                              wifiEncryption === enc.id
                                ? '#FFFFFF'
                                : colors.foreground,
                          },
                        ]}
                      >
                        {enc.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── TYPE 4: VCARD CONTACT PROFILE ── */}
          {qrType === 'vcard' && (
            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: isDark ? '#181722' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>First Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={vcardFirst}
                    onChangeText={onChangeVcardFirst}
                    placeholder="John"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Last Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={vcardLast}
                    onChangeText={onChangeVcardLast}
                    placeholder="Doe"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Phone Number</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#222030' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={vcardPhone}
                  onChangeText={onChangeVcardPhone}
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Email Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#222030' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={vcardEmail}
                  onChangeText={onChangeVcardEmail}
                  placeholder="john@example.com"
                  keyboardType="email-address"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Company</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={vcardOrg}
                    onChangeText={onChangeVcardOrg}
                    placeholder="Acme Corp"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Job Title</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#222030' : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={vcardTitle}
                    onChangeText={onChangeVcardTitle}
                    placeholder="CEO"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ── TYPE 5: EMAIL ── */}
          {qrType === 'email' && (
            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: isDark ? '#181722' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Recipient Email
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#222030' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={emailTo}
                  onChangeText={onChangeEmailTo}
                  placeholder="support@company.com"
                  keyboardType="email-address"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Subject Line
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#222030' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={emailSubject}
                  onChangeText={onChangeEmailSubject}
                  placeholder="Inquiry from QR Standee"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Email Body Note
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: isDark ? '#222030' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={emailBody}
                  onChangeText={onChangeEmailBody}
                  placeholder="Hello, I would like to learn more..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Floating Bottom Action */}
      <Pressable
        style={[styles.primaryActionBtn, { backgroundColor: '#0A4737' }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onNextStep();
        }}
      >
        <Text style={styles.primaryActionBtnText}>Next: Preview & Export</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    gap: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabItemActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
  },
  formSection: {
    gap: 12,
  },
  cardBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  fieldHint: {
    fontSize: 11,
    marginTop: 2,
  },
  input: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textArea: {
    height: 75,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 11.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  selectionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#34D399',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  switchTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  switchDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  tipText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  primaryActionBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
