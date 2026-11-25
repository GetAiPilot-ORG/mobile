import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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

  const pickImageAsDataUrl = async (onPicked: (dataUrl: string) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mime = asset.mimeType || 'image/jpeg';
          onPicked(`data:${mime};base64,${asset.base64}`);
        } else if (asset.uri) {
          onPicked(asset.uri);
        }
      }
    } catch (err: any) {
      Alert.alert('Image Error', err?.message || 'Could not select image.');
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isDark ? '#222030' : '#F8FAFC',
      borderColor: colors.border,
      color: colors.foreground,
    },
  ];

  const textAreaStyle = [
    styles.textArea,
    {
      backgroundColor: isDark ? '#222030' : '#F8FAFC',
      borderColor: colors.border,
      color: colors.foreground,
    },
  ];

  const cardBoxStyle = [
    styles.cardBox,
    {
      backgroundColor: isDark ? '#181722' : '#FFFFFF',
      borderColor: colors.border,
    },
  ];

  const renderField = (
    label: string,
    value: string | undefined,
    onChangeText: (v: string) => void,
    placeholder: string,
    opts?: { multiline?: boolean; keyboardType?: any; autoCapitalize?: any }
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={opts?.multiline ? textAreaStyle : inputStyle}
        value={value ?? ''}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={opts?.multiline}
        numberOfLines={opts?.multiline ? 2 : 1}
        keyboardType={opts?.keyboardType}
        autoCapitalize={opts?.autoCapitalize}
      />
    </View>
  );

  const renderChipSelector = (
    label: string,
    options: { id: string; label: string; dot?: string }[],
    selectedId: string,
    onSelect: (id: string) => void
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt.id);
              }}
              style={[
                styles.themeChip,
                {
                  backgroundColor: isSelected
                    ? '#0A4737'
                    : isDark
                    ? '#222030'
                    : '#F1F5F9',
                  borderColor: isSelected ? '#0A4737' : colors.border,
                },
              ]}
            >
              {opt.dot ? (
                <View
                  style={[
                    styles.themeDot,
                    { backgroundColor: opt.dot, borderColor: isSelected ? '#FFFFFF' : '#CBD5E1' },
                  ]}
                />
              ) : null}
              <Text
                style={[
                  styles.selectionChipText,
                  { color: isSelected ? '#FFFFFF' : colors.foreground },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const showsLogoUploader =
    canvasId === 'social-card' ||
    canvasId === 'acrylic-standee' ||
    canvasId === 'blooming-flower' ||
    canvasId === 'curved-wave-menu';

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
          <View style={cardBoxStyle}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="business-outline" size={18} color="#0A4737" />
              <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                Business & Brand Details
              </Text>
            </View>

            {renderField(
              'Business / Store Name',
              config.brandName,
              (val) => updateField('brandName', val),
              'e.g. GetAiPilot or Blue Lagoon Hotel'
            )}

            {showsLogoUploader && (
              <View style={[styles.logoBox, { borderTopColor: colors.border }]}>
                <View style={styles.logoHeaderRow}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    {canvasId === 'blooming-flower'
                      ? 'Bottom Brand Logo / Icon'
                      : 'Brand Logo / Avatar Badge'}
                  </Text>
                  {Boolean(config.logoUrl) && (
                    <Pressable onPress={() => updateField('logoUrl', '')} style={styles.removeBtn}>
                      <Ionicons name="trash-outline" size={14} color="#E11D48" />
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.logoRow}>
                  <View style={[styles.logoPreviewCircle, { borderColor: colors.border }]}>
                    {config.logoUrl ? (
                      <Image source={{ uri: config.logoUrl }} style={styles.logoPreviewImg} />
                    ) : (
                      <Text style={styles.logoInitials}>
                        {config.brandName ? config.brandName.slice(0, 2).toUpperCase() : 'LOGO'}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    style={[styles.uploadBtn, { borderColor: colors.border }]}
                    onPress={() => pickImageAsDataUrl((uri) => updateField('logoUrl', uri))}
                  >
                    <Ionicons name="cloud-upload-outline" size={15} color="#0A4737" />
                    <Text style={styles.uploadBtnText}>Upload Logo</Text>
                  </Pressable>

                  <TextInput
                    style={[inputStyle, { flex: 1, height: 38 }]}
                    value={config.logoUrl || ''}
                    onChangeText={(val) => updateField('logoUrl', val)}
                    placeholder="Or paste URL..."
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}
          </View>

          {/* ── TEMPLATE SPECIFIC CARDS ── */}

          {/* 1. BOLD RETAIL PROMO */}
          {canvasId === 'bold-retail-promo' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="pricetag-outline" size={18} color="#0A4737" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Bold Retail Promo Settings
                </Text>
              </View>
              {renderChipSelector(
                'Color & Hatch Combination',
                [
                  { id: 'forest-gold', label: 'Forest & Gold', dot: '#0E372B' },
                  { id: 'navy-coral', label: 'Navy & Coral', dot: '#0A192F' },
                  { id: 'crimson-amber', label: 'Crimson & Amber', dot: '#380B0B' },
                  { id: 'obsidian-lime', label: 'Black & Lime', dot: '#09090B' },
                ],
                config.boldRetailPromo?.theme || 'forest-gold',
                (id) => updateNested('boldRetailPromo', 'theme', id)
              )}
              {renderField(
                'Top Main Headline',
                config.boldRetailPromo?.headline,
                (v) => updateNested('boldRetailPromo', 'headline', v),
                'SCAN HERE'
              )}
              {renderField(
                'Top Subtitle',
                config.boldRetailPromo?.subheadline,
                (v) => updateNested('boldRetailPromo', 'subheadline', v),
                'TO SEE OUR BEST PRODUCTS'
              )}
              {renderField(
                'Discount Callout Text',
                config.boldRetailPromo?.discountText,
                (v) => updateNested('boldRetailPromo', 'discountText', v),
                'GET DISCOUNT UP TO 50% OFF!'
              )}
              {renderField(
                'Website URL / Domain Line',
                config.boldRetailPromo?.websiteUrl,
                (v) => updateNested('boldRetailPromo', 'websiteUrl', v),
                'www.getaipilot.in',
                { autoCapitalize: 'none' }
              )}
            </View>
          )}

          {/* 2. CURVED WAVE E-MENU */}
          {canvasId === 'curved-wave-menu' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="restaurant-outline" size={18} color="#148A9D" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Modern Wave E-Menu Settings
                </Text>
              </View>
              {renderChipSelector(
                'Wave Canopy Color Theme',
                [
                  { id: 'teal-ocean', label: 'Ocean Teal', dot: '#148A9D' },
                  { id: 'indigo-night', label: 'Royal Indigo', dot: '#1E295D' },
                  { id: 'terracotta-warm', label: 'Terracotta', dot: '#C25E36' },
                  { id: 'emerald-deep', label: 'Forest Emerald', dot: '#0F6848' },
                ],
                config.curvedWaveMenu?.theme || 'teal-ocean',
                (id) => updateNested('curvedWaveMenu', 'theme', id)
              )}
              {renderField(
                'Top Menu Header',
                config.curvedWaveMenu?.menuTitle,
                (v) => updateNested('curvedWaveMenu', 'menuTitle', v),
                'E-MENU'
              )}
              {renderField(
                'Top Contactless Subtitle',
                config.curvedWaveMenu?.menuSubtitle,
                (v) => updateNested('curvedWaveMenu', 'menuSubtitle', v),
                'For a contactless menu, scan QR code'
              )}
              {renderField(
                'Logo Box Text (Fallback)',
                config.curvedWaveMenu?.logoText,
                (v) => updateNested('curvedWaveMenu', 'logoText', v),
                'YOUR LOGO'
              )}
              {renderField(
                'Bottom Section Title',
                config.curvedWaveMenu?.descriptionTitle,
                (v) => updateNested('curvedWaveMenu', 'descriptionTitle', v),
                'QR MENU DESCRIPTION'
              )}
              {renderField(
                'Eco-Friendly Description',
                config.curvedWaveMenu?.descriptionText,
                (v) => updateNested('curvedWaveMenu', 'descriptionText', v),
                'More comfortable, faster and environmentally friendly.',
                { multiline: true }
              )}
            </View>
          )}

          {/* 3. BOTANICAL APOTHECARY */}
          {canvasId === 'botanical-apothecary' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="leaf-outline" size={18} color="#0A4737" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Botanical Apothecary Settings
                </Text>
              </View>
              {renderChipSelector(
                'Artisan Stone & Material Finish',
                [
                  { id: 'emerald-sage', label: 'Emerald & Marble', dot: '#182E22' },
                  { id: 'vintage-amber', label: 'Vintage Amber', dot: '#2E1908' },
                  { id: 'rose-quartz', label: 'Rose Quartz', dot: '#2E1420' },
                  { id: 'midnight-apothecary', label: 'Midnight Herbal', dot: '#151C19' },
                ],
                config.botanicalApothecary?.theme || 'emerald-sage',
                (id) => updateNested('botanicalApothecary', 'theme', id)
              )}
              {renderField(
                'Apothecary / Spa Name',
                config.botanicalApothecary?.brandName,
                (v) => updateNested('botanicalApothecary', 'brandName', v),
                'ST. CLAIR BOTANICALS'
              )}
              {renderField(
                'Apothecary Subtitle',
                config.botanicalApothecary?.apothecarySubtitle,
                (v) => updateNested('botanicalApothecary', 'apothecarySubtitle', v),
                'Organic Herbal Apothecary & Holistic Spa'
              )}
              {renderField(
                'Heritage Batch & Date',
                config.botanicalApothecary?.batchNumber,
                (v) => updateNested('botanicalApothecary', 'batchNumber', v),
                'BATCH NO. 84 • EST. 1928'
              )}
              {renderField(
                'Wax Seal Stamp Badge',
                config.botanicalApothecary?.waxSealText,
                (v) => updateNested('botanicalApothecary', 'waxSealText', v),
                '100% BOTANICAL'
              )}
              {renderField(
                'Ingredients Ribbon',
                config.botanicalApothecary?.ingredientsList,
                (v) => updateNested('botanicalApothecary', 'ingredientsList', v),
                'Wild French Lavender • Cold-Pressed Jojoba'
              )}
              {renderField(
                'Menu Header / Headline',
                config.botanicalApothecary?.headline,
                (v) => updateNested('botanicalApothecary', 'headline', v),
                'SCAN FOR ELIXIR & SPA RITUAL MENU'
              )}
              {renderField(
                'Ritual Instructions',
                config.botanicalApothecary?.subheadline,
                (v) => updateNested('botanicalApothecary', 'subheadline', v),
                'Handcrafted herbal infusions, aromatherapy rituals & bespoke treatments',
                { multiline: true }
              )}
            </View>
          )}

          {/* 4. LEATHER SOMMELIER */}
          {canvasId === 'leather-sommelier' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="wine-outline" size={18} color="#92400E" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Leather Sommelier Settings
                </Text>
              </View>
              {renderChipSelector(
                'Genuine Leather & Stitch Finish',
                [
                  { id: 'saddle-cognac', label: 'Saddle Cognac', dot: '#3A1D0D' },
                  { id: 'midnight-noir', label: 'Midnight Noir', dot: '#18181B' },
                  { id: 'bordeaux-burgundy', label: 'Bordeaux', dot: '#330F19' },
                  { id: 'forest-hunter', label: 'Hunter Green', dot: '#102418' },
                ],
                config.leatherSommelier?.theme || 'saddle-cognac',
                (id) => updateNested('leatherSommelier', 'theme', id)
              )}
              {renderField(
                'Restaurant / Cellar Name',
                config.leatherSommelier?.restaurantName,
                (v) => updateNested('leatherSommelier', 'restaurantName', v),
                'LE CELLIER VINTAGE'
              )}
              {renderField(
                'Tasting Room Subtitle',
                config.leatherSommelier?.sommelierTitle,
                (v) => updateNested('leatherSommelier', 'sommelierTitle', v),
                'GRAND CRU WINE & TASTING ROOM'
              )}
              {renderField(
                'Table / Sommelier Station',
                config.leatherSommelier?.tableNumber,
                (v) => updateNested('leatherSommelier', 'tableNumber', v),
                'TABLE 14 • SOMMELIER SERVICE'
              )}
              {renderField(
                'Vintage Rating Badge',
                config.leatherSommelier?.vintageRating,
                (v) => updateNested('leatherSommelier', 'vintageRating', v),
                '96 PTS // CELLAR SELECTION'
              )}
              {renderField(
                'Barrel Pairing Note',
                config.leatherSommelier?.pairingNote,
                (v) => updateNested('leatherSommelier', 'pairingNote', v),
                'Oak Barrel Reserve • Aged 24 Months in French Allier'
              )}
              {renderField(
                'Wine List Headline',
                config.leatherSommelier?.headline,
                (v) => updateNested('leatherSommelier', 'headline', v),
                'SCAN FOR SOMMELIER RESERVE WINE LIST'
              )}
              {renderField(
                'Service Instructions',
                config.leatherSommelier?.subheadline,
                (v) => updateNested('leatherSommelier', 'subheadline', v),
                'Curated vintage cellar reserve, artisanal pairings & table-side bill pay',
                { multiline: true }
              )}
            </View>
          )}

          {/* 5. COFFEE ROASTER */}
          {canvasId === 'coffee-roaster' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="cafe-outline" size={18} color="#92400E" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Artisan Coffee Board Settings
                </Text>
              </View>
              {renderChipSelector(
                'Wood & Material Finish',
                [
                  { id: 'nordic-oak', label: 'Nordic Oak', dot: '#DFCEBA' },
                  { id: 'walnut-espresso', label: 'Walnut Espresso', dot: '#2B1D14' },
                  { id: 'terracotta-clay', label: 'Terracotta', dot: '#3A2016' },
                  { id: 'matte-obsidian', label: 'Matte Obsidian', dot: '#18181B' },
                ],
                config.coffeeRoaster?.theme || 'nordic-oak',
                (id) => updateNested('coffeeRoaster', 'theme', id)
              )}
              {renderField(
                'Roastery / Cafe Name',
                config.coffeeRoaster?.shopName,
                (v) => updateNested('coffeeRoaster', 'shopName', v),
                'TIMBER & BEAN ROASTERS'
              )}
              {renderField(
                'Roast Micro-Lot Badge',
                config.coffeeRoaster?.coffeeBeansBadge,
                (v) => updateNested('coffeeRoaster', 'coffeeBeansBadge', v),
                'FRESH ROAST • SINGLE ORIGIN'
              )}
              {renderField(
                'Coffee Origin & Process',
                config.coffeeRoaster?.roastOrigin,
                (v) => updateNested('coffeeRoaster', 'roastOrigin', v),
                'ETHIOPIA GUJI • NATURAL HEIRLOOM'
              )}
              {renderField(
                'Sensory Tasting Notes (use • separator)',
                config.coffeeRoaster?.tastingNotes,
                (v) => updateNested('coffeeRoaster', 'tastingNotes', v),
                'Jasmine Blossom • Ripe Blueberry • Honeycomb • Bergamot'
              )}
              {renderField(
                'Menu Call-To-Action',
                config.coffeeRoaster?.headline,
                (v) => updateNested('coffeeRoaster', 'headline', v),
                'SCAN FOR SPECIALTY BREW MENU'
              )}
              {renderField(
                'Menu Description',
                config.coffeeRoaster?.subheadline,
                (v) => updateNested('coffeeRoaster', 'subheadline', v),
                'View pour-over brew guide, seasonal single-origins & order ahead.',
                { multiline: true }
              )}
              {renderField(
                'Loyalty Offer / Wi-Fi Note',
                config.coffeeRoaster?.loyaltyOffer,
                (v) => updateNested('coffeeRoaster', 'loyaltyOffer', v),
                '☕ 10TH CUP FREE • GUEST WI-FI CONNECTED'
              )}
            </View>
          )}

          {/* 6. CYBER HOLOGRAM */}
          {canvasId === 'cyber-hologram' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="hardware-chip-outline" size={18} color="#06B6D4" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Cyber Hologram & AR Settings
                </Text>
              </View>
              {renderChipSelector(
                'Holographic Plasma Theme',
                [
                  { id: 'iridescent-prism', label: 'Iridescent Prism', dot: '#6366F1' },
                  { id: 'matrix-cyan', label: 'Matrix Cyan', dot: '#06B6D4' },
                  { id: 'solar-flare', label: 'Solar Flare', dot: '#D946EF' },
                  { id: 'quantum-emerald', label: 'Quantum Emerald', dot: '#10B981' },
                ],
                config.cyberHologram?.theme || 'iridescent-prism',
                (id) => updateNested('cyberHologram', 'theme', id)
              )}
              {renderField(
                'Project / Brand Title',
                config.cyberHologram?.projectName,
                (v) => updateNested('cyberHologram', 'projectName', v),
                'QUANTUM // OS 2.0'
              )}
              {renderField(
                'System Protocol Tag',
                config.cyberHologram?.systemTag,
                (v) => updateNested('cyberHologram', 'systemTag', v),
                'AR-SYNCED // LIVE PROTOCOL'
              )}
              {renderField(
                'Action / Security Badge',
                config.cyberHologram?.actionBadge,
                (v) => updateNested('cyberHologram', 'actionBadge', v),
                'QUANTUM SECURE'
              )}
              {renderField(
                'HUD Grid Coordinates',
                config.cyberHologram?.hudCoordinate,
                (v) => updateNested('cyberHologram', 'hudCoordinate', v),
                'SYS.GRID // 47.6062° N, 122.3321° W'
              )}
              {renderField(
                'AR Scan Headline',
                config.cyberHologram?.headline,
                (v) => updateNested('cyberHologram', 'headline', v),
                'SCAN TO ACCESS AR INTERFACE'
              )}
              {renderField(
                'Experience Description',
                config.cyberHologram?.subheadline,
                (v) => updateNested('cyberHologram', 'subheadline', v),
                'Interactive 3D spatial node, developer beta dossier & keynote stream',
                { multiline: true }
              )}
            </View>
          )}

          {/* 7. LUXURY REAL ESTATE */}
          {canvasId === 'luxury-realestate' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="business-outline" size={18} color="#D97706" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Luxury Real Estate & Villa Settings
                </Text>
              </View>
              {renderChipSelector(
                'Architectural Stone & Finish',
                [
                  { id: 'obsidian-gold', label: 'Obsidian & Gold', dot: '#18191C' },
                  { id: 'travertine-brass', label: 'Travertine Brass', dot: '#E4DBC8' },
                  { id: 'monaco-white', label: 'Monaco Platinum', dot: '#FFFFFF' },
                  { id: 'emerald-estate', label: 'Emerald Estate', dot: '#07241A' },
                ],
                config.luxuryRealEstate?.theme || 'obsidian-gold',
                (id) => updateNested('luxuryRealEstate', 'theme', id)
              )}
              {renderField(
                'Property Title / Residence',
                config.luxuryRealEstate?.propertyTitle,
                (v) => updateNested('luxuryRealEstate', 'propertyTitle', v),
                'VILLA SERENA • RESIDENCES'
              )}
              {renderField(
                'Listing Status Pill',
                config.luxuryRealEstate?.badgeTag,
                (v) => updateNested('luxuryRealEstate', 'badgeTag', v),
                'EXCLUSIVE LISTING'
              )}
              {renderField(
                'Location & Area',
                config.luxuryRealEstate?.propertyLocation,
                (v) => updateNested('luxuryRealEstate', 'propertyLocation', v),
                'Palm Jumeirah • Dubai, UAE'
              )}
              {renderField(
                'Price Guide',
                config.luxuryRealEstate?.priceGuide,
                (v) => updateNested('luxuryRealEstate', 'priceGuide', v),
                'From $4,850,000 • 5 Bed Villa'
              )}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Bedrooms',
                    config.luxuryRealEstate?.bedrooms,
                    (v) => updateNested('luxuryRealEstate', 'bedrooms', v),
                    '5 Beds'
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Bathrooms',
                    config.luxuryRealEstate?.bathrooms,
                    (v) => updateNested('luxuryRealEstate', 'bathrooms', v),
                    '6 Baths'
                  )}
                </View>
              </View>
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Area (Sq Ft)',
                    config.luxuryRealEstate?.areaSqFt,
                    (v) => updateNested('luxuryRealEstate', 'areaSqFt', v),
                    '7,850 Sq Ft'
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'View / Lot',
                    config.luxuryRealEstate?.viewType,
                    (v) => updateNested('luxuryRealEstate', 'viewType', v),
                    'Private Beach'
                  )}
                </View>
              </View>
              {renderField(
                'Call to Action Headline',
                config.luxuryRealEstate?.ctaHeadline,
                (v) => updateNested('luxuryRealEstate', 'ctaHeadline', v),
                'SCAN FOR 3D VIRTUAL TOUR'
              )}
              {renderField(
                'Tour & Floorplan Description',
                config.luxuryRealEstate?.ctaSubheadline,
                (v) => updateNested('luxuryRealEstate', 'ctaSubheadline', v),
                'View interactive architectural floorplans & private viewing booking',
                { multiline: true }
              )}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Broker / Agency Name',
                    config.luxuryRealEstate?.agentName,
                    (v) => updateNested('luxuryRealEstate', 'agentName', v),
                    'Marcus Vance | Global Realty'
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Agent Phone',
                    config.luxuryRealEstate?.agentPhone,
                    (v) => updateNested('luxuryRealEstate', 'agentPhone', v),
                    '+971 50 123 4567'
                  )}
                </View>
              </View>
            </View>
          )}

          {/* 8. NEON COCKTAIL */}
          {canvasId === 'neon-cocktail' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="beer-outline" size={18} color="#9333EA" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Neon Lounge & Cocktail Bar
                </Text>
              </View>
              {renderChipSelector(
                'Neon Ambient Lighting Theme',
                [
                  { id: 'neon-amber', label: 'Speakeasy Amber', dot: '#F59E0B' },
                  { id: 'cyber-magenta', label: 'Tokyo Magenta', dot: '#F43F5E' },
                  { id: 'electric-emerald', label: 'Absinthe Green', dot: '#10B981' },
                  { id: 'midnight-violet', label: 'VIP Velvet', dot: '#A855F7' },
                ],
                config.neonCocktail?.theme || 'neon-amber',
                (id) => updateNested('neonCocktail', 'theme', id)
              )}
              {renderField(
                'Bar / Venue Name',
                config.neonCocktail?.venueName,
                (v) => updateNested('neonCocktail', 'venueName', v),
                'THE VELVET ROOM'
              )}
              {renderField(
                'Venue Subtitle / Concept',
                config.neonCocktail?.venueSubtitle,
                (v) => updateNested('neonCocktail', 'venueSubtitle', v),
                'Rooftop Cocktail Lounge & Speakeasy'
              )}
              {renderField(
                'Happy Hour / Promo Note',
                config.neonCocktail?.happyHourText,
                (v) => updateNested('neonCocktail', 'happyHourText', v),
                'HAPPY HOUR • 2-FOR-1 TIL 9 PM'
              )}
              {renderField(
                'Menu Headline',
                config.neonCocktail?.headline,
                (v) => updateNested('neonCocktail', 'headline', v),
                'SCAN FOR DRINKS & TAPAS'
              )}
              {renderField(
                'Ordering Instructions',
                config.neonCocktail?.subheadline,
                (v) => updateNested('neonCocktail', 'subheadline', v),
                'Order craft cocktails & bottle service directly to your table',
                { multiline: true }
              )}
            </View>
          )}

          {/* 9. ACRYLIC STANDEE */}
          {canvasId === 'acrylic-standee' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="star-outline" size={18} color="#D97706" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Acrylic Standee Customization
                </Text>
              </View>
              {renderField(
                'Review Instruction Tagline',
                config.acrylic?.tagline,
                (v) => updateNested('acrylic', 'tagline', v),
                'Scan this QR code to review our stay or service on Google'
              )}
              {renderField(
                'Google Rating Badge Text',
                config.acrylic?.googleRatingText,
                (v) => updateNested('acrylic', 'googleRatingText', v),
                'Google 4.9 ★★★★★'
              )}
              {renderChipSelector(
                'Hardwood Base Finish',
                [
                  { id: 'oak', label: 'Natural Oak', dot: '#A07855' },
                  { id: 'walnut', label: 'Dark Walnut', dot: '#3E2723' },
                  { id: 'birch', label: 'Light Birch', dot: '#D7CCC8' },
                  { id: 'black', label: 'Ebony Black', dot: '#1A1A1A' },
                ],
                config.acrylic?.woodFinish || 'oak',
                (id) => updateNested('acrylic', 'woodFinish', id)
              )}
              {renderChipSelector(
                'Acrylic Plaque Tone',
                [
                  { id: 'clear', label: 'Ultra-Clear', dot: '#FFFFFF' },
                  { id: 'frosted', label: 'Frosted Mist', dot: '#F1F5F9' },
                  { id: 'smoked', label: 'Smoked Charcoal', dot: '#1E293B' },
                ],
                config.acrylic?.acrylicTone || 'clear',
                (id) => updateNested('acrylic', 'acrylicTone', id)
              )}
            </View>
          )}

          {/* 10. PIZZA MELT */}
          {canvasId === 'pizza-melt' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="pizza-outline" size={18} color="#1B4D28" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Pizza Melt Customization
                </Text>
              </View>
              {renderField(
                'Top Header Tagline',
                config.pizzaMelt?.tagline,
                (v) => updateNested('pizzaMelt', 'tagline', v),
                'Scan to browse our artisan menu & order table-side'
              )}
              {renderField(
                'Bottom Call to Action',
                config.pizzaMelt?.headline,
                (v) => updateNested('pizzaMelt', 'headline', v),
                'WOOD-FIRED PIZZERIA'
              )}
            </View>
          )}

          {/* 11. STRAWBERRY ART */}
          {canvasId === 'strawberry-art' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="nutrition-outline" size={18} color="#B72836" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Strawberry AI Art Customization
                </Text>
              </View>
              {renderField(
                'Category Tag',
                config.strawberryArt?.categoryText,
                (v) => updateNested('strawberryArt', 'categoryText', v),
                'GETAIPILOT / AI QR ART'
              )}
              {renderField(
                'Poster Main Headline',
                config.strawberryArt?.headline,
                (v) => updateNested('strawberryArt', 'headline', v),
                'QR Code Design'
              )}
              {renderField(
                'Subheadline',
                config.strawberryArt?.subheadline,
                (v) => updateNested('strawberryArt', 'subheadline', v),
                'Sweet ideas. Fresh design.'
              )}
              {renderField(
                'Scan Pill CTA Text',
                config.strawberryArt?.buttonText,
                (v) => updateNested('strawberryArt', 'buttonText', v),
                'Scan to see more'
              )}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Footer Tagline',
                    config.strawberryArt?.footerText,
                    (v) => updateNested('strawberryArt', 'footerText', v),
                    'Made to catch your eye.'
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Issue / Tag Number',
                    config.strawberryArt?.tagNumber,
                    (v) => updateNested('strawberryArt', 'tagNumber', v),
                    'STRAWBERRY / 07'
                  )}
                </View>
              </View>
            </View>
          )}

          {/* 12. RETRO FLORAL */}
          {canvasId === 'retro-floral' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="flower-outline" size={18} color="#34523C" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Retro Floral Cafe Customization
                </Text>
              </View>
              {renderField(
                'Top Vintage Brand',
                config.retroFloral?.topBrand,
                (v) => updateNested('retroFloral', 'topBrand', v),
                'GETAIPILOT'
              )}
              {renderField(
                'Action Subtitle',
                config.retroFloral?.subheadline,
                (v) => updateNested('retroFloral', 'subheadline', v),
                'TO SEE OUR MENU AND PROMO'
              )}
              {renderField(
                'Shop Label',
                config.retroFloral?.shopName,
                (v) => updateNested('retroFloral', 'shopName', v),
                'our shop'
              )}
              {renderField(
                'Store Address',
                config.retroFloral?.address,
                (v) => updateNested('retroFloral', 'address', v),
                '123 Anywhere St., Any City'
              )}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Phone Number',
                    config.retroFloral?.phone,
                    (v) => updateNested('retroFloral', 'phone', v),
                    '+91 89822 85510',
                    { keyboardType: 'phone-pad' }
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Contact Email',
                    config.retroFloral?.email,
                    (v) => updateNested('retroFloral', 'email', v),
                    'hello@getaipilot.in',
                    { keyboardType: 'email-address', autoCapitalize: 'none' }
                  )}
                </View>
              </View>
            </View>
          )}

          {/* 13. SOCIAL SHOWCASE */}
          {canvasId === 'social-showcase' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="share-social-outline" size={18} color="#1ED760" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  3D Social Showcase Customization
                </Text>
              </View>
              {renderChipSelector(
                'Choose Social Platform',
                [
                  { id: 'spotify', label: 'Spotify', dot: '#1ED760' },
                  { id: 'instagram', label: 'Instagram', dot: '#E1306C' },
                  { id: 'youtube', label: 'YouTube', dot: '#FF0000' },
                  { id: 'tiktok', label: 'TikTok', dot: '#25F4EE' },
                  { id: 'twitter', label: 'X / Twitter', dot: '#18181B' },
                  { id: 'linkedin', label: 'LinkedIn', dot: '#0A66C2' },
                  { id: 'whatsapp', label: 'WhatsApp', dot: '#25D366' },
                ],
                config.socialShowcase?.platform || 'spotify',
                (id) => {
                  updateNested('socialShowcase', 'platform', id);
                  const actions: Record<string, string> = {
                    spotify: 'Scan the QR Code below to find me on Spotify',
                    instagram: 'Scan the QR Code below to follow me on Instagram',
                    youtube: 'Scan the QR Code below to subscribe on YouTube',
                    tiktok: 'Scan the QR Code below to follow me on TikTok',
                    twitter: 'Scan the QR Code below to connect on X',
                    linkedin: 'Scan the QR Code below to view my LinkedIn profile',
                    whatsapp: 'Scan the QR Code below to chat with me on WhatsApp',
                  };
                  if (actions[id]) {
                    updateNested('socialShowcase', 'actionText', actions[id]);
                  }
                }
              )}
              {renderField(
                'Username / Handle',
                config.socialShowcase?.username,
                (v) => updateNested('socialShowcase', 'username', v),
                '@yourusername',
                { autoCapitalize: 'none' }
              )}
              {renderField(
                'Call to Action Subtitle',
                config.socialShowcase?.actionText,
                (v) => updateNested('socialShowcase', 'actionText', v),
                'Scan the QR Code below to find me on Spotify'
              )}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Profile Photo / Creator Avatar
                </Text>
                <View style={styles.logoRow}>
                  <Pressable
                    style={[styles.uploadBtn, { borderColor: colors.border }]}
                    onPress={() =>
                      pickImageAsDataUrl((uri) => updateNested('socialShowcase', 'avatarUrl', uri))
                    }
                  >
                    <Ionicons name="cloud-upload-outline" size={15} color="#0A4737" />
                    <Text style={styles.uploadBtnText}>Upload Avatar</Text>
                  </Pressable>
                  <TextInput
                    style={[inputStyle, { flex: 1, height: 38 }]}
                    value={config.socialShowcase?.avatarUrl || ''}
                    onChangeText={(v) => updateNested('socialShowcase', 'avatarUrl', v)}
                    placeholder="Or paste image URL..."
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          )}

          {/* 14. CLOTHING BRAND / DENIM FASHION */}
          {canvasId === 'clothing-brand' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="shirt-outline" size={18} color="#244A73" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Luxury Apparel & Denim Text
                </Text>
              </View>
              {renderField(
                'Line 1: Top Headline',
                config.clothingBrand?.headline,
                (v) => updateNested('clothingBrand', 'headline', v),
                'download GetAiPilot today'
              )}
              {renderField(
                'Line 2: Middle Offer Line',
                config.clothingBrand?.subheadline,
                (v) => updateNested('clothingBrand', 'subheadline', v),
                'and enjoy exclusive savings'
              )}
              {renderField(
                'Line 3: Bottom Highlight (Bold)',
                config.clothingBrand?.highlightText,
                (v) => updateNested('clothingBrand', 'highlightText', v),
                'on your favourite designer brands'
              )}
              {renderField(
                'Promo Badge / Tag (Optional)',
                config.clothingBrand?.promoBadge,
                (v) => updateNested('clothingBrand', 'promoBadge', v),
                'e.g. EXCLUSIVE IN-STORE SAVINGS'
              )}
            </View>
          )}

          {/* 15. SOCIAL SCENIC FLOATING CARD */}
          {canvasId === 'social-card' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="image-outline" size={18} color="#DB2777" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Social Floating Card
                </Text>
              </View>
              {renderField(
                'Subtitle / Category',
                config.socialCard?.subtitle,
                (v) => updateNested('socialCard', 'subtitle', v),
                'Hospitality & Dining Experience'
              )}
              {renderChipSelector(
                'Scenic Wallpaper Backdrop',
                [
                  { id: 'mountain', label: 'Alpine Mountains', dot: '#475569' },
                  { id: 'cafe', label: 'Artisan Cafe', dot: '#78350F' },
                  { id: 'gradient-purple', label: 'Purple Sunset', dot: '#7C3AED' },
                  { id: 'gradient-emerald', label: 'Emerald Depth', dot: '#0A4737' },
                ],
                config.socialCard?.bgTheme || 'mountain',
                (id) => updateNested('socialCard', 'bgTheme', id)
              )}
            </View>
          )}

          {/* 16. HEXAGON DUAL */}
          {canvasId === 'hexagon-dual' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="wifi-outline" size={18} color="#C29B38" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Hexagonal Sign Customization
                </Text>
              </View>
              {renderChipSelector(
                'Plate Color',
                [
                  { id: 'white', label: 'Pure White', dot: '#FFFFFF' },
                  { id: 'frosted', label: 'Frosted Acrylic', dot: '#E2E8F0' },
                  { id: 'black', label: 'Obsidian Black', dot: '#18181B' },
                ],
                config.hexagon?.plateColor || 'white',
                (id) => updateNested('hexagon', 'plateColor', id)
              )}
              {renderChipSelector(
                'Metal Accent',
                [
                  { id: 'gold', label: 'Gold', dot: '#C29B38' },
                  { id: 'rosegold', label: 'Rose Gold', dot: '#B76E79' },
                  { id: 'silver', label: 'Silver', dot: '#94A3B8' },
                ],
                config.hexagon?.accentMetal || 'gold',
                (id) => updateNested('hexagon', 'accentMetal', id)
              )}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Left Title',
                    config.hexagon?.leftTitle,
                    (v) => updateNested('hexagon', 'leftTitle', v),
                    'Instagram'
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Social Handle',
                    config.hexagon?.leftHandle,
                    (v) => updateNested('hexagon', 'leftHandle', v),
                    '@grand_vista',
                    { autoCapitalize: 'none' }
                  )}
                </View>
              </View>
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Wi-Fi SSID',
                    config.hexagon?.rightSsid,
                    (v) => updateNested('hexagon', 'rightSsid', v),
                    'GrandVista_Guest'
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Wi-Fi Password',
                    config.hexagon?.rightPassword,
                    (v) => updateNested('hexagon', 'rightPassword', v),
                    'welcomevista26',
                    { autoCapitalize: 'none' }
                  )}
                </View>
              </View>
            </View>
          )}

          {/* 17. TENT STAND */}
          {canvasId === 'tent-stand' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="fast-food-outline" size={18} color="#0A4737" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Restaurant Tent Customization
                </Text>
              </View>
              {renderChipSelector(
                'Tent Stand Color',
                [
                  { id: 'cream', label: 'Warm Cream', dot: '#F7EFE9' },
                  { id: 'craft', label: 'Kraft Paper', dot: '#DFD3C3' },
                  { id: 'slate', label: 'Dark Slate', dot: '#1E293B' },
                  { id: 'emerald', label: 'Deep Emerald', dot: '#064E3B' },
                ],
                config.tent?.standColor || 'cream',
                (id) => updateNested('tent', 'standColor', id)
              )}
              {renderField(
                'Top Header Title',
                config.tent?.headline,
                (v) => updateNested('tent', 'headline', v),
                'SCAN QR CODE'
              )}
              {renderField(
                'Action Subtitle',
                config.tent?.subtitle,
                (v) => updateNested('tent', 'subtitle', v),
                'TO VIEW OUR MENU & SPECIALS'
              )}
              {renderField(
                'Table Number Badge',
                config.tent?.tableNumber,
                (v) => updateNested('tent', 'tableNumber', v),
                'TABLE #04'
              )}
              {renderField(
                'Bottom Note',
                config.tent?.note,
                (v) => updateNested('tent', 'note', v),
                'Touchless digital menu • Order directly from your phone'
              )}
            </View>
          )}

          {/* 18. RETAIL PAY */}
          {canvasId === 'retail-pay' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="card-outline" size={18} color="#E11D48" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Retail Pay Poster Customization
                </Text>
              </View>
              {renderChipSelector(
                'Pastel Standee Theme',
                [
                  { id: 'pink', label: 'Blush Rose', dot: '#FB7185' },
                  { id: 'teal', label: 'Fresh Teal', dot: '#14B8A6' },
                  { id: 'amber', label: 'Warm Amber', dot: '#F59E0B' },
                  { id: 'indigo', label: 'Royal Indigo', dot: '#6366F1' },
                ],
                config.retailPay?.theme || 'pink',
                (id) => updateNested('retailPay', 'theme', id)
              )}
              {renderField(
                'Top Ribbon Banner Text',
                config.retailPay?.ribbonText,
                (v) => updateNested('retailPay', 'ribbonText', v),
                'SCAN & PAY'
              )}
              {renderField(
                'Payment Header Title',
                config.retailPay?.title,
                (v) => updateNested('retailPay', 'title', v),
                'QRIS / UPI PAY'
              )}
              {renderField(
                'Subtitle Slogan',
                config.retailPay?.subtitle,
                (v) => updateNested('retailPay', 'subtitle', v),
                'AMAN • CEPAT • TERPERCAYA'
              )}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Security Badge',
                    config.retailPay?.securityBadge,
                    (v) => updateNested('retailPay', 'securityBadge', v),
                    '100% Instant Verified'
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Accepted Methods',
                    config.retailPay?.acceptedMethods,
                    (v) => updateNested('retailPay', 'acceptedMethods', v),
                    'All UPI / Cards'
                  )}
                </View>
              </View>
            </View>
          )}

          {/* 19. DOODLE NATURE */}
          {canvasId === 'doodle-nature' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="sunny-outline" size={18} color="#EF4444" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Doodle Nature Landscape
                </Text>
              </View>
              {renderField(
                'Display Headline',
                config.doodleNature?.headline,
                (v) => updateNested('doodleNature', 'headline', v),
                'DISCOVER NATURE'
              )}
              {renderField(
                'Subheadline / Action',
                config.doodleNature?.subheadline,
                (v) => updateNested('doodleNature', 'subheadline', v),
                'Scan to explore wild paths & stories'
              )}
              {renderField(
                'Bottom Edition Tag',
                config.doodleNature?.bottomTag,
                (v) => updateNested('doodleNature', 'bottomTag', v),
                'ORIGINAL ARTWORK / 01'
              )}
              <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchTitle, { color: colors.foreground }]}>
                    Show Smiling Doodle Sun
                  </Text>
                </View>
                <Switch
                  value={config.doodleNature?.showSun ?? true}
                  onValueChange={(val) => updateNested('doodleNature', 'showSun', val)}
                  trackColor={{ false: colors.border, true: '#0A4737' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}

          {/* 20. FLORAL REVIEW */}
          {canvasId === 'floral-review' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="star-half-outline" size={18} color="#D4AF37" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Luxury Floral Review Plaque
                </Text>
              </View>
              {renderChipSelector(
                'Cardstock Material Tone',
                [
                  { id: 'dove-gray', label: 'Dove Gray', dot: '#D0D5D8' },
                  { id: 'sage-mist', label: 'Sage Mist', dot: '#D5DED6' },
                  { id: 'alabaster', label: 'Alabaster Cream', dot: '#F5F1E8' },
                  { id: 'obsidian', label: 'Obsidian Black', dot: '#181A1C' },
                ],
                config.floralReview?.cardTone || 'dove-gray',
                (id) => updateNested('floralReview', 'cardTone', id)
              )}
              {renderChipSelector(
                'Metallic Foil Finish',
                [
                  { id: 'gold', label: 'Gold Foil', dot: '#D4AF37' },
                  { id: 'rosegold', label: 'Rose Gold', dot: '#C47A7A' },
                  { id: 'silver', label: 'Platinum Silver', dot: '#94A3B8' },
                ],
                config.floralReview?.accentFoil || 'gold',
                (id) => updateNested('floralReview', 'accentFoil', id)
              )}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Main Header',
                    config.floralReview?.headerTitle,
                    (v) => updateNested('floralReview', 'headerTitle', v),
                    'PLEASE'
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Script Subtitle',
                    config.floralReview?.scriptSubtitle,
                    (v) => updateNested('floralReview', 'scriptSubtitle', v),
                    'leave us a review'
                  )}
                </View>
              </View>
              {renderField(
                'Callout Prompt Instruction',
                config.floralReview?.promptText,
                (v) => updateNested('floralReview', 'promptText', v),
                'Please scan the QR code to review us and help spread the word!'
              )}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Signature Author',
                    config.floralReview?.signatureName,
                    (v) => updateNested('floralReview', 'signatureName', v),
                    'GetAiPilot Team'
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Social Handle',
                    config.floralReview?.socialHandle,
                    (v) => updateNested('floralReview', 'socialHandle', v),
                    '@getaipilot',
                    { autoCapitalize: 'none' }
                  )}
                </View>
              </View>
            </View>
          )}

          {/* 21. BLOOMING FLOWER */}
          {canvasId === 'blooming-flower' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="rose-outline" size={18} color="#C22B1E" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  Botanical Bloom Customization
                </Text>
              </View>
              {renderField(
                'Flower Brand Title',
                config.bloomingFlower?.brandName,
                (v) => updateNested('bloomingFlower', 'brandName', v),
                'GetAiPilot'
              )}
              {renderField(
                'Botanical Tagline',
                config.bloomingFlower?.tagline,
                (v) => updateNested('bloomingFlower', 'tagline', v),
                'ORGANIC ESSENCE'
              )}
              <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchTitle, { color: colors.foreground }]}>
                    Display 3D Ladybug Emblem
                  </Text>
                  <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>
                    Shown when custom brand logo is not uploaded.
                  </Text>
                </View>
                <Switch
                  value={config.bloomingFlower?.showLadybug ?? true}
                  onValueChange={(val) => updateNested('bloomingFlower', 'showLadybug', val)}
                  trackColor={{ false: colors.border, true: '#0A4737' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}

          {/* 22. PLUSH CHARACTER */}
          {canvasId === 'plush-character' && (
            <View style={cardBoxStyle}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="happy-outline" size={18} color="#D97706" />
                <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                  3D Plush Fuzzy Character
                </Text>
              </View>
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Top Brand Eyebrow',
                    config.plushCharacter?.brandTag,
                    (v) => updateNested('plushCharacter', 'brandTag', v),
                    'GETAIPILOT'
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField(
                    'Call to Action Note',
                    config.plushCharacter?.ctaText,
                    (v) => updateNested('plushCharacter', 'ctaText', v),
                    'Scan to see more.'
                  )}
                </View>
              </View>
              {renderField(
                'Display Serif Headline',
                config.plushCharacter?.headline,
                (v) => updateNested('plushCharacter', 'headline', v),
                'QR codes. With character.'
              )}
              {renderField(
                'Descriptive Subheadline',
                config.plushCharacter?.subheadline,
                (v) => updateNested('plushCharacter', 'subheadline', v),
                'Turn everyday links into something memorable.',
                { multiline: true }
              )}
              {renderField(
                'Footer Tagline',
                config.plushCharacter?.footerTag,
                (v) => updateNested('plushCharacter', 'footerTag', v),
                'ARTISTIC QR CODES / MADE TO BE SCANNED'
              )}
            </View>
          )}

          {/* QR Code Aesthetics (Color & Center Logo) */}
          <View style={cardBoxStyle}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="color-palette-outline" size={18} color="#0A4737" />
              <Text style={[styles.cardHeaderTitle, { color: colors.foreground }]}>
                QR Code Styling
              </Text>
            </View>

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

            <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
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
          <View style={cardBoxStyle}>
            <Text style={[styles.cardHeaderTitle, { color: colors.foreground, marginBottom: 8 }]}>
              Select What Happens on Scan
            </Text>

            <View style={styles.typeGrid}>
              {[
                { id: 'review', label: 'Review Gate', icon: 'star' },
                { id: 'url', label: 'Website Link', icon: 'link' },
                { id: 'wifi', label: 'Wi-Fi Access', icon: 'wifi' },
                { id: 'vcard', label: 'vCard Profile', icon: 'person' },
                { id: 'email', label: 'Email Mailto', icon: 'mail' },
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

            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                QR Standee Internal Title
              </Text>
              <TextInput
                style={inputStyle}
                value={title}
                onChangeText={onChangeTitle}
                placeholder="e.g. Reception Desk Standee"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

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
                Guests who give 1 to 3 stars submit private feedback directly to your dashboard!
              </Text>
              {renderField('Google Review URL', googleReviewUrl, onChangeGoogleReviewUrl, 'https://g.page/r/...', { autoCapitalize: 'none' })}
              {renderField('Business Name on Review Page', reviewBizName, onChangeReviewBizName, 'e.g. The Grand Vista Hotel')}
              {renderField('Prompt Message', reviewDesc, onChangeReviewDesc, 'Please rate your stay with us today')}
              {renderField('Success Message', reviewSuccessMsg, onChangeReviewSuccessMsg, 'Thank you for your valuable feedback!')}
            </View>
          )}

          {qrType === 'url' && (
            <View style={cardBoxStyle}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Destination Website URL
              </Text>
              <TextInput
                style={inputStyle}
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

          {qrType === 'wifi' && (
            <View style={cardBoxStyle}>
              {renderField('Wi-Fi Network Name (SSID)', wifiSsid, onChangeWifiSsid, 'e.g. Cafe_Guest_Wifi')}
              {renderField('Wi-Fi Password', wifiPassword, onChangeWifiPassword, 'Leave empty if open', { autoCapitalize: 'none' })}
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
                            color: wifiEncryption === enc.id ? '#FFFFFF' : colors.foreground,
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

          {qrType === 'vcard' && (
            <View style={cardBoxStyle}>
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>{renderField('First Name', vcardFirst, onChangeVcardFirst, 'John')}</View>
                <View style={{ flex: 1 }}>{renderField('Last Name', vcardLast, onChangeVcardLast, 'Doe')}</View>
              </View>
              {renderField('Phone Number', vcardPhone, onChangeVcardPhone, '+91 98765 43210', { keyboardType: 'phone-pad' })}
              {renderField('Email Address', vcardEmail, onChangeVcardEmail, 'john@example.com', { keyboardType: 'email-address', autoCapitalize: 'none' })}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>{renderField('Company', vcardOrg, onChangeVcardOrg, 'Acme Corp')}</View>
                <View style={{ flex: 1 }}>{renderField('Job Title', vcardTitle, onChangeVcardTitle, 'CEO')}</View>
              </View>
              {renderField('Website / Portfolio URL', vcardUrl, onChangeVcardUrl, 'https://getaipilot.in', { autoCapitalize: 'none' })}
            </View>
          )}

          {qrType === 'email' && (
            <View style={cardBoxStyle}>
              {renderField('Recipient Email', emailTo, onChangeEmailTo, 'support@company.com', { keyboardType: 'email-address', autoCapitalize: 'none' })}
              {renderField('Subject Line', emailSubject, onChangeEmailSubject, 'Inquiry from QR Standee')}
              {renderField('Email Body Note', emailBody, onChangeEmailBody, 'Hello, I would like to learn more...', { multiline: true })}
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
    height: 70,
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
  logoBox: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  logoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoPreviewCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoPreviewImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoInitials: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  uploadBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
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
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
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
