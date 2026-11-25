import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { CanvasConfig, CanvasTemplateId, QRStyles } from './types';
import { TEMPLATE_COMPONENT_ASSETS } from './templateAssets';

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
      /* ══════════════════════════════════════════════════════════════════════════
         1. BOLD RETAIL PRODUCT PROMO
         ══════════════════════════════════════════════════════════════════════════ */
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

      /* ══════════════════════════════════════════════════════════════════════════
         2. CURVED WAVE DIGITAL E-MENU
         ══════════════════════════════════════════════════════════════════════════ */
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

            <View style={[styles.waveBottomBox, { padding: 14 * scale }]}>
              <Text style={[styles.waveDescTitle, { fontSize: 10.5 * scale, color: t.canopy }]}>
                {c.descriptionTitle || 'QR MENU DESCRIPTION'}
              </Text>
              <Text style={[styles.waveDescText, { fontSize: 9.5 * scale }]}>
                {c.descriptionText || 'More comfortable, faster and environmentally friendly.'}
              </Text>
            </View>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         3. CLEAR ACRYLIC REVIEW STANDEE
         ══════════════════════════════════════════════════════════════════════════ */
      case 'acrylic-standee': {
        const isSmoked = config.acrylic.acrylicTone === 'smoked';
        const isFrosted = config.acrylic.acrylicTone === 'frosted';
        const cardBg = isSmoked ? '#1E293B' : isFrosted ? '#F8FAFC' : '#FFFFFF';
        const textColor = isSmoked ? '#FFFFFF' : '#0F172A';

        const woodColors: Record<string, string> = {
          walnut: '#3E2723',
          oak: '#A07855',
          birch: '#D7CCC8',
          black: '#1A1A1A',
        };
        const woodColor = woodColors[config.acrylic.woodFinish] || woodColors.oak;

        return (
          <View style={[styles.acrylicWrapper, { width: 310 * scale }]}>
            <View
              style={[
                styles.acrylicPlaque,
                {
                  backgroundColor: cardBg,
                  borderColor: isSmoked ? '#334155' : '#E2E8F0',
                  padding: 16 * scale,
                },
              ]}
            >
              <View style={[styles.logoPill, { width: 36 * scale, height: 36 * scale }]}>
                <Ionicons name="business-outline" size={18 * scale} color="#0A4737" />
              </View>
              <Text style={[styles.acrylicBrand, { fontSize: 13 * scale, color: textColor }]}>
                {config.brandName || 'YOUR BUSINESS'}
              </Text>

              <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale }]}>
                <QRCode value={content} size={qrSize} color={fgColor} backgroundColor="#FFFFFF" />
              </View>

              <Text style={[styles.acrylicTagline, { fontSize: 10 * scale, color: isSmoked ? '#CBD5E1' : '#64748B' }]}>
                {config.acrylic.tagline || 'Scan this QR code to review our service on Google'}
              </Text>

              <View style={[styles.googleBadge, { marginTop: 8 * scale }]}>
                <Ionicons name="star" size={14 * scale} color="#F59E0B" />
                <Text style={[styles.googleRating, { fontSize: 10.5 * scale, color: textColor }]}>
                  {config.acrylic.googleRatingText || 'Google 4.9 ★★★★★'}
                </Text>
              </View>
            </View>

            {/* Wooden Base */}
            <View style={[styles.woodBase, { backgroundColor: woodColor, height: 18 * scale, width: 320 * scale }]}>
              <View style={[styles.woodSlot, { height: 3 * scale, width: 280 * scale }]} />
            </View>
            <View style={[styles.tableShadow, { height: 6 * scale, width: 290 * scale }]} />
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         4. TABLETOP FOLDED TENT STAND
         ══════════════════════════════════════════════════════════════════════════ */
      case 'tent-stand': {
        const themeMap: Record<string, { bg: string; text: string; sub: string }> = {
          cream: { bg: '#F7EFE9', text: '#3D312A', sub: '#7B695E' },
          craft: { bg: '#DFD3C3', text: '#3A3845', sub: '#595567' },
          slate: { bg: '#1E293B', text: '#FFFFFF', sub: '#94A3B8' },
          emerald: { bg: '#064E3B', text: '#FFFFFF', sub: '#A7F3D0' },
        };
        const t = themeMap[config.tent.standColor] || themeMap.cream;

        return (
          <View style={[styles.tentWrapper, { width: 290 * scale }]}>
            <View style={[styles.tentFace, { backgroundColor: t.bg, padding: 18 * scale }]}>
              <Text style={[styles.tentHeadline, { fontSize: 20 * scale, color: t.text }]}>
                {config.tent.headline || 'SCAN'}
              </Text>
              <Text style={[styles.tentSubtitle, { fontSize: 10.5 * scale, color: t.sub }]}>
                {config.tent.subtitle || 'QR CODE TO VIEW MENU'}
              </Text>
              <View style={[styles.tentDivider, { width: 36 * scale, height: 3 * scale }]} />

              <View style={[styles.qrPlateWhite, { marginVertical: 12 * scale, padding: 8 * scale }]}>
                <QRCode value={content} size={qrSize} color={fgColor} backgroundColor="#FFFFFF" />
              </View>

              <Text style={[styles.tentTable, { fontSize: 11 * scale, color: t.text }]}>
                {config.tent.tableNumber || 'TABLE #05'}
              </Text>
              <Text style={[styles.tentNote, { fontSize: 9.5 * scale, color: t.sub }]}>
                {config.tent.note || 'Touchless digital menu • Order from phone'}
              </Text>
            </View>
            <View style={[styles.tentFoldBase, { height: 10 * scale, width: 296 * scale }]} />
            <View style={[styles.tableShadow, { height: 6 * scale, width: 270 * scale }]} />
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         5. RETAIL SCAN & PAY STAND (QRIS / UPI)
         ══════════════════════════════════════════════════════════════════════════ */
      case 'retail-pay': {
        const themeMap: Record<string, { bg: string; ribbon: string; title: string; border: string }> = {
          pink: { bg: '#FFF0F5', ribbon: '#F43F5E', title: '#E11D48', border: '#FBCFE8' },
          teal: { bg: '#E6FFFA', ribbon: '#0D9488', title: '#0F766E', border: '#99F6E4' },
          amber: { bg: '#FFFBEB', ribbon: '#D97706', title: '#B45309', border: '#FDE68A' },
          indigo: { bg: '#EEF2FF', ribbon: '#4F46E5', title: '#4338CA', border: '#C7D2FE' },
        };
        const t = themeMap[config.retailPay.theme] || themeMap.pink;

        return (
          <View style={[styles.cardBase, { backgroundColor: t.bg, borderColor: t.border, borderWidth: 3, width: 300 * scale }]}>
            <View style={[styles.ribbonPill, { backgroundColor: t.ribbon, paddingHorizontal: 12 * scale, paddingVertical: 4 * scale }]}>
              <Text style={[styles.ribbonText, { fontSize: 9.5 * scale }]}>
                ✦ {config.retailPay.ribbonText || 'SCAN & PAY'} ✦
              </Text>
            </View>

            <Text style={[styles.payTitle, { fontSize: 24 * scale, color: t.title }]}>
              {config.retailPay.title || 'QRIS / UPI'}
            </Text>
            <Text style={[styles.paySubtitle, { fontSize: 9 * scale }]}>
              {config.retailPay.subtitle || 'SAFE • INSTANT • VERIFIED'}
            </Text>

            <View style={[styles.retailQrFrame, { marginVertical: 10 * scale, padding: 12 * scale }]}>
              <QRCode value={content} size={qrSize} color={fgColor} backgroundColor="#FFFFFF" />
            </View>

            <Text style={[styles.merchantName, { fontSize: 11 * scale }]}>
              {config.brandName || 'BELLA SWEET CAFE'}
            </Text>

            <View style={[styles.retailFooter, { marginTop: 8 * scale }]}>
              <View style={styles.flexRowCenter}>
                <Ionicons name="shield-checkmark" size={13 * scale} color="#059669" />
                <Text style={[styles.verifiedText, { fontSize: 9 * scale }]}>
                  {config.retailPay.securityBadge || '100% Verified'}
                </Text>
              </View>
              <Text style={[styles.methodsText, { fontSize: 8.5 * scale }]}>
                {config.retailPay.acceptedMethods || 'All UPI / Cards'}
              </Text>
            </View>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         6. ARTISAN SPECIALTY COFFEE ROASTERS
         ══════════════════════════════════════════════════════════════════════════ */
      case 'coffee-roaster': {
        const c = config.coffeeRoaster || {
          shopName: 'NORDIC ROAST CO.',
          roastOrigin: 'ETHIOPIA YIRGACHEFFE',
          headline: 'SCAN FOR BREW PROFILE & NOTES',
          tastingNotes: 'Jasmine • Bergamot • Wild Peach',
          loyaltyOffer: 'BUY 5 CUPS, GET 1 FREE',
          coffeeBeansBadge: 'SINGLE ORIGIN // GRADE 1',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#FDFBF7', borderColor: '#E7E0D3', borderWidth: 2, width: 310 * scale }]}>
            <View style={styles.centerAlign}>
              <View style={[styles.coffeeIconCircle, { width: 34 * scale, height: 34 * scale }]}>
                <Ionicons name="cafe" size={18 * scale} color="#78350F" />
              </View>
              <Text style={[styles.coffeeShop, { fontSize: 14 * scale }]}>
                {c.shopName || 'NORDIC ROAST CO.'}
              </Text>
              <Text style={[styles.coffeeOrigin, { fontSize: 9.5 * scale }]}>
                {c.roastOrigin || 'ETHIOPIA YIRGACHEFFE'}
              </Text>
            </View>

            <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale, borderColor: '#D7CCC8', borderWidth: 1 }]}>
              <QRCode value={content} size={qrSize} color="#451A03" backgroundColor="#FFFFFF" />
            </View>

            <Text style={[styles.coffeeNotes, { fontSize: 10 * scale }]}>
              {c.tastingNotes || 'Jasmine • Bergamot • Wild Peach'}
            </Text>

            <View style={[styles.loyaltyBox, { marginTop: 8 * scale, paddingVertical: 4 * scale, paddingHorizontal: 10 * scale }]}>
              <Text style={[styles.loyaltyText, { fontSize: 9 * scale }]}>
                ★ {c.loyaltyOffer || 'BUY 5 CUPS, GET 1 FREE'} ★
              </Text>
            </View>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         7. PRISMATIC CYBER HOLOGRAM & AR
         ══════════════════════════════════════════════════════════════════════════ */
      case 'cyber-hologram': {
        const c = config.cyberHologram || {
          projectName: 'NEO-NEXUS AR',
          systemTag: 'PROTOCOL // V.4.9',
          headline: 'SCAN FOR IMMERSIVE AR EXPERIENCE',
          hudCoordinate: 'NODE: 37.7749° N, 122.4194° W',
          actionBadge: 'INITIALIZE AR PROTOCOL',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#090D16', borderColor: '#00F0FF', borderWidth: 1.5, width: 310 * scale }]}>
            <View style={[styles.cyberBadge, { paddingHorizontal: 8 * scale, paddingVertical: 3 * scale }]}>
              <Text style={[styles.cyberBadgeText, { fontSize: 8.5 * scale }]}>
                {c.systemTag || 'PROTOCOL // V.4.9'}
              </Text>
            </View>

            <Text style={[styles.cyberProject, { fontSize: 16 * scale }]}>
              {c.projectName || 'NEO-NEXUS AR'}
            </Text>

            <View style={[styles.cyberQrBox, { marginVertical: 10 * scale, padding: 10 * scale }]}>
              <QRCode value={content} size={qrSize} color="#00F0FF" backgroundColor="#090D16" />
            </View>

            <Text style={[styles.cyberCta, { fontSize: 10 * scale }]}>
              {c.actionBadge || 'INITIALIZE AR PROTOCOL'}
            </Text>
            <Text style={[styles.cyberCoord, { fontSize: 8 * scale }]}>
              {c.hudCoordinate || 'NODE: 37.7749° N, 122.4194° W'}
            </Text>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         8. LUXURY REAL ESTATE MARBLE PLAQUE
         ══════════════════════════════════════════════════════════════════════════ */
      case 'luxury-realestate': {
        const c = config.luxuryRealEstate || {
          propertyTitle: 'VILLA PALAZZO',
          propertyLocation: 'BEVERLY HILLS PRIVATE ESTATE',
          ctaHeadline: 'SCAN FOR 3D VIRTUAL TOUR & BROCHURE',
          agentName: 'Marcus Vance // Global Realty',
          bedrooms: '6 BEDS',
          bathrooms: '8 BATHS',
          areaSqFt: '9,450 SQ FT',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#131217', borderColor: '#D4AF37', borderWidth: 1.5, width: 310 * scale }]}>
            <Text style={[styles.luxuryTitle, { fontSize: 15 * scale }]}>
              {c.propertyTitle || 'VILLA PALAZZO'}
            </Text>
            <Text style={[styles.luxurySub, { fontSize: 8.5 * scale }]}>
              {c.propertyLocation || 'BEVERLY HILLS PRIVATE ESTATE'}
            </Text>

            <View style={[styles.luxurySpecsRow, { marginVertical: 8 * scale }]}>
              <Text style={[styles.specText, { fontSize: 9 * scale }]}>{c.bedrooms || '6 BEDS'}</Text>
              <Text style={styles.specDot}>•</Text>
              <Text style={[styles.specText, { fontSize: 9 * scale }]}>{c.bathrooms || '8 BATHS'}</Text>
              <Text style={styles.specDot}>•</Text>
              <Text style={[styles.specText, { fontSize: 9 * scale }]}>{c.areaSqFt || '9,450 SQ FT'}</Text>
            </View>

            <View style={[styles.luxuryQrBox, { marginVertical: 6 * scale, padding: 8 * scale }]}>
              <QRCode value={content} size={qrSize} color="#D4AF37" backgroundColor="#1A1820" />
            </View>

            <Text style={[styles.luxuryHeadline, { fontSize: 10.5 * scale }]}>
              {c.ctaHeadline || 'SCAN FOR 3D VIRTUAL TOUR'}
            </Text>
            <Text style={[styles.luxuryAgent, { fontSize: 9 * scale }]}>
              {c.agentName || 'Global Realty'}
            </Text>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         9. VINTAGE BOTANICAL APOTHECARY & SPA
         ══════════════════════════════════════════════════════════════════════════ */
      case 'botanical-apothecary': {
        const c = config.botanicalApothecary || {
          brandName: 'ST. CLAIR BOTANICALS',
          apothecarySubtitle: 'Organic Herbal Apothecary & Spa',
          headline: 'SCAN FOR ELIXIR & SPA RITUAL MENU',
          batchNumber: 'BATCH NO. 84 • EST. 1928',
          waxSealText: '100% BOTANICAL',
          theme: 'emerald-sage',
        };
        const themeMap: Record<string, { bg: string; border: string; accent: string; qrColor: string }> = {
          'vintage-amber': { bg: '#2E1908', border: '#B48246', accent: '#F3CAA1', qrColor: '#221104' },
          'rose-quartz': { bg: '#2E1420', border: '#D48B9F', accent: '#FED7E2', qrColor: '#290918' },
          'midnight-apothecary': { bg: '#151C19', border: '#C5A059', accent: '#F5ECD5', qrColor: '#0F1612' },
          'emerald-sage': { bg: '#182E22', border: '#C9A767', accent: '#FAE5BE', qrColor: '#0B2014' },
        };
        const t = themeMap[c.theme] || themeMap['emerald-sage'];

        return (
          <View style={[styles.cardBase, { backgroundColor: t.bg, borderColor: t.border, borderWidth: 2, width: 310 * scale, borderRadius: 28 }]}>
            <View style={styles.centerAlign}>
              <View style={[styles.waxSealCircle, { width: 32 * scale, height: 32 * scale, borderColor: t.border }]}>
                <Ionicons name="leaf" size={16 * scale} color={t.accent} />
              </View>
              <Text style={[styles.apothecaryBrand, { fontSize: 13 * scale, color: t.accent }]}>
                {c.brandName || 'ST. CLAIR BOTANICALS'}
              </Text>
              <Text style={[styles.apothecarySub, { fontSize: 9 * scale, color: '#C2D7CB' }]}>
                {c.apothecarySubtitle || 'Organic Herbal Apothecary & Spa'}
              </Text>
            </View>

            <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale, borderColor: t.border, borderWidth: 1 }]}>
              <QRCode value={content} size={qrSize} color={t.qrColor} backgroundColor="#FBF9F4" />
            </View>

            <Text style={[styles.apothecaryHeadline, { fontSize: 10 * scale, color: t.accent }]}>
              {c.headline || 'SCAN FOR SPA MENU'}
            </Text>
            <Text style={[styles.apothecaryBatch, { fontSize: 8.5 * scale, color: '#8DAA99' }]}>
              {c.batchNumber || 'BATCH NO. 84 • EST. 1928'}
            </Text>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         10. FINE DINING LEATHER SOMMELIER
         ══════════════════════════════════════════════════════════════════════════ */
      case 'leather-sommelier': {
        const c = config.leatherSommelier || {
          restaurantName: 'LE CELLIER VINTAGE',
          sommelierTitle: 'GRAND CRU WINE & TASTING ROOM',
          headline: 'SCAN FOR SOMMELIER RESERVE WINE LIST',
          vintageRating: '96 PTS // CELLAR SELECTION',
          tableNumber: 'TABLE 14 • SOMMELIER SERVICE',
          theme: 'saddle-cognac',
        };
        const themeMap: Record<string, { bg: string; border: string; gold: string; qrColor: string }> = {
          'midnight-noir': { bg: '#18181B', border: '#D4AF37', gold: '#FAE6A3', qrColor: '#121214' },
          'bordeaux-burgundy': { bg: '#330F19', border: '#E0A96D', gold: '#F7D8B5', qrColor: '#2B040E' },
          'forest-hunter': { bg: '#102418', border: '#C9A767', gold: '#F5E2B8', qrColor: '#05160D' },
          'saddle-cognac': { bg: '#3A1D0D', border: '#C29B38', gold: '#FAE6A3', qrColor: '#240E04' },
        };
        const t = themeMap[c.theme] || themeMap['saddle-cognac'];

        return (
          <View style={[styles.cardBase, { backgroundColor: t.bg, borderColor: t.border, borderWidth: 2, width: 310 * scale }]}>
            <View style={styles.centerAlign}>
              <Ionicons name="wine" size={20 * scale} color={t.gold} />
              <Text style={[styles.sommelierName, { fontSize: 13.5 * scale, color: '#FFFFFF' }]}>
                {c.restaurantName || 'LE CELLIER VINTAGE'}
              </Text>
              <Text style={[styles.sommelierTitle, { fontSize: 8.5 * scale, color: t.gold }]}>
                {c.sommelierTitle || 'GRAND CRU WINE & TASTING ROOM'}
              </Text>
            </View>

            <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale, borderColor: t.border, borderWidth: 1 }]}>
              <QRCode value={content} size={qrSize} color={t.qrColor} backgroundColor="#FFFBF7" />
            </View>

            <View style={[styles.ratingPill, { paddingHorizontal: 10 * scale, paddingVertical: 3 * scale, borderColor: t.border }]}>
              <Text style={[styles.ratingPillText, { fontSize: 9 * scale, color: t.gold }]}>
                {c.vintageRating || '96 PTS // CELLAR SELECTION'}
              </Text>
            </View>
            <Text style={[styles.sommelierTable, { fontSize: 8.5 * scale, color: '#D4C4B5', marginTop: 5 * scale }]}>
              {c.tableNumber || 'TABLE 14 • SOMMELIER SERVICE'}
            </Text>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         11. NEON COCKTAIL BAR & VIP LOUNGE
         ══════════════════════════════════════════════════════════════════════════ */
      case 'neon-cocktail': {
        const c = config.neonCocktail || {
          venueName: 'THE VELVET ROOM',
          venueSubtitle: 'Rooftop Cocktail Lounge',
          tableOrSection: 'VIP BOOTH #07',
          headline: 'SCAN FOR DRINKS & TAPAS',
          happyHourText: 'HAPPY HOUR • 2-FOR-1 TIL 9 PM',
          theme: 'neon-amber',
        };
        const themeMap: Record<string, { bg: string; tube: string; neon: string; qrColor: string }> = {
          'cyber-magenta': { bg: '#20051D', tube: '#F43F5E', neon: '#FB7185', qrColor: '#200216' },
          'electric-emerald': { bg: '#031E15', tube: '#10B981', neon: '#34D399', qrColor: '#022115' },
          'midnight-violet': { bg: '#180A2E', tube: '#A855F7', neon: '#C084FC', qrColor: '#130324' },
          'neon-amber': { bg: '#221303', tube: '#F59E0B', neon: '#FBBF24', qrColor: '#1A0B02' },
        };
        const t = themeMap[c.theme] || themeMap['neon-amber'];

        return (
          <View style={[styles.cardBase, { backgroundColor: t.bg, borderColor: t.tube, borderWidth: 2.5, width: 310 * scale, borderRadius: 36 }]}>
            <View style={styles.centerAlign}>
              <Text style={[styles.neonVenue, { fontSize: 16 * scale, color: t.neon }]}>
                {c.venueName || 'THE VELVET ROOM'}
              </Text>
              <Text style={[styles.neonSub, { fontSize: 9 * scale, color: '#FDE68A' }]}>
                {c.tableOrSection || 'VIP BOOTH #07'}
              </Text>
            </View>

            <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale, borderColor: t.tube, borderWidth: 1 }]}>
              <QRCode value={content} size={qrSize} color={t.qrColor} backgroundColor="#FFFBEB" />
            </View>

            <Text style={[styles.neonHeadline, { fontSize: 10.5 * scale, color: '#FFFFFF' }]}>
              {c.headline || 'SCAN FOR DRINKS & TAPAS'}
            </Text>
            <View style={[styles.happyHourBox, { backgroundColor: t.tube, paddingHorizontal: 10 * scale, paddingVertical: 4 * scale, marginTop: 6 * scale }]}>
              <Text style={[styles.happyHourText, { fontSize: 8.5 * scale }]}>
                ⚡ {c.happyHourText || 'HAPPY HOUR • 2-FOR-1 TIL 9 PM'} ⚡
              </Text>
            </View>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         12. SCENIC SOCIAL FLOATING CARD
         ══════════════════════════════════════════════════════════════════════════ */
      case 'social-card': {
        const c = config.socialCard || {
          subtitle: 'Hospitality & Dining Experience',
          bgTheme: 'mountain',
        };
        const bgPhoto = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';

        return (
          <View style={[styles.cardBase, { width: 310 * scale, padding: 0, overflow: 'hidden', position: 'relative' }]}>
            <Image
              source={{ uri: bgPhoto }}
              style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
              resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 22 }]} />

            <View style={{ padding: 14 * scale, width: '100%', alignItems: 'center' }}>
              <View style={[styles.socialFrostedInner, { padding: 12 * scale, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', width: '92%', alignItems: 'center' }]}>
                <View style={[styles.avatarCircle, { width: 38 * scale, height: 38 * scale, backgroundColor: '#0A4737', borderRadius: 19 * scale, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={[styles.avatarText, { fontSize: 12 * scale, color: '#FFFFFF', fontWeight: 'bold' }]}>
                    {config.brandName ? config.brandName.slice(0, 2).toUpperCase() : 'GP'}
                  </Text>
                </View>

                <Text style={[styles.socialBrand, { fontSize: 13 * scale, fontWeight: '800', color: '#0F172A', marginTop: 4 * scale }]}>
                  {config.brandName || 'GetAiPilot'}
                </Text>
                <Text style={[styles.socialSubtitle, { fontSize: 8.5 * scale, color: '#64748B', marginTop: 1 }]}>
                  {c.subtitle || 'Hospitality & Dining Experience'}
                </Text>

                <View style={[styles.qrPlateWhite, { marginVertical: 6 * scale, padding: 6 * scale, borderRadius: 12 * scale }]}>
                  <QRCode value={content} size={qrSize - 25} color="#000000" backgroundColor="#FFFFFF" />
                </View>

                <View style={[styles.socialFollowBtn, { paddingVertical: 4 * scale, width: '85%', backgroundColor: '#0A4737', borderRadius: 10 * scale, alignItems: 'center', marginTop: 2 * scale }]}>
                  <Text style={[styles.socialFollowText, { fontSize: 9 * scale, color: '#FFFFFF', fontWeight: 'bold' }]}>Follow Our Story</Text>
                </View>
              </View>
            </View>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         13. HEXAGONAL DUAL COUNTER SIGN (INSTAGRAM + WI-FI)
         ══════════════════════════════════════════════════════════════════════════ */
      case 'hexagon-dual': {
        const c = config.hexagon || {
          leftTitle: 'Instagram',
          leftHandle: '@grand_vista',
          rightTitle: 'Wi-Fi Access',
          rightSsid: 'GrandVista_Guest',
          rightPassword: 'welcomevista26',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#FFFFFF', borderColor: '#C29B38', borderWidth: 2, width: 310 * scale, borderRadius: 24 }]}>
            <Text style={[styles.hexTopBrand, { fontSize: 11 * scale }]}>
              {config.brandName || 'THE BEAUTY LAB'}
            </Text>

            <View style={[styles.hexDualRow, { marginVertical: 10 * scale }]}>
              {/* Instagram Left */}
              <View style={styles.hexCol}>
                <Ionicons name="logo-instagram" size={24 * scale} color="#E1306C" />
                <Text style={[styles.hexColTitle, { fontSize: 11 * scale }]}>{c.leftTitle || 'Instagram'}</Text>
                <Text style={[styles.hexColSub, { fontSize: 9 * scale }]}>{c.leftHandle || '@the_label'}</Text>
              </View>

              <View style={styles.hexDivider} />

              {/* Wi-Fi Right */}
              <View style={styles.hexCol}>
                <Ionicons name="wifi" size={24 * scale} color="#0284C7" />
                <Text style={[styles.hexColTitle, { fontSize: 11 * scale }]}>{c.rightTitle || 'Wi-Fi'}</Text>
                <Text style={[styles.hexColSub, { fontSize: 8.5 * scale }]}>SSID: {c.rightSsid || 'Guest_Wifi'}</Text>
                <Text style={[styles.hexColSub, { fontSize: 8.5 * scale }]}>Pass: {c.rightPassword || '12345678'}</Text>
              </View>
            </View>

            <View style={[styles.qrPlateWhite, { padding: 6 * scale, borderColor: '#E2E8F0', borderWidth: 1 }]}>
              <QRCode value={content} size={qrSize - 35} color="#000000" backgroundColor="#FFFFFF" />
            </View>
            <Text style={[styles.hexScanText, { fontSize: 8.5 * scale, marginTop: 4 * scale }]}>
              SCAN TO CONNECT
            </Text>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         14. ARTISAN PIZZA MELT POSTER
         ══════════════════════════════════════════════════════════════════════════ */
      case 'pizza-melt': {
        const c = config.pizzaMelt || {
          headline: 'WOOD-FIRED PIZZERIA',
          tagline: 'Scan to browse our artisan menu & order table-side',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#1B4D28', borderColor: '#2E7D32', borderWidth: 2, width: 310 * scale }]}>
            <Text style={[styles.pizzaTagline, { fontSize: 9.5 * scale }]}>
              {c.tagline || 'Scan to browse our artisan menu'}
            </Text>
            <Text style={[styles.pizzaBrand, { fontSize: 14 * scale }]}>
              {config.brandName || 'PIZZERIA BELLA'}
            </Text>

            {/* Top Wood-Fired Pizza Arc */}
            <Image
              source={TEMPLATE_COMPONENT_ASSETS.pizzaTop}
              style={{ width: 180 * scale, height: 42 * scale, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: 4 * scale }}
              resizeMode="cover"
            />

            <View style={[styles.qrPlateWhite, { padding: 6 * scale, backgroundColor: '#FFFEF2', borderRadius: 0 }]}>
              <QRCode value={content} size={qrSize - 20} color="#1B4D28" backgroundColor="#FFFEF2" />
            </View>

            {/* Bottom Wood-Fired Pizza Arc */}
            <Image
              source={TEMPLATE_COMPONENT_ASSETS.pizzaBottom}
              style={{ width: 180 * scale, height: 42 * scale, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginBottom: 4 * scale }}
              resizeMode="cover"
            />

            <Text style={[styles.pizzaHeadline, { fontSize: 12 * scale }]}>
              {c.headline || 'WOOD-FIRED PIZZERIA'}
            </Text>
            <Text style={[styles.pizzaContactless, { fontSize: 8.5 * scale }]}>
              Contactless Tabletop Ordering
            </Text>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         15. SWEET STRAWBERRY QR ART
         ══════════════════════════════════════════════════════════════════════════ */
      case 'strawberry-art': {
        const c = config.strawberryArt || {
          categoryText: 'GETAIPILOT / AI QR ART',
          headline: 'Fresh Berry Design',
          subheadline: 'Sweet ideas. Fresh creative design.',
          buttonText: 'Scan to see more',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#F8F9FB', borderColor: '#FBCFE8', borderWidth: 1.5, width: 310 * scale, alignItems: 'flex-start' }]}>
            <Text style={[styles.strawCategory, { fontSize: 9 * scale }]}>
              {c.categoryText || 'GETAIPILOT / AI QR ART'}
            </Text>
            <Text style={[styles.strawHeadline, { fontSize: 18 * scale }]}>
              {c.headline || 'Fresh Berry Design'}
            </Text>
            <Text style={[styles.strawSub, { fontSize: 10 * scale }]}>
              {c.subheadline || 'Sweet ideas. Fresh creative design.'}
            </Text>

            <View style={[styles.centerAlign, { width: '100%', marginVertical: 8 * scale }]}>
              <View style={[styles.qrPlateWhite, { padding: 8 * scale, borderColor: '#F472B6', borderWidth: 1 }]}>
                <QRCode value={content} size={qrSize} color="#B72836" backgroundColor="#FFFFFF" />
              </View>
            </View>

            <View style={[styles.strawBtn, { paddingHorizontal: 12 * scale, paddingVertical: 5 * scale }]}>
              <Ionicons name="nutrition" size={13 * scale} color="#B72836" />
              <Text style={[styles.strawBtnText, { fontSize: 10 * scale }]}>
                {c.buttonText || 'Scan to see more'}
              </Text>
            </View>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         16. RETRO DAISY FLORAL CAFE POSTER
         ══════════════════════════════════════════════════════════════════════════ */
      case 'retro-floral': {
        const c = config.retroFloral || {
          topBrand: 'GETAIPILOT',
          subheadline: 'TO SEE OUR MENU AND PROMO',
          shopName: 'our retro cafe',
          address: '123 Anywhere St., Any City',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#FFFDEE', borderColor: '#EAE3D2', borderWidth: 2, width: 310 * scale }]}>
            <Text style={[styles.retroTopBrand, { fontSize: 9.5 * scale }]}>
              ✿ {c.topBrand || 'GETAIPILOT CAFE'} ✿
            </Text>
            <Text style={[styles.retroScanHere, { fontSize: 24 * scale }]}>
              scan here
            </Text>

            <View style={[styles.qrPlateWhite, { marginVertical: 8 * scale, padding: 8 * scale, borderColor: '#2E261F', borderWidth: 2, borderRadius: 14 }]}>
              <QRCode value={content} size={qrSize} color="#2E261F" backgroundColor="#FFFFFF" />
            </View>

            <Text style={[styles.retroSub, { fontSize: 10 * scale }]}>
              {c.subheadline || 'TO SEE OUR MENU AND PROMO'}
            </Text>
            <View style={[styles.retroShopBox, { marginTop: 6 * scale, width: '100%', paddingTop: 6 * scale }]}>
              <Text style={[styles.retroShopTitle, { fontSize: 12 * scale }]}>{c.shopName || 'our shop'}</Text>
              <Text style={[styles.retroShopDetail, { fontSize: 9 * scale }]}>{c.address || '123 Anywhere St.'}</Text>
            </View>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         17. 3D FLOATING TOKEN SOCIAL SHOWCASE
         ══════════════════════════════════════════════════════════════════════════ */
      case 'social-showcase': {
        const c = config.socialShowcase || {
          platform: 'spotify',
          username: 'getaipilot',
          actionText: 'Scan the QR Code to listen',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        };
        const platformTheme: Record<string, { bg: string; token: string; icon: any }> = {
          spotify: { bg: '#16a34a', token: '#22c55e', icon: 'musical-notes' },
          instagram: { bg: '#8134AF', token: '#E1306C', icon: 'logo-instagram' },
          youtube: { bg: '#990A0A', token: '#FF0000', icon: 'logo-youtube' },
          tiktok: { bg: '#181822', token: '#25F4EE', icon: 'musical-notes' },
        };
        const p = platformTheme[c.platform] || platformTheme.spotify;
        const avatarUrl = c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

        return (
          <View style={[styles.cardBase, { backgroundColor: p.bg, width: 310 * scale, padding: 14 * scale, position: 'relative', overflow: 'hidden' }]}>
            {/* 3D Floating Tokens in background */}
            <View style={{ position: 'absolute', top: 12 * scale, left: -10 * scale, width: 34 * scale, height: 34 * scale, borderRadius: 17 * scale, backgroundColor: p.token, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
              <Ionicons name={p.icon} size={18 * scale} color="#FFFFFF" />
            </View>
            <View style={{ position: 'absolute', top: 28 * scale, right: -12 * scale, width: 38 * scale, height: 38 * scale, borderRadius: 19 * scale, backgroundColor: p.token, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
              <Ionicons name={p.icon} size={20 * scale} color="#FFFFFF" />
            </View>
            <View style={{ position: 'absolute', bottom: 16 * scale, left: -8 * scale, width: 36 * scale, height: 36 * scale, borderRadius: 18 * scale, backgroundColor: p.token, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
              <Ionicons name={p.icon} size={18 * scale} color="#FFFFFF" />
            </View>
            <View style={{ position: 'absolute', bottom: 22 * scale, right: -10 * scale, width: 34 * scale, height: 34 * scale, borderRadius: 17 * scale, backgroundColor: p.token, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
              <Ionicons name={p.icon} size={18 * scale} color="#FFFFFF" />
            </View>

            {/* White Neumorphic Card with Overlapping Avatar */}
            <View style={[styles.socialShowcaseInner, { padding: 12 * scale, borderRadius: 22 * scale, marginTop: 14 * scale, backgroundColor: '#FFFFFF', width: '100%', alignItems: 'center' }]}>
              {/* Overlapping Avatar */}
              <View style={{ marginTop: -26 * scale, marginBottom: 4 * scale, position: 'relative' }}>
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 44 * scale, height: 44 * scale, borderRadius: 22 * scale, borderWidth: 3 * scale, borderColor: '#FFFFFF' }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', bottom: -2 * scale, right: -2 * scale, width: 16 * scale, height: 16 * scale, borderRadius: 8 * scale, backgroundColor: p.token, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 * scale, borderColor: '#FFFFFF' }}>
                  <Ionicons name={p.icon} size={9 * scale} color="#FFFFFF" />
                </View>
              </View>

              <Text style={[styles.showcaseHandle, { fontSize: 13 * scale, fontWeight: '900', color: '#0F172A' }]}>
                @{c.username?.replace(/^@/, '') || 'getaipilot'}
              </Text>
              <Text style={[styles.showcaseAction, { fontSize: 8.5 * scale, color: '#64748B', textAlign: 'center', marginTop: 2 * scale }]}>
                {c.actionText || 'Scan QR Code to visit'}
              </Text>

              <View style={[styles.qrPlateWhite, { marginVertical: 6 * scale, padding: 6 * scale, borderRadius: 12 * scale }]}>
                <QRCode value={content} size={qrSize - 20} color="#000000" backgroundColor="#FFFFFF" />
              </View>
            </View>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         18. DENIM & LUXURY APPAREL CLOTHING BRAND
         ══════════════════════════════════════════════════════════════════════════ */
      case 'clothing-brand': {
        const c = config.clothingBrand || {
          brandHeader: 'GetAiPilot Denim',
          headline: 'download GetAiPilot today',
          subheadline: 'and enjoy exclusive savings',
          promoBadge: 'NEW COLLECTION',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#F4F8F7', borderColor: '#CBD5E1', borderWidth: 2, width: 310 * scale }]}>
            <View style={{ width: '100%', alignItems: 'flex-end', marginBottom: 4 * scale }}>
              <Text style={[styles.denimHeadline, { fontSize: 11 * scale }]}>{c.headline}</Text>
              <Text style={[styles.denimSub, { fontSize: 10 * scale }]}>{c.subheadline}</Text>
              <View style={[styles.denimBadge, { backgroundColor: '#000000', paddingHorizontal: 6 * scale, paddingVertical: 2 * scale, marginTop: 3 * scale }]}>
                <Text style={{ color: '#FFFFFF', fontSize: 7.5 * scale, fontWeight: '800' }}>{c.promoBadge || 'NEW'}</Text>
              </View>
            </View>

            <Image
              source={TEMPLATE_COMPONENT_ASSETS.denimCollar}
              style={{ width: 220 * scale, height: 48 * scale }}
              resizeMode="contain"
            />

            <View style={[styles.qrPlateWhite, { marginVertical: 2 * scale, padding: 6 * scale, backgroundColor: '#FFFFFF' }]}>
              <QRCode value={content} size={qrSize - 10} color="#244A73" backgroundColor="#FFFFFF" />
            </View>

            <Image
              source={TEMPLATE_COMPONENT_ASSETS.denimHem}
              style={{ width: 220 * scale, height: 36 * scale }}
              resizeMode="contain"
            />
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         19. DOODLE NATURE LINE-ART LANDSCAPE
         ══════════════════════════════════════════════════════════════════════════ */
      case 'doodle-nature': {
        const c = config.doodleNature || {
          headline: 'DISCOVER NATURE',
          subheadline: 'Scan to explore wild paths',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#FDFDFA', borderColor: '#E6E2D8', borderWidth: 2, width: 310 * scale }]}>
            <View style={styles.flexRowBetween}>
              <Ionicons name="sunny" size={24 * scale} color="#EF4444" />
              <View style={styles.centerAlign}>
                <Text style={[styles.doodleTitle, { fontSize: 12 * scale }]}>{c.headline || 'DISCOVER NATURE'}</Text>
                <Text style={[styles.doodleSub, { fontSize: 8.5 * scale }]}>{c.subheadline || 'Scan to explore wild paths'}</Text>
              </View>
              <Ionicons name="sparkles" size={18 * scale} color="#10B981" />
            </View>

            <View style={[styles.qrPlateWhite, { marginVertical: 10 * scale, padding: 8 * scale, borderColor: '#1E293B', borderWidth: 2 }]}>
              <QRCode value={content} size={qrSize} color="#1E293B" backgroundColor="#FFFFFF" />
            </View>

            <View style={[styles.doodleBaseline, { width: '100%', borderTopColor: '#1E293B', borderTopWidth: 1.5, paddingTop: 4 * scale }]}>
              <Text style={{ fontSize: 9 * scale, color: '#64748B', fontWeight: 'bold' }}>
                🌵 🏔️ 🦆 ORIGINAL ARTWORK 🦆 🏔️ 🌵
              </Text>
            </View>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         20. LUXURY FLORAL REVIEW CARD
         ══════════════════════════════════════════════════════════════════════════ */
      case 'floral-review': {
        const c = config.floralReview || {
          headerTitle: 'PLEASE',
          scriptSubtitle: 'leave us a review',
          promptText: 'Scan QR code to review us!',
          ratingStars: 5,
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#D0D5D8', width: 310 * scale, borderRadius: 28 }]}>
            <Text style={[styles.floralReviewHead, { fontSize: 18 * scale }]}>{c.headerTitle || 'PLEASE'}</Text>
            <Text style={[styles.floralReviewScript, { fontSize: 13 * scale }]}>{c.scriptSubtitle || 'leave us a review'}</Text>

            <View style={{ width: 170 * scale, height: 170 * scale, marginVertical: 6 * scale, alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={TEMPLATE_COMPONENT_ASSETS.floralBouquet}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                resizeMode="cover"
              />
              <View style={[styles.qrPlateWhite, { padding: 6 * scale, backgroundColor: '#FFFFFFFA' }]}>
                <QRCode value={content} size={qrSize - 35} color="#1A1A1A" backgroundColor="#FFFFFF" />
              </View>
            </View>

            <View style={[styles.flexRowCenter, { gap: 4 * scale, marginVertical: 4 * scale }]}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons key={i} name="star" size={14 * scale} color="#D4AF37" />
              ))}
            </View>
            <Text style={[styles.floralReviewPrompt, { fontSize: 9.5 * scale }]}>
              {c.promptText || 'Scan QR code to review us!'}
            </Text>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         21. BOTANICAL BLOOM ON STEM
         ══════════════════════════════════════════════════════════════════════════ */
      case 'blooming-flower': {
        const c = config.bloomingFlower || {
          brandName: 'GetAiPilot',
          tagline: 'ORGANIC ESSENCE',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#FFFFFF', borderColor: '#FBCFE8', borderWidth: 1.5, width: 310 * scale }]}>
            <View style={[styles.flowerCore, { padding: 8 * scale, borderColor: '#F472B6', borderWidth: 1.5, borderRadius: 24 }]}>
              <QRCode value={content} size={qrSize} color="#C22B1E" backgroundColor="#FFFFFF" />
            </View>

            {/* Botanical Stem */}
            <View style={[styles.stemBar, { height: 26 * scale, width: 4 * scale, backgroundColor: '#4A7C59', marginVertical: 4 * scale }]} />

            <View style={[styles.flexRowBetween, { width: '100%', borderTopColor: '#F1F5F9', borderTopWidth: 1, paddingTop: 6 * scale }]}>
              <View style={styles.flexRowCenter}>
                <Ionicons name="leaf" size={16 * scale} color="#4A7C59" />
                <Text style={[styles.flowerBrand, { fontSize: 12 * scale, marginLeft: 4 * scale }]}>
                  {c.brandName || 'GetAiPilot'}
                </Text>
              </View>
              <Text style={{ fontSize: 8 * scale, color: '#4A7C59', fontWeight: 'bold' }}>
                {c.tagline || 'ORGANIC ESSENCE'}
              </Text>
            </View>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         22. 3D PLUSH FUZZY CHARACTER CREATURE
         ══════════════════════════════════════════════════════════════════════════ */
      case 'plush-character': {
        const c = config.plushCharacter || {
          brandTag: 'GETAIPILOT',
          headline: 'QR codes. With character.',
        };

        return (
          <View style={[styles.cardBase, { backgroundColor: '#FBF6EE', borderColor: '#EDE3D4', borderWidth: 1.5, width: 310 * scale }]}>
            <Text style={[styles.plushTag, { fontSize: 9 * scale }]}>{c.brandTag || 'GETAIPILOT'}</Text>
            <Text style={[styles.plushHeadline, { fontSize: 16 * scale }]}>{c.headline || 'QR codes. With character.'}</Text>

            <View style={[styles.plushCube, { backgroundColor: '#FDE68A', padding: 8 * scale, borderRadius: 22, marginVertical: 8 * scale }]}>
              <QRCode value={content} size={qrSize} color="#3B2210" backgroundColor="#FEF9C3" />
            </View>

            <Text style={[styles.plushScanText, { fontSize: 9 * scale }]}>
              Scan to see more character designs
            </Text>
          </View>
        );
      }

      /* ══════════════════════════════════════════════════════════════════════════
         23. CLASSIC / MINIMAL FALLBACK
         ══════════════════════════════════════════════════════════════════════════ */
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
    justifyContent: 'center',
  },
  flexRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  qrPlateWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  // 1. Bold Retail
  boldHeadline: {
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  boldSubheadline: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  promoPill: {
    backgroundColor: '#041812',
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  promoPillText: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  promoUrl: {
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },

  // 2. Wave Menu
  waveCanopy: {
    width: '100%',
    alignItems: 'center',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  waveTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 2,
  },
  waveSub: {
    color: '#E0F2FE',
    fontWeight: '600',
    marginTop: 2,
  },
  waveBottomBox: {
    width: '100%',
    alignItems: 'center',
  },
  waveDescTitle: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  waveDescText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },

  // 3. Acrylic Standee
  acrylicWrapper: {
    alignItems: 'center',
  },
  acrylicPlaque: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
  },
  logoPill: {
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  acrylicBrand: {
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  acrylicTagline: {
    textAlign: 'center',
    marginTop: 4,
  },
  googleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  googleRating: {
    fontWeight: '700',
  },
  woodBase: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  woodSlot: {
    backgroundColor: '#00000040',
    borderRadius: 3,
  },
  tableShadow: {
    backgroundColor: '#00000020',
    borderRadius: 10,
    marginTop: 2,
  },

  // 4. Tent Stand
  tentWrapper: {
    alignItems: 'center',
  },
  tentFace: {
    width: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    alignItems: 'center',
  },
  tentHeadline: {
    fontWeight: '900',
    letterSpacing: 2,
  },
  tentSubtitle: {
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  tentDivider: {
    backgroundColor: '#D97706',
    borderRadius: 2,
    marginTop: 4,
  },
  tentTable: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  tentNote: {
    marginTop: 2,
  },
  tentFoldBase: {
    backgroundColor: '#00000030',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },

  // 5. Retail Pay
  ribbonPill: {
    borderRadius: 12,
    marginBottom: 4,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  payTitle: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  paySubtitle: {
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  retailQrFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  merchantName: {
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 0.8,
  },
  retailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 6,
    borderTopColor: '#00000010',
    borderTopWidth: 1,
  },
  verifiedText: {
    color: '#059669',
    fontWeight: '700',
    marginLeft: 3,
  },
  methodsText: {
    color: '#64748B',
    fontWeight: '600',
  },

  // 6. Coffee Roaster
  coffeeIconCircle: {
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  coffeeShop: {
    fontWeight: '900',
    color: '#451A03',
    letterSpacing: 1,
  },
  coffeeOrigin: {
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  coffeeNotes: {
    fontWeight: '600',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  loyaltyBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  loyaltyText: {
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },

  // 7. Cyber Hologram
  cyberBadge: {
    borderWidth: 1,
    borderColor: '#00F0FF',
    borderRadius: 6,
    marginBottom: 4,
  },
  cyberBadgeText: {
    color: '#00F0FF',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cyberProject: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  cyberQrBox: {
    backgroundColor: '#090D16',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
  },
  cyberCta: {
    color: '#00F0FF',
    fontWeight: '800',
    letterSpacing: 1,
  },
  cyberCoord: {
    color: '#64748B',
    fontFamily: 'monospace',
    marginTop: 4,
  },

  // 8. Luxury Real Estate
  luxuryTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  luxurySub: {
    color: '#D4AF37',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
  luxurySpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  specDot: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  luxuryQrBox: {
    backgroundColor: '#1A1820',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  luxuryHeadline: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  luxuryAgent: {
    color: '#94A3B8',
    marginTop: 2,
  },

  // 9. Botanical Apothecary
  waxSealCircle: {
    borderRadius: 16,
    backgroundColor: '#0B3820',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  apothecaryBrand: {
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  apothecarySub: {
    fontWeight: '600',
    marginTop: 1,
  },
  apothecaryHeadline: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  apothecaryBatch: {
    marginTop: 2,
    fontWeight: '500',
  },

  // 10. Leather Sommelier
  sommelierName: {
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  sommelierTitle: {
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
  ratingPill: {
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#261105',
  },
  ratingPillText: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sommelierTable: {
    fontWeight: '600',
  },

  // 11. Neon Cocktail
  neonVenue: {
    fontWeight: '900',
    letterSpacing: 2,
  },
  neonSub: {
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
  neonHeadline: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  happyHourBox: {
    borderRadius: 8,
  },
  happyHourText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // 12. Social Card
  socialFrostedInner: {
    backgroundColor: '#FFFFFFEE',
    alignItems: 'center',
    width: '100%',
  },
  avatarCircle: {
    borderRadius: 22,
    backgroundColor: '#829079',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  socialBrand: {
    color: '#0F172A',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  socialSubtitle: {
    color: '#64748B',
    marginTop: 1,
  },
  socialFollowBtn: {
    backgroundColor: '#829079',
    borderRadius: 12,
    alignItems: 'center',
  },
  socialFollowText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // 13. Hexagon Dual
  hexTopBrand: {
    fontWeight: '800',
    color: '#EC4899',
    letterSpacing: 1.5,
  },
  hexDualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  hexCol: {
    alignItems: 'center',
    flex: 1,
  },
  hexColTitle: {
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 3,
  },
  hexColSub: {
    color: '#64748B',
    fontWeight: '600',
  },
  hexDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#CBD5E1',
  },
  hexScanText: {
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },

  // 14. Pizza Melt
  pizzaTagline: {
    color: '#FAEED0',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  pizzaBrand: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  pizzaCrustBar: {
    backgroundColor: '#F5EBC6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pizzaHeadline: {
    color: '#FAEED0',
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },
  pizzaContactless: {
    color: '#A2C4AC',
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // 15. Strawberry Art
  strawCategory: {
    color: '#BF3844',
    fontWeight: '900',
    letterSpacing: 1,
  },
  strawHeadline: {
    color: '#B72836',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  strawSub: {
    color: '#64748B',
    fontWeight: '600',
  },
  strawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE9EB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F8C5CB',
    gap: 4,
  },
  strawBtnText: {
    color: '#B72836',
    fontWeight: '800',
  },

  // 16. Retro Floral
  retroTopBrand: {
    color: '#4A3E35',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  retroScanHere: {
    fontWeight: '900',
    color: '#2E261F',
    letterSpacing: 0.5,
  },
  retroSub: {
    color: '#2E261F',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  retroShopBox: {
    alignItems: 'center',
    borderTopColor: '#E2D7C5',
    borderTopWidth: 1,
  },
  retroShopTitle: {
    fontWeight: '900',
    color: '#34523C',
  },
  retroShopDetail: {
    color: '#5E544A',
  },

  // 17. Social Showcase
  socialShowcaseInner: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    width: '100%',
  },
  showcaseToken: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  showcaseHandle: {
    fontWeight: '900',
    color: '#0F172A',
  },
  showcaseAction: {
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // 18. Denim Clothing
  denimHeadline: {
    color: '#1E293B',
    fontWeight: '500',
  },
  denimSub: {
    color: '#0F172A',
    fontWeight: '700',
  },
  denimBadge: {
    borderRadius: 6,
  },
  denimCollarMock: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 19. Doodle Nature
  doodleTitle: {
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1,
  },
  doodleSub: {
    color: '#64748B',
  },
  doodleBaseline: {
    alignItems: 'center',
  },

  // 20. Floral Review
  floralReviewHead: {
    fontWeight: '900',
    color: '#1A1B1D',
    letterSpacing: 2,
  },
  floralReviewScript: {
    fontStyle: 'italic',
    color: '#34383D',
  },
  floralReviewPrompt: {
    color: '#34383D',
    fontWeight: '600',
    textAlign: 'center',
  },

  // 21. Blooming Flower
  flowerCore: {
    backgroundColor: '#FFFFFF',
  },
  stemBar: {
    borderRadius: 2,
  },
  flowerBrand: {
    fontWeight: '900',
    color: '#1C1917',
  },

  // 22. Plush Character
  plushTag: {
    fontWeight: '700',
    color: '#93785D',
    letterSpacing: 1.5,
  },
  plushHeadline: {
    fontWeight: '800',
    color: '#2C241E',
    marginTop: 2,
  },
  plushCube: {
    borderWidth: 2,
    borderColor: '#FEF08A',
  },
  plushScanText: {
    color: '#6F5E51',
    fontWeight: '600',
  },

  // 23. Classic
  classicBrand: {
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  classicScanText: {
    color: '#64748B',
    fontWeight: '500',
  },
});
