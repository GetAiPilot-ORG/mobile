import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { CanvasConfig, CanvasTemplateId, QRStyles } from './types';

interface NativeCanvasTemplateProps {
  canvasId: CanvasTemplateId;
  config: CanvasConfig;
  styles: QRStyles;
  qrContent: string;
  scale?: number;
}

export const NativeCanvasTemplate: React.FC<NativeCanvasTemplateProps> = ({
  canvasId,
  config,
  styles: qrStyles,
  qrContent,
  scale = 1,
}) => {
  const fgColor = qrStyles.fgColor || '#000000';
  const qrSize = Math.round(150 * scale);
  const content = qrContent || 'https://getaipilot.in';

  // Render template based on canvasId
  const renderContent = () => {
    switch (canvasId) {
      case 'bold-retail-promo': {
        const c = config.boldRetailPromo || {
          headline: 'SCAN HERE',
          subheadline: 'TO SEE OUR BEST PRODUCTS',
          discountText: 'GET DISCOUNT UP TO 50% OFF!',
          websiteUrl: 'www.getaipilot.in',
          theme: 'forest-gold',
        };
        const themeMap: Record<string, { bg: string; hatch: string; accent: string; qrColor: string }> = {
          'navy-coral': { bg: '#0A192F', hatch: '#FF6B6B', accent: '#FF6B6B', qrColor: '#0A192F' },
          'crimson-amber': { bg: '#380B0B', hatch: '#F59E0B', accent: '#F59E0B', qrColor: '#380B0B' },
          'obsidian-lime': { bg: '#09090B', hatch: '#A3E635', accent: '#A3E635', qrColor: '#09090B' },
          'forest-gold': { bg: '#0E372B', hatch: '#D4C33D', accent: '#D4C33D', qrColor: '#0E372B' },
        };
        const t = themeMap[c.theme] || themeMap['forest-gold'];

        return (
          <View style={[styles.cardBase, { backgroundColor: t.bg, width: 310 * scale }]}>
            <View style={styles.centerAlign}>
              <Text style={[styles.boldHeadline, { fontSize: 22 * scale, color: '#FFFFFF' }]}>
                {c.headline || 'SCAN HERE'}
              </Text>
              <Text style={[styles.boldSubheadline, { fontSize: 10 * scale, color: '#D1FAE5' }]}>
                {c.subheadline || 'TO SEE OUR BEST PRODUCTS'}
              </Text>
            </View>

            <View style={[styles.qrPlateWhite, { marginVertical: 12 * scale, padding: 10 * scale }]}>
              <QRCode value={content} size={qrSize} color={t.qrColor} backgroundColor="#FFFFFF" />
            </View>

            <View style={[styles.promoPill, { paddingVertical: 6 * scale, paddingHorizontal: 12 * scale }]}>
              <Text style={[styles.promoPillText, { fontSize: 11 * scale, color: t.accent }]}>
                {c.discountText || 'GET DISCOUNT UP TO 50% OFF!'}
              </Text>
              <Text style={[styles.promoUrl, { fontSize: 9.5 * scale }]}>
                {c.websiteUrl || 'www.getaipilot.in'}
              </Text>
            </View>
          </View>
        );
      }

      case 'curved-wave-menu': {
        const c = config.curvedWaveMenu || {
          menuTitle: 'E-MENU',
          menuSubtitle: 'For a contactless menu, scan QR code',
          descriptionTitle: 'QR MENU DESCRIPTION',
          descriptionText: 'More comfortable, faster and environmentally friendly.',
          theme: 'teal-ocean',
        };
        const themeMap: Record<string, { canopy: string; qrColor: string }> = {
          'indigo-night': { canopy: '#1E295D', qrColor: '#1E295D' },
          'terracotta-warm': { canopy: '#C25E36', qrColor: '#C25E36' },
          'emerald-deep': { canopy: '#0F6848', qrColor: '#0F6848' },
          'teal-ocean': { canopy: '#148A9D', qrColor: '#148A9D' },
        };
        const t = themeMap[c.theme] || themeMap['teal-ocean'];

        return (
          <View style={[styles.cardBase, { backgroundColor: '#FFFFFF', width: 310 * scale, padding: 0 }]}>
            <View style={[styles.waveCanopy, { backgroundColor: t.canopy, paddingVertical: 20 * scale }]}>
              <Text style={[styles.waveTitle, { fontSize: 26 * scale }]}>
                {c.menuTitle || 'E-MENU'}
              </Text>
              <Text style={[styles.waveSub, { fontSize: 10 * scale }]}>
                {c.menuSubtitle || 'For a contactless menu, scan QR code'}
              </Text>

              <View style={[styles.qrPlateWhite, { marginTop: 12 * scale, padding: 8 * scale }]}>
                <QRCode value={content} size={qrSize - 10} color={t.qrColor} backgroundColor="#FFFFFF" />
              </View>
            </View>

            <View style={[styles.waveBottom, { padding: 14 * scale }]}>
              <Text style={[styles.waveDescTitle, { fontSize: 11 * scale }]}>
                {c.descriptionTitle || 'QR MENU DESCRIPTION'}
              </Text>
              <Text style={[styles.waveDescText, { fontSize: 10 * scale }]}>
                {c.descriptionText || 'More comfortable, faster and eco-friendly.'}
              </Text>
              <Text style={[styles.waveBrand, { fontSize: 9.5 * scale, marginTop: 6 * scale }]}>
                {config.brandName || 'GETAIPILOT'}
              </Text>
            </View>
          </View>
        );
      }

      case 'acrylic-standee': {
        const isDark = config.acrylic.acrylicTone === 'smoked';
        const woodMap: Record<string, string> = {
          walnut: '#3E2723',
          oak: '#A07855',
          birch: '#D7CCC8',
          black: '#1A1A1A',
        };
        const woodColor = woodMap[config.acrylic.woodFinish] || woodMap.oak;

        return (
          <View style={{ alignItems: 'center', width: 310 * scale }}>
            {/* Acrylic Glass Plaque */}
            <View
              style={[
                styles.acrylicPlaque,
                {
                  backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.92)',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                  padding: 16 * scale,
                  width: 290 * scale,
                },
              ]}
            >
              <Text style={[styles.acrylicBrand, { fontSize: 11 * scale, color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                {config.brandName || 'YOUR BUSINESS'}
              </Text>

              <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale }]}>
                <QRCode value={content} size={qrSize} color={fgColor} backgroundColor="#FFFFFF" />
              </View>

              <Text style={[styles.acrylicTagline, { fontSize: 10 * scale, color: isDark ? '#CBD5E1' : '#475569' }]}>
                {config.acrylic.tagline || 'Scan this QR code to review our stay on Google'}
              </Text>

              <View style={[styles.googleReviewRow, { marginTop: 8 * scale }]}>
                <Text style={{ color: '#F59E0B', fontSize: 12 * scale }}>★★★★★</Text>
                <Text style={[styles.googleReviewText, { fontSize: 10 * scale, color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                  {config.acrylic.googleRatingText || 'Google 4.9'}
                </Text>
              </View>
            </View>

            {/* Wooden Base */}
            <View style={[styles.woodBase, { backgroundColor: woodColor, width: 310 * scale, height: 20 * scale }]}>
              <View style={styles.woodGroove} />
            </View>
            <View style={[styles.woodShadow, { width: 280 * scale }]} />
          </View>
        );
      }

      case 'tent-stand': {
        const themeMap: Record<string, { bg: string; text: string; border: string }> = {
          cream: { bg: '#F7EFE9', text: '#3D312A', border: '#E5D7CD' },
          craft: { bg: '#DFD3C3', text: '#3A3845', border: '#C7B198' },
          slate: { bg: '#1E293B', text: '#FFFFFF', border: '#475569' },
          emerald: { bg: '#064E3B', text: '#FFFFFF', border: '#047857' },
        };
        const t = themeMap[config.tent.standColor] || themeMap.cream;

        return (
          <View style={{ alignItems: 'center', width: 290 * scale }}>
            <View style={[styles.tentFace, { backgroundColor: t.bg, borderColor: t.border, padding: 16 * scale, width: 280 * scale }]}>
              <Text style={[styles.tentHeadline, { fontSize: 20 * scale, color: t.text }]}>
                {config.tent.headline || 'SCAN QR CODE'}
              </Text>
              <Text style={[styles.tentSubtitle, { fontSize: 10 * scale, color: t.text, opacity: 0.8 }]}>
                {config.tent.subtitle || 'TO VIEW OUR MENU'}
              </Text>

              <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale }]}>
                <QRCode value={content} size={qrSize} color={fgColor} backgroundColor="#FFFFFF" />
              </View>

              <Text style={[styles.tentTableNumber, { fontSize: 11 * scale, color: t.text }]}>
                {config.tent.tableNumber || 'TABLE #04'}
              </Text>
              <Text style={[styles.tentNote, { fontSize: 9.5 * scale, color: t.text, opacity: 0.7 }]}>
                {config.tent.note || 'Touchless digital menu • Order from phone'}
              </Text>
            </View>

            <View style={[styles.tentBaseFold, { width: 285 * scale, height: 10 * scale }]} />
          </View>
        );
      }

      case 'retail-pay': {
        const themeMap: Record<string, { bg: string; ribbon: string; title: string; border: string }> = {
          pink: { bg: '#FFF0F5', ribbon: '#EC4899', title: '#F43F5E', border: '#F472B6' },
          teal: { bg: '#E6FFFA', ribbon: '#14B8A6', title: '#0F766E', border: '#5EEAD4' },
          amber: { bg: '#FFFBEB', ribbon: '#F59E0B', title: '#92400E', border: '#FCD34D' },
          indigo: { bg: '#EEF2FF', ribbon: '#6366F1', title: '#4338CA', border: '#A5B4FC' },
        };
        const t = themeMap[config.retailPay.theme] || themeMap.pink;

        return (
          <View style={[styles.cardBase, { backgroundColor: t.bg, borderColor: t.border, borderWidth: 3, width: 300 * scale }]}>
            <View style={[styles.retailRibbon, { backgroundColor: t.ribbon, paddingHorizontal: 12 * scale, paddingVertical: 4 * scale }]}>
              <Text style={[styles.retailRibbonText, { fontSize: 10 * scale }]}>
                ✦ {config.retailPay.ribbonText || 'SCAN & PAY'} ✦
              </Text>
            </View>

            <Text style={[styles.retailTitle, { fontSize: 24 * scale, color: t.title }]}>
              {config.retailPay.title || 'QRIS / UPI PAY'}
            </Text>
            <Text style={[styles.retailSub, { fontSize: 9 * scale }]}>
              {config.retailPay.subtitle || 'AMAN • CEPAT • TERPERCAYA'}
            </Text>

            <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale }]}>
              <QRCode value={content} size={qrSize} color={fgColor} backgroundColor="#FFFFFF" />
            </View>

            <Text style={[styles.retailStoreName, { fontSize: 11 * scale }]}>
              {config.brandName || 'GETAIPILOT STORE'}
            </Text>

            <View style={[styles.retailFooterRow, { marginTop: 8 * scale, paddingTop: 6 * scale }]}>
              <Text style={[styles.retailFooterText, { fontSize: 9.5 * scale }]}>
                🛡 {config.retailPay.securityBadge || '100% Instant Verified'}
              </Text>
              <Text style={[styles.retailFooterPill, { fontSize: 8.5 * scale }]}>
                {config.retailPay.acceptedMethods || 'All UPI / Cards'}
              </Text>
            </View>
          </View>
        );
      }

      case 'coffee-roaster': {
        return (
          <View style={[styles.cardBase, { backgroundColor: '#221C17', borderColor: '#8C6B45', borderWidth: 2, width: 300 * scale }]}>
            <Text style={[styles.coffeeBadge, { fontSize: 9 * scale }]}>☕ SPECIALTY COFFEE ROASTERS</Text>
            <Text style={[styles.coffeeTitle, { fontSize: 16 * scale }]}>
              {config.coffeeRoaster?.shopName || config.brandName || 'TIMBER & BEAN'}
            </Text>
            <Text style={[styles.coffeeOrigin, { fontSize: 9.5 * scale }]}>
              {config.coffeeRoaster?.roastOrigin || 'Single Origin Heirloom'}
            </Text>

            <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale, backgroundColor: '#FFFAF2' }]}>
              <QRCode value={content} size={qrSize} color="#221C17" backgroundColor="#FFFAF2" />
            </View>

            <Text style={[styles.coffeeHeadline, { fontSize: 11 * scale }]}>
              {config.coffeeRoaster?.headline || 'SCAN FOR SPECIALTY BREW MENU'}
            </Text>
            <Text style={[styles.coffeeNotes, { fontSize: 9.5 * scale }]}>
              {config.coffeeRoaster?.tastingNotes || 'Jasmine • Blueberry • Honeycomb'}
            </Text>
            <Text style={[styles.coffeeLoyalty, { fontSize: 9.5 * scale, marginTop: 6 * scale }]}>
              {config.coffeeRoaster?.loyaltyOffer || '☕ 10TH CUP FREE'}
            </Text>
          </View>
        );
      }

      case 'cyber-hologram': {
        return (
          <View style={[styles.cardBase, { backgroundColor: '#090D16', borderColor: '#059669', borderWidth: 1, width: 300 * scale }]}>
            <View style={styles.cyberTopRow}>
              <Text style={[styles.cyberProject, { fontSize: 9 * scale }]}>
                {config.cyberHologram?.projectName || 'QUANTUM OS'}
              </Text>
              <Text style={[styles.cyberLive, { fontSize: 9 * scale }]}>● LIVE</Text>
            </View>

            <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale, backgroundColor: '#030712', borderColor: '#059669', borderWidth: 1 }]}>
              <QRCode value={content} size={qrSize} color="#34D399" backgroundColor="#030712" />
            </View>

            <Text style={[styles.cyberHeadline, { fontSize: 11 * scale }]}>
              {config.cyberHologram?.headline || 'SCAN FOR AR INTERFACE'}
            </Text>
            <Text style={[styles.cyberCoord, { fontSize: 8.5 * scale }]}>
              {config.cyberHologram?.hudCoordinate || 'SYS.GRID // 47.6062° N'}
            </Text>
          </View>
        );
      }

      case 'luxury-realestate': {
        return (
          <View style={[styles.cardBase, { backgroundColor: '#0D0F12', borderColor: '#B45309', borderWidth: 1, width: 300 * scale }]}>
            <Text style={[styles.luxuryBadge, { fontSize: 8.5 * scale }]}>EXCLUSIVE LISTING</Text>
            <Text style={[styles.luxuryTitle, { fontSize: 16 * scale }]}>
              {config.luxuryRealEstate?.propertyTitle || 'VILLA SERENA'}
            </Text>
            <Text style={[styles.luxuryLocation, { fontSize: 9.5 * scale }]}>
              {config.luxuryRealEstate?.propertyLocation || 'Palm Jumeirah'}
            </Text>
            <Text style={[styles.luxuryPrice, { fontSize: 10.5 * scale }]}>
              {config.luxuryRealEstate?.priceGuide || 'From $4,850,000'}
            </Text>

            <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale }]}>
              <QRCode value={content} size={qrSize} color="#0D0F12" backgroundColor="#FFFFFF" />
            </View>

            <Text style={[styles.luxuryHeadline, { fontSize: 10.5 * scale }]}>
              {config.luxuryRealEstate?.ctaHeadline || 'SCAN FOR 3D VIRTUAL TOUR'}
            </Text>
            <Text style={[styles.luxuryAgent, { fontSize: 9 * scale }]}>
              {config.luxuryRealEstate?.agentName || 'Global Realty'}
            </Text>
          </View>
        );
      }

      case 'classic':
      default: {
        return (
          <View style={[styles.cardBase, { backgroundColor: '#FFFFFF', width: 280 * scale }]}>
            {config.brandName ? (
              <Text style={[styles.classicBrand, { fontSize: 13 * scale }]}>
                {config.brandName}
              </Text>
            ) : null}
            <View style={[styles.qrPlateWhite, { marginVertical: 8 * scale, padding: 8 * scale }]}>
              <QRCode value={content} size={qrSize} color={fgColor} backgroundColor="#FFFFFF" />
            </View>
            <Text style={[styles.classicScanText, { fontSize: 10 * scale }]}>
              Scan with smartphone camera
            </Text>
          </View>
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBase: {
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  centerAlign: {
    alignItems: 'center',
  },
  qrPlateWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boldHeadline: {
    fontWeight: '900',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  boldSubheadline: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  promoPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  promoPillText: {
    fontWeight: '900',
  },
  promoUrl: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  waveCanopy: {
    width: '100%',
    alignItems: 'center',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  waveTitle: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  waveSub: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  waveBottom: {
    alignItems: 'center',
  },
  waveDescTitle: {
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
  },
  waveDescText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  waveBrand: {
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  acrylicPlaque: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  acrylicBrand: {
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  acrylicTagline: {
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
  },
  googleReviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 6,
    width: '100%',
    justifyContent: 'center',
  },
  googleReviewText: {
    fontWeight: '700',
  },
  woodBase: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  woodGroove: {
    width: '85%',
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 1,
  },
  woodShadow: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 2,
    marginTop: 1,
  },
  tentFace: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
  },
  tentHeadline: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tentSubtitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tentTableNumber: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tentNote: {
    textAlign: 'center',
    marginTop: 1,
  },
  tentBaseFold: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  retailRibbon: {
    borderRadius: 20,
    marginBottom: 6,
  },
  retailRibbonText: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  retailTitle: {
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  retailSub: {
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  retailStoreName: {
    fontWeight: '900',
    color: '#1E293B',
    textTransform: 'uppercase',
  },
  retailFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  retailFooterText: {
    fontWeight: '700',
    color: '#10B981',
  },
  retailFooterPill: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    color: '#475569',
    fontWeight: '600',
  },
  coffeeBadge: {
    color: '#D9A86C',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  coffeeTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginTop: 2,
  },
  coffeeOrigin: {
    color: '#E0CFBE',
    fontStyle: 'italic',
  },
  coffeeHeadline: {
    color: '#FFFFFF',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  coffeeNotes: {
    color: '#D9A86C',
    marginTop: 2,
  },
  coffeeLoyalty: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  cyberTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5,150,105,0.3)',
    paddingBottom: 4,
  },
  cyberProject: {
    color: '#34D399',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cyberLive: {
    color: '#34D399',
    fontWeight: '800',
  },
  cyberHeadline: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cyberCoord: {
    color: '#6EE7B7',
    marginTop: 2,
  },
  luxuryBadge: {
    color: '#F59E0B',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  luxuryTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginTop: 2,
  },
  luxuryLocation: {
    color: '#94A3B8',
  },
  luxuryPrice: {
    color: '#F59E0B',
    fontWeight: '800',
    marginTop: 2,
  },
  luxuryHeadline: {
    color: '#FDE68A',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  luxuryAgent: {
    color: '#94A3B8',
    marginTop: 2,
  },
  classicBrand: {
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  classicScanText: {
    color: '#64748B',
    marginTop: 2,
  },
});
