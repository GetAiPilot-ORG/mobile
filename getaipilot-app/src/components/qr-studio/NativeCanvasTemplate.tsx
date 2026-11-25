import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Rect,
  Polygon,
  Line,
  Ellipse,
  Defs,
  Pattern,
  G,
  Stop,
  LinearGradient as SvgGradient,
  Text as SvgText,
} from 'react-native-svg';
import { CanvasConfig, CanvasTemplateId, QRStyles } from './types';
import { TEMPLATE_COMPONENT_ASSETS } from './templateAssets';

interface NativeCanvasTemplateProps {
  canvasId: CanvasTemplateId;
  config: CanvasConfig;
  styles: QRStyles;
  qrContent: string;
  scale?: number;
}

const GETAIPILOT_DOT_PATH =
  'M286 13 L299 13 L305 15 L312 19 L318 25 L323 34 L325 41 L324 54 L320 63 L311 72 L298 77 L286 77 L279 75 L271 70 L267 66 L262 58 L260 51 L261 35 L265 27 L274 18 L280 15 L285 14 Z';
const GETAIPILOT_BODY_PATH =
  'M140 54 L159 54 L160 55 L175 56 L188 59 L199 63 L223 77 L232 84 L247 99 L257 114 L264 128 L269 144 L270 155 L271 156 L271 173 L270 174 L270 181 L269 182 L268 190 L264 198 L259 203 L253 206 L244 207 L237 205 L230 200 L225 191 L223 159 L219 147 L210 132 L197 119 L180 109 L164 104 L159 104 L158 103 L136 103 L135 104 L130 104 L116 108 L106 113 L90 125 L78 139 L68 158 L64 174 L64 184 L63 185 L64 200 L69 220 L77 236 L83 244 L94 255 L104 262 L122 270 L130 272 L136 272 L137 273 L153 272 L160 269 L168 261 L171 254 L171 245 L169 239 L166 235 L156 228 L152 227 L138 228 L130 226 L124 223 L112 211 L108 203 L106 195 L106 179 L107 178 L107 174 L114 160 L122 152 L130 147 L141 144 L150 144 L158 146 L164 149 L176 161 L181 172 L182 192 L183 193 L183 199 L186 211 L191 222 L198 232 L204 238 L212 244 L220 248 L235 252 L250 252 L251 251 L256 251 L264 249 L275 244 L284 238 L297 225 L306 212 L313 197 L318 181 L320 165 L321 164 L321 143 L322 143 L324 157 L325 158 L325 165 L326 166 L326 199 L325 200 L325 207 L324 208 L323 218 L319 230 L319 233 L317 236 L314 246 L304 265 L291 283 L274 300 L265 307 L251 316 L235 324 L222 329 L202 334 L186 335 L185 336 L163 336 L162 335 L152 335 L151 334 L135 332 L113 325 L96 317 L77 305 L66 296 L52 282 L43 271 L28 246 L21 227 L17 211 L17 205 L16 204 L16 193 L15 192 L16 171 L17 170 L17 164 L18 163 L19 155 L25 137 L34 119 L44 104 L61 86 L70 79 L86 69 L102 62 L124 56 L139 55 Z';

export const GetAiPilotVectorLogo: React.FC<{ size: number; color?: string }> = ({
  size,
  color = '#000000',
}) => (
  <Svg width={size} height={size} viewBox="0 0 348 353">
    <Path d={GETAIPILOT_DOT_PATH} fill={color} />
    <Path d={GETAIPILOT_BODY_PATH} fill={color} />
  </Svg>
);

const StyledQR: React.FC<{
  value: string;
  size: number;
  fgColor: string;
  bgColor?: string;
  showCenterLogo?: boolean;
  logoScale?: number;
}> = ({
  value,
  size,
  fgColor,
  bgColor = '#FFFFFF',
  showCenterLogo = true,
  logoScale = 0.19,
}) => {
  const logoSize = Math.max(14, Math.round(size * logoScale));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <QRCode
        value={value || 'https://getaipilot.in'}
        size={size}
        color={fgColor}
        backgroundColor={bgColor}
        ecl="H"
      />
      {showCenterLogo && (
        <View
          style={{
            position: 'absolute',
            width: logoSize + 6,
            height: logoSize + 6,
            borderRadius: 5,
            backgroundColor: bgColor === 'transparent' ? '#FFFFFF' : bgColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GetAiPilotVectorLogo size={logoSize} color={fgColor} />
        </View>
      )}
    </View>
  );
};

export const NativeCanvasTemplate: React.FC<NativeCanvasTemplateProps> = ({
  canvasId,
  config,
  styles: qrStyles,
  qrContent,
  scale = 1,
}) => {
  const fgColor = qrStyles.fgColor || '#000000';
  const showLogo = config.showCenterLogo !== false;
  const content = qrContent || 'https://getaipilot.in';

  const renderInner = () => {
    switch (canvasId) {
      /* 1. BOLD RETAIL PRODUCT PROMO */
      case 'bold-retail-promo': {
        const c = config.boldRetailPromo || ({} as any);
        const themeMap: Record<string, { bg: string; hatch: string; qrBg: string; sub: string; qrColor: string }> = {
          'navy-coral': { bg: '#0A192F', hatch: '#FF6B6B', qrBg: '#061121', sub: '#DBEAFE', qrColor: '#0A192F' },
          'crimson-amber': { bg: '#380B0B', hatch: '#F59E0B', qrBg: '#240505', sub: '#FEF3C7', qrColor: '#380B0B' },
          'obsidian-lime': { bg: '#09090B', hatch: '#A3E635', qrBg: '#18181B', sub: '#E4E4E7', qrColor: '#09090B' },
          'forest-gold': { bg: '#0E372B', hatch: '#D4C33D', qrBg: '#09271E', sub: '#D1FAE5', qrColor: '#0E372B' },
        };
        const t = themeMap[c.theme || 'forest-gold'] || themeMap['forest-gold'];

        return (
          <View style={[s.cardBase, { backgroundColor: t.bg, width: 324, padding: 24, overflow: 'hidden' }]}>
            <View style={{ alignItems: 'center', marginBottom: 14, zIndex: 10 }}>
              <Text style={{ fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 }}>
                {c.headline || 'SCAN HERE'}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '800', color: t.sub, letterSpacing: 1.5, marginTop: 2 }}>
                {c.subheadline || 'TO SEE OUR BEST PRODUCTS'}
              </Text>
            </View>

            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', my: 10 } as any}>
              {/* Top-Right Hatch Circle */}
              <View style={{ position: 'absolute', top: -18, right: -4, zIndex: 0 }}>
                <Svg width="104" height="104" viewBox="0 0 100 100">
                  <Defs>
                    <Pattern id="hatchTR" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <Line x1="0" y1="0" x2="0" y2="10" stroke={t.hatch} strokeWidth="3.8" />
                    </Pattern>
                  </Defs>
                  <Circle cx="50" cy="50" r="48" fill="url(#hatchTR)" />
                </Svg>
              </View>
              {/* Bottom-Left Hatch Circle */}
              <View style={{ position: 'absolute', bottom: -18, left: -4, zIndex: 0 }}>
                <Svg width="104" height="104" viewBox="0 0 100 100">
                  <Defs>
                    <Pattern id="hatchBL" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <Line x1="0" y1="0" x2="0" y2="10" stroke={t.hatch} strokeWidth="3.8" />
                    </Pattern>
                  </Defs>
                  <Circle cx="50" cy="50" r="48" fill="url(#hatchBL)" />
                </Svg>
              </View>

              <View style={{ backgroundColor: t.qrBg, borderColor: '#FFFFFF', borderWidth: 2.5, borderRadius: 22, padding: 14, zIndex: 10 }}>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 10 }}>
                  <StyledQR value={content} size={142} fgColor={t.qrColor} showCenterLogo={showLogo} />
                </View>
              </View>
            </View>

            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, zIndex: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 165 }}>
                <View style={{ padding: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.12)' }}>
                  <Ionicons name="pricetag" size={13} color={t.hatch} />
                </View>
                <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#FFFFFF', lineHeight: 15 }}>
                  {c.discountText || 'GET DISCOUNT UP TO 50% OFF!'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 42, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)' }} />
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: t.hatch, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="chevron-down" size={13} color={t.hatch} />
                  </View>
                </View>
                <Text style={{ fontSize: 9.5, fontWeight: '700', color: t.sub }}>
                  {c.websiteUrl || 'www.getaipilot.in'}
                </Text>
              </View>
            </View>
          </View>
        );
      }

      /* 2. CURVED WAVE DIGITAL E-MENU */
      case 'curved-wave-menu': {
        const c = config.curvedWaveMenu || ({} as any);
        const themeMap: Record<string, { canopy: string; qrColor: string }> = {
          'indigo-night': { canopy: '#1E295D', qrColor: '#1E295D' },
          'terracotta-warm': { canopy: '#C25E36', qrColor: '#C25E36' },
          'emerald-deep': { canopy: '#0F6848', qrColor: '#0F6848' },
          'teal-ocean': { canopy: '#148A9D', qrColor: '#148A9D' },
        };
        const t = themeMap[c.theme || 'teal-ocean'] || themeMap['teal-ocean'];
        const logoParts = (c.logoText || 'YOUR LOGO').trim().split(' ');

        return (
          <View style={[s.cardBase, { backgroundColor: '#FFFFFF', width: 324, padding: 0, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }]}>
            <View style={{ width: '100%', backgroundColor: t.canopy, paddingTop: 26, paddingBottom: 34, paddingHorizontal: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 }}>
                {c.menuTitle || 'E-MENU'}
              </Text>
              <Text style={{ fontSize: 10.5, fontWeight: '600', color: 'rgba(255,255,255,0.92)', marginTop: 3, textAlign: 'center' }}>
                {c.menuSubtitle || 'For a contactless menu, scan QR code'}
              </Text>
              <View style={{ marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF' }}>
                <StyledQR value={content} size={144} fgColor={t.qrColor} showCenterLogo={showLogo} />
              </View>
            </View>

            <View style={{ width: '100%', marginTop: -24, height: 28 }}>
              <Svg width="324" height="28" viewBox="0 0 500 60" preserveAspectRatio="none">
                <Path d="M 0 0 C 150 55, 350 55, 500 0 L 500 60 L 0 60 Z" fill="#FFFFFF" />
              </Svg>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 22, paddingTop: 2, alignItems: 'center', width: '100%' }}>
              <View style={{ width: 50, height: 50, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: `${t.canopy}66`, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden' }}>
                {config.logoUrl ? (
                  <Image source={{ uri: config.logoUrl }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                ) : (
                  <>
                    <Text style={{ fontSize: 7.5, fontWeight: '900', color: '#334155' }}>{logoParts[0] || 'YOUR'}</Text>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#1E293B' }}>{logoParts.slice(1).join(' ') || 'LOGO'}</Text>
                  </>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '900', color: t.canopy, letterSpacing: 0.6 }}>
                {c.descriptionTitle || 'QR MENU DESCRIPTION'}
              </Text>
              <Text style={{ fontSize: 10, color: '#475569', textAlign: 'center', marginTop: 4, lineHeight: 14 }}>
                {c.descriptionText || 'More comfortable, faster and environmentally friendly.'}
              </Text>
            </View>
          </View>
        );
      }

      /* 3. BOTANICAL APOTHECARY */
      case 'botanical-apothecary': {
        const c = config.botanicalApothecary || ({} as any);
        const themeMap: Record<string, { grad: [string, string, string]; border: string; accent: string; sub: string; qrColor: string; marble: [string, string, string] }> = {
          'vintage-amber': { grad: ['#2E1908', '#1F1004', '#120802'], border: '#B48246', accent: '#FAE4C3', sub: '#D6B492', qrColor: '#221104', marble: ['#D4B996', '#F5E6D3', '#BBA07D'] },
          'rose-quartz': { grad: ['#2E1420', '#1F0B14', '#11050A'], border: '#D48B9F', accent: '#FFE4EC', sub: '#E2A9B8', qrColor: '#290918', marble: ['#E2CFD5', '#F7EDF1', '#C9B2BA'] },
          'midnight-apothecary': { grad: ['#151C19', '#0D1210', '#050806'], border: '#C5A059', accent: '#F5ECD5', sub: '#A4B5AA', qrColor: '#0F1612', marble: ['#8A948E', '#CBD5CF', '#717B75'] },
          'emerald-sage': { grad: ['#182E22', '#0F2017', '#07130C'], border: '#C9A767', accent: '#FAE5BE', sub: '#C2D7CB', qrColor: '#0B2014', marble: ['#C2CFC6', '#E5EDE8', '#9CB0A2'] },
        };
        const t = themeMap[c.theme || 'emerald-sage'] || themeMap['emerald-sage'];

        return (
          <View style={{ alignItems: 'center', width: 324 }}>
            <LinearGradient
              colors={t.grad}
              style={{
                width: 324,
                borderTopLeftRadius: 140,
                borderTopRightRadius: 140,
                borderBottomLeftRadius: 22,
                borderBottomRightRadius: 22,
                borderWidth: 2,
                borderColor: t.border,
                padding: 18,
                alignItems: 'center',
              }}
            >
              <Svg width="64" height="54" viewBox="0 0 100 86" fill="none">
                <Path d="M 50 82 Q 52 45 50 8" stroke={t.border} strokeWidth="2.5" strokeLinecap="round" />
                <Path d="M 50 68 C 30 65, 24 50, 36 44 C 46 48, 50 60, 50 68 Z" fill={t.border} fillOpacity="0.85" />
                <Path d="M 50 48 C 28 44, 22 30, 34 22 C 45 28, 49 40, 50 48 Z" fill={t.border} fillOpacity="0.85" />
                <Path d="M 50 28 C 34 24, 30 12, 40 6 C 47 12, 50 20, 50 28 Z" fill={t.border} fillOpacity="0.9" />
                <Path d="M 50 58 C 70 55, 76 40, 64 34 C 54 38, 50 50, 50 58 Z" fill={t.border} fillOpacity="0.85" />
                <Path d="M 50 38 C 72 34, 78 20, 66 12 C 55 18, 51 30, 50 38 Z" fill={t.border} fillOpacity="0.85" />
                <Circle cx="50" cy="8" r="3.5" fill={t.border} />
              </Svg>
              <Text style={{ fontSize: 8, fontWeight: '800', color: t.accent, letterSpacing: 2, marginTop: 4 }}>
                {c.batchNumber || 'BATCH NO. 84 • EST. 1928'}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFFAF0', letterSpacing: 2.2, marginTop: 4, textAlign: 'center' }}>
                {c.brandName || 'ST. CLAIR BOTANICALS'}
              </Text>
              <Text style={{ fontSize: 9, color: t.sub, letterSpacing: 0.8, marginTop: 2 }}>
                {c.apothecarySubtitle || 'Organic Herbal Apothecary & Holistic Spa'}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: 'rgba(11,56,32,0.8)', marginTop: 8 }}>
                <Ionicons name="leaf" size={10} color={t.accent} />
                <Text style={{ fontSize: 8, fontWeight: '900', color: t.accent, letterSpacing: 1.2 }}>
                  {c.waxSealText || '100% BOTANICAL'}
                </Text>
              </View>

              <View style={{ padding: 10, borderRadius: 14, borderWidth: 2, borderColor: t.border, backgroundColor: '#FBF9F4', marginVertical: 12 }}>
                <StyledQR value={content} size={132} fgColor={t.qrColor} showCenterLogo={showLogo} />
              </View>

              <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFAF0', letterSpacing: 1.2, textAlign: 'center' }}>
                {c.headline || 'SCAN FOR ELIXIR & SPA RITUAL MENU'}
              </Text>
              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: `${t.border}55`, paddingTop: 8, marginTop: 10 }}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: t.accent }}>★ APOTHECARY VERIFIED</Text>
                <Text style={{ fontSize: 8, fontWeight: '800', color: '#34D399' }}>GUEST WI-FI</Text>
              </View>
            </LinearGradient>
            <LinearGradient
              colors={t.marble}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: 185, height: 14, borderRadius: 5, borderWidth: 1, borderColor: t.border, marginTop: -2 }}
            />
          </View>
        );
      }

      /* 4. LEATHER SOMMELIER */
      case 'leather-sommelier': {
        const c = config.leatherSommelier || ({} as any);
        const themeMap: Record<string, { grad: [string, string, string]; border: string; gold: string; sub: string; qrColor: string }> = {
          'midnight-noir': { grad: ['#18181B', '#101013', '#070709'], border: '#D4AF37', gold: '#FAE6A3', sub: '#D4D4D8', qrColor: '#121214' },
          'bordeaux-burgundy': { grad: ['#330F19', '#22070E', '#120206'], border: '#E0A96D', gold: '#F7D8B5', sub: '#FECDD3', qrColor: '#2B040E' },
          'forest-hunter': { grad: ['#102418', '#09170F', '#040C07'], border: '#C9A767', gold: '#F5E2B8', sub: '#BBF7D0', qrColor: '#05160D' },
          'saddle-cognac': { grad: ['#3A1D0D', '#261105', '#150702'], border: '#C29B38', gold: '#FAE6A3', sub: '#E8D2BE', qrColor: '#240E04' },
        };
        const t = themeMap[c.theme || 'saddle-cognac'] || themeMap['saddle-cognac'];

        return (
          <View style={{ alignItems: 'center', width: 324 }}>
            <LinearGradient
              colors={t.grad}
              style={{ width: 324, borderRadius: 22, borderWidth: 2, borderColor: t.border, padding: 18, alignItems: 'center', overflow: 'hidden' }}
            >
              {/* Brass Corners */}
              <View style={{ position: 'absolute', top: 0, left: 0, width: 22, height: 22, borderTopWidth: 5, borderLeftWidth: 5, borderColor: t.gold, borderTopLeftRadius: 20 }} />
              <View style={{ position: 'absolute', top: 0, right: 0, width: 22, height: 22, borderTopWidth: 5, borderRightWidth: 5, borderColor: t.gold, borderTopRightRadius: 20 }} />
              <View style={{ position: 'absolute', bottom: 0, left: 0, width: 22, height: 22, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: t.gold, borderBottomLeftRadius: 20 }} />
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderBottomWidth: 5, borderRightWidth: 5, borderColor: t.gold, borderBottomRightRadius: 20 }} />

              <Svg width="68" height="62" viewBox="0 0 100 96" fill="none">
                <Path d="M 36 26 L 36 34 C 36 42, 28 46, 28 54 L 28 90 C 28 93, 30 94, 33 94 L 47 94 C 50 94, 52 93, 52 90 L 52 54 C 52 46, 44 42, 44 34 L 44 26 Z" fill="#1E070D" stroke="#C29B38" strokeWidth="1" />
                <Path d="M 36 6 L 44 6 L 44 26 L 36 26 Z" fill="#D4AF37" />
                <Rect x="31" y="52" width="18" height="30" rx="1.5" fill="#FFFBF2" />
                <Line x1="76" y1="76" x2="76" y2="94" stroke="#FAE6A3" strokeWidth="1.5" />
                <Path d="M 67 56 C 67 72, 85 72, 85 56 Z" fill="#991B1B" stroke="#FAE6A3" strokeWidth="1" />
              </Svg>

              <Text style={{ fontSize: 8, fontWeight: '800', color: t.gold, letterSpacing: 1.8, marginTop: 2 }}>
                {c.tableNumber || 'TABLE 14 • SOMMELIER SERVICE'}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, marginTop: 2, textAlign: 'center' }}>
                {c.restaurantName || 'LE CELLIER VINTAGE'}
              </Text>
              <Text style={{ fontSize: 9, color: t.sub, letterSpacing: 0.8 }}>
                {c.sommelierTitle || 'GRAND CRU WINE & TASTING ROOM'}
              </Text>

              <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: 'rgba(0,0,0,0.4)', marginTop: 6 }}>
                <Text style={{ fontSize: 8, fontWeight: '900', color: t.gold, letterSpacing: 1 }}>
                  {c.vintageRating || '96 PTS // CELLAR SELECTION'}
                </Text>
              </View>

              <View style={{ padding: 10, borderRadius: 14, borderWidth: 2, borderColor: t.border, backgroundColor: '#FFFBF7', marginVertical: 12 }}>
                <StyledQR value={content} size={130} fgColor={t.qrColor} showCenterLogo={showLogo} />
              </View>

              <Text style={{ fontSize: 10, fontWeight: '800', color: t.gold, letterSpacing: 1, textAlign: 'center' }}>
                {c.headline || 'SCAN FOR SOMMELIER RESERVE WINE LIST'}
              </Text>
              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: `${t.border}66`, paddingTop: 8, marginTop: 10 }}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: t.gold }}>TABLE-SIDE SERVICE</Text>
                <Text style={{ fontSize: 8, fontWeight: '800', color: '#34D399' }}>CONTACTLESS PAY</Text>
              </View>
            </LinearGradient>
            <View style={{ width: 175, height: 14, borderRadius: 5, backgroundColor: '#2B160A', borderWidth: 1, borderColor: t.border, marginTop: -2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.gold }} />
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.gold }} />
            </View>
          </View>
        );
      }

      /* 5. COFFEE ROASTER */
      case 'coffee-roaster': {
        const c = config.coffeeRoaster || ({} as any);
        const themeMap: Record<string, { grad: [string, string, string]; border: string; title: string; sub: string; qrColor: string }> = {
          'walnut-espresso': { grad: ['#2B1D14', '#1E130C', '#120905'], border: '#8D6748', title: '#FFF8F0', sub: '#D6BEAA', qrColor: '#22130A' },
          'terracotta-clay': { grad: ['#3A2016', '#2A140C', '#180904'], border: '#B85E3B', title: '#FED7AA', sub: '#FCD34D', qrColor: '#2A140C' },
          'matte-obsidian': { grad: ['#18181B', '#101012', '#070709'], border: '#D4AF37', title: '#FFFFFF', sub: '#FDE68A', qrColor: '#18181B' },
          'nordic-oak': { grad: ['#FDFCF9', '#F7F2EA', '#EEE3D4'], border: '#CBB399', title: '#2B170E', sub: '#694833', qrColor: '#2B170E' },
        };
        const t = themeMap[c.theme || 'nordic-oak'] || themeMap['nordic-oak'];

        return (
          <View style={{ alignItems: 'center', width: 324 }}>
            <LinearGradient
              colors={t.grad}
              style={{ width: 324, borderTopLeftRadius: 160, borderTopRightRadius: 160, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, borderWidth: 3, borderColor: t.border, padding: 18, paddingTop: 26, alignItems: 'center' }}
            >
              <View style={{ width: 70, height: 14, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, backgroundColor: '#C29B38', position: 'absolute', top: 0 }} />
              <Svg width="56" height="56" viewBox="0 0 70 70" fill="none">
                <Path d="M28 14 C27 9, 31 7, 30 2" stroke="#B89372" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M35 15 C34 9, 38 6, 37 1" stroke="#8C6542" strokeWidth="1.6" strokeLinecap="round" />
                <Path d="M42 14 C41 9, 45 7, 44 2" stroke="#B89372" strokeWidth="1.5" strokeLinecap="round" />
                <Ellipse cx="35" cy="56" rx="26" ry="5" fill="#FFFFFF" stroke="#8C6542" strokeWidth="1.4" />
                <Path d="M16 26 C16 48, 22 52, 35 52 C48 52, 54 48, 54 26 Z" fill="#FFFFFF" stroke="#8C6542" strokeWidth="1.6" />
                <Path d="M52 30 C59 30, 60 42, 51 44" stroke="#8C6542" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <Ellipse cx="35" cy="26" rx="19" ry="6" fill="#DFCFBE" />
              </Svg>
              <Text style={{ fontSize: 16, fontWeight: '900', color: t.title, letterSpacing: 1.8, marginTop: 4, textAlign: 'center' }}>
                {c.shopName || 'TIMBER & BEAN ROASTERS'}
              </Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: t.sub, marginTop: 2, textAlign: 'center' }}>
                {c.roastOrigin || 'ETHIOPIA GUJI • NATURAL HEIRLOOM'}
              </Text>

              <View style={{ padding: 10, borderRadius: 14, borderWidth: 2, borderColor: t.border, backgroundColor: '#FFFFFF', marginVertical: 12 }}>
                <StyledQR value={content} size={130} fgColor={t.qrColor} showCenterLogo={showLogo} />
              </View>

              <Text style={{ fontSize: 10.5, fontWeight: '900', color: t.title, letterSpacing: 0.8, textAlign: 'center' }}>
                {c.headline || 'SCAN FOR SPECIALTY BREW MENU'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.06)', marginTop: 8 }}>
                <Text style={{ fontSize: 7.5, fontWeight: '900', color: t.title }}>PUNCH CARD</Text>
                <Text style={{ fontSize: 9 }}>☕ ☕ ☕ ☕ ☕ ★</Text>
              </View>
              <Text style={{ fontSize: 8.5, fontWeight: '700', color: t.sub, marginTop: 8 }}>
                {c.loyaltyOffer || '☕ 10TH CUP FREE • GUEST WI-FI'}
              </Text>
            </LinearGradient>
            <View style={{ width: 185, height: 13, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#DFCEBA', marginTop: -2 }} />
          </View>
        );
      }

      /* 6. CYBER HOLOGRAM */
      case 'cyber-hologram': {
        const c = config.cyberHologram || ({} as any);
        const themeMap: Record<string, { bg: string; accent: string; qrColor: string }> = {
          'matrix-cyan': { bg: '#031525', accent: '#06B6D4', qrColor: '#02121E' },
          'solar-flare': { bg: '#1C082E', accent: '#D946EF', qrColor: '#170222' },
          'quantum-emerald': { bg: '#021F14', accent: '#10B981', qrColor: '#01160D' },
          'iridescent-prism': { bg: '#0E101F', accent: '#38BDF8', qrColor: '#090A18' },
        };
        const t = themeMap[c.theme || 'iridescent-prism'] || themeMap['iridescent-prism'];

        return (
          <View style={{ alignItems: 'center', width: 324 }}>
            <LinearGradient
              colors={['#22D3EE', '#6366F1', '#D946EF']}
              style={{ width: 324, borderRadius: 22, padding: 2.5 }}
            >
              <View style={{ backgroundColor: t.bg, borderRadius: 20, padding: 18, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 6 }}>
                  <Text style={{ fontSize: 8.5, fontWeight: '800', color: t.accent, letterSpacing: 1.2 }}>● {c.systemTag || 'AR-SYNCED // LIVE'}</Text>
                  <Text style={{ fontSize: 8, fontWeight: '800', color: t.accent, borderWidth: 1, borderColor: t.accent, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 }}>{c.actionBadge || 'QUANTUM SECURE'}</Text>
                </View>

                <Svg width="58" height="58" viewBox="0 0 80 80" fill="none">
                  <Polygon points="40,8 66,35 40,62 14,35" stroke={t.accent} strokeWidth="1.8" fill="rgba(99,102,241,0.18)" />
                  <Polygon points="40,8 66,35 40,38" stroke={t.accent} strokeWidth="1.2" fill="rgba(56,189,248,0.28)" />
                  <Circle cx="40" cy="35" r="4" fill="#FFFFFF" />
                  <Circle cx="40" cy="35" r="28" stroke={t.accent} strokeWidth="0.9" strokeDasharray="4,4" />
                </Svg>

                <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.6, marginTop: 4 }}>{c.projectName || 'QUANTUM // OS 2.0'}</Text>
                <Text style={{ fontSize: 8.5, fontWeight: '700', color: t.accent, marginTop: 2 }}>{c.hudCoordinate || 'SYS.GRID // 47.6062° N'}</Text>

                <View style={{ padding: 12, position: 'relative', marginVertical: 10 }}>
                  <View style={{ position: 'absolute', top: 0, left: 0, width: 14, height: 14, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderColor: '#22D3EE' }} />
                  <View style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderTopWidth: 2.5, borderRightWidth: 2.5, borderColor: '#22D3EE' }} />
                  <View style={{ position: 'absolute', bottom: 0, left: 0, width: 14, height: 14, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderColor: '#22D3EE' }} />
                  <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderColor: '#22D3EE' }} />
                  <View style={{ padding: 10, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: t.accent }}>
                    <StyledQR value={content} size={134} fgColor={t.qrColor} showCenterLogo={showLogo} />
                  </View>
                </View>

                <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 }}>{c.headline || 'SCAN TO ACCESS AR INTERFACE'}</Text>
                <Text style={{ fontSize: 8.5, color: '#94A3B8', textAlign: 'center', marginTop: 4 }}>{c.subheadline || 'Interactive 3D spatial node & keynote stream'}</Text>
              </View>
            </LinearGradient>
            <View style={{ width: 190, height: 14, borderRadius: 6, backgroundColor: '#1E1B4B', borderWidth: 1, borderColor: t.accent, alignItems: 'center', justifyContent: 'center', marginTop: -2 }}>
              <View style={{ width: 120, height: 3, borderRadius: 2, backgroundColor: t.accent }} />
            </View>
          </View>
        );
      }

      /* 7. LUXURY REAL ESTATE */
      case 'luxury-realestate': {
        const c = config.luxuryRealEstate || ({} as any);
        const themeMap: Record<string, { grad: [string, string, string]; border: string; title: string; sub: string; qrColor: string }> = {
          'travertine-brass': { grad: ['#F8F4EC', '#F0E9DC', '#E4DBC8'], border: '#BFAE92', title: '#241E17', sub: '#62513F', qrColor: '#221C15' },
          'monaco-white': { grad: ['#FFFFFF', '#F8FAFC', '#EEF2F6'], border: '#CBD5E1', title: '#0F172A', sub: '#475569', qrColor: '#0F172A' },
          'emerald-estate': { grad: ['#07241A', '#041A13', '#020E0A'], border: '#10B981', title: '#FFFFFF', sub: '#A7F3D0', qrColor: '#043324' },
          'obsidian-gold': { grad: ['#18191C', '#101013', '#070709'], border: '#D4AF37', title: '#FFFFFF', sub: '#FDE68A', qrColor: '#111113' },
        };
        const t = themeMap[c.theme || 'obsidian-gold'] || themeMap['obsidian-gold'];

        return (
          <View style={{ alignItems: 'center', width: 324 }}>
            <LinearGradient colors={t.grad} style={{ width: 324, borderRadius: 22, borderWidth: 2, borderColor: t.border, padding: 18, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: t.title, letterSpacing: 1.2 }}>{(config.brandName || 'LUXURY ESTATES').toUpperCase()}</Text>
                <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 7.5, fontWeight: '900', color: '#F59E0B' }}>{c.badgeTag || 'EXCLUSIVE LISTING'}</Text>
                </View>
              </View>

              {/* Villa SVG Banner */}
              <View style={{ width: '100%', height: 92, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0A0F18', marginBottom: 10, justifyContent: 'flex-end', padding: 8 }}>
                <Svg style={StyleSheet.absoluteFill} viewBox="0 0 320 140" preserveAspectRatio="none">
                  <Rect width="320" height="140" fill="#0D1424" />
                  <Rect x="45" y="40" width="130" height="42" fill="#1E293B" stroke="#F59E0B" strokeWidth="1" />
                  <Rect x="160" y="25" width="105" height="40" fill="#0F172A" stroke="#D97706" strokeWidth="1" />
                  <Rect x="35" y="95" width="250" height="28" rx="4" fill="#0284C7" opacity="0.45" />
                </Svg>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#FBBF24', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#000000' }}>360° 3D TOUR</Text>
                  </View>
                  <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#FDE68A' }}>{c.priceGuide || 'From $4,850,000'}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 15, fontWeight: '900', color: t.title, letterSpacing: 1.4, textAlign: 'center' }}>{c.propertyTitle || 'VILLA SERENA • RESIDENCES'}</Text>
              <Text style={{ fontSize: 9.5, color: t.sub, marginTop: 2 }}>{c.propertyLocation || 'Palm Jumeirah • Dubai, UAE'}</Text>

              <View style={{ flexDirection: 'row', gap: 5, width: '100%', marginVertical: 10 }}>
                {[c.bedrooms || '5 Beds', c.bathrooms || '6 Baths', c.areaSqFt || '7,850 sq ft', c.viewType || 'Beach'].map((spec, idx) => (
                  <View key={idx} style={{ flex: 1, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: `${t.border}55`, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center' }}>
                    <Text style={{ fontSize: 8, fontWeight: '700', color: t.title }}>{spec}</Text>
                  </View>
                ))}
              </View>

              <View style={{ padding: 10, borderRadius: 14, borderWidth: 2, borderColor: t.border, backgroundColor: '#FFFFFF', marginVertical: 4 }}>
                <StyledQR value={content} size={130} fgColor={t.qrColor} showCenterLogo={showLogo} />
              </View>

              <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#F59E0B', letterSpacing: 0.8, marginTop: 8 }}>{c.ctaHeadline || 'SCAN FOR 3D VIRTUAL TOUR'}</Text>
              <Text style={{ fontSize: 8.5, color: t.sub, marginTop: 4 }}>{c.agentName || 'Marcus Vance | Global Realty'}</Text>
            </LinearGradient>
            <View style={{ width: 175, height: 13, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#AA822D', marginTop: -2 }} />
          </View>
        );
      }

      /* 8. NEON COCKTAIL */
      case 'neon-cocktail': {
        const c = config.neonCocktail || ({} as any);
        const themeMap: Record<string, { grad: [string, string, string]; tube: string; neon: string; qrColor: string }> = {
          'cyber-magenta': { grad: ['#20051D', '#120211', '#050005'], tube: '#F43F5E', neon: '#FB7185', qrColor: '#200216' },
          'electric-emerald': { grad: ['#031E15', '#02120D', '#010805'], tube: '#10B981', neon: '#34D399', qrColor: '#022115' },
          'midnight-violet': { grad: ['#180A2E', '#0D041C', '#040108'], tube: '#A855F7', neon: '#C084FC', qrColor: '#130324' },
          'neon-amber': { grad: ['#221303', '#140B01', '#060300'], tube: '#F59E0B', neon: '#FBBF24', qrColor: '#1A0B02' },
        };
        const t = themeMap[c.theme || 'neon-amber'] || themeMap['neon-amber'];

        return (
          <View style={{ alignItems: 'center', width: 324 }}>
            <LinearGradient
              colors={t.grad}
              style={{ width: 324, borderTopLeftRadius: 140, borderTopRightRadius: 140, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, borderWidth: 3, borderColor: t.tube, padding: 20, paddingTop: 28, alignItems: 'center' }}
            >
              <Svg width="52" height="52" viewBox="0 0 64 64" fill="none">
                <Path d="M14 16 L32 36 L50 16 Z" stroke={t.neon} strokeWidth="2.5" strokeLinejoin="round" />
                <Line x1="32" y1="36" x2="32" y2="52" stroke={t.neon} strokeWidth="2.5" />
                <Path d="M22 52 L42 52" stroke={t.neon} strokeWidth="2.5" strokeLinecap="round" />
                <Line x1="20" y1="12" x2="38" y2="30" stroke="#F43F5E" strokeWidth="2" />
                <Circle cx="28" cy="20" r="3.5" fill="#10B981" />
              </Svg>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, marginTop: 4 }}>{c.venueName || 'THE VELVET ROOM'}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: t.neon, marginTop: 2 }}>{c.venueSubtitle || 'Rooftop Cocktail Lounge'}</Text>
              {c.happyHourText ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: t.tube, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 8 }}>
                  <Text style={{ fontSize: 8.5, fontWeight: '900', color: t.neon }}>🔥 {c.happyHourText}</Text>
                </View>
              ) : null}

              <View style={{ padding: 10, borderRadius: 16, borderWidth: 2, borderColor: t.tube, backgroundColor: '#FFFFFF', marginVertical: 14 }}>
                <StyledQR value={content} size={136} fgColor={t.qrColor} showCenterLogo={showLogo} />
              </View>

              <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 }}>{c.headline || 'SCAN FOR DRINKS & TAPAS'}</Text>
              <Text style={{ fontSize: 9, color: '#CBD5E1', textAlign: 'center', marginTop: 3 }}>{c.subheadline || 'Order craft cocktails directly to your table'}</Text>
            </LinearGradient>
            <View style={{ width: 210, height: 14, borderRadius: 6, backgroundColor: '#121216', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginTop: -2 }} />
          </View>
        );
      }

      /* 9. ACRYLIC STANDEE */
      case 'acrylic-standee': {
        const isSmoked = config.acrylic.acrylicTone === 'smoked';
        const cardBg = isSmoked ? '#1E293B' : '#FFFFFF';
        const textColor = isSmoked ? '#FFFFFF' : '#0F172A';
        const woodColors: Record<string, string> = { walnut: '#3E2723', oak: '#A07855', birch: '#D7CCC8', black: '#1A1A1A' };
        const woodColor = woodColors[config.acrylic.woodFinish] || woodColors.oak;

        return (
          <View style={{ alignItems: 'center', width: 324 }}>
            <View style={{ width: 300, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderWidth: 2, borderColor: isSmoked ? '#334155' : '#E2E8F0', backgroundColor: cardBg, padding: 20, alignItems: 'center' }}>
              {config.logoUrl ? (
                <Image source={{ uri: config.logoUrl }} style={{ width: 48, height: 48, borderRadius: 24, marginBottom: 6, backgroundColor: '#FFF' }} />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 8, fontWeight: '800', color: '#64748B' }}>YOUR</Text>
                  <Text style={{ fontSize: 8, fontWeight: '800', color: '#64748B' }}>LOGO</Text>
                </View>
              )}
              <Text style={{ fontSize: 12, fontWeight: '900', color: textColor, letterSpacing: 1.5 }}>{(config.brandName || 'YOUR BRAND HERE').toUpperCase()}</Text>
              <View style={{ padding: 10, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginVertical: 12 }}>
                <StyledQR value={content} size={150} fgColor={fgColor} showCenterLogo={showLogo} />
              </View>
              <Text style={{ fontSize: 10.5, color: isSmoked ? '#CBD5E1' : '#475569', textAlign: 'center', lineHeight: 15 }}>
                {config.acrylic.tagline || 'Scan this QR code to review our stay or service on Google'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', width: '100%', justifyContent: 'center' }}>
                <Svg width="14" height="14" viewBox="0 0 24 24">
                  <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </Svg>
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: textColor }}>{config.acrylic.googleRatingText || 'Google 4.9 ★★★★★'}</Text>
              </View>
            </View>
            <View style={{ width: 332, height: 22, borderRadius: 6, backgroundColor: woodColor, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 290, height: 3, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 2 }} />
            </View>
          </View>
        );
      }

      /* 10. SCENIC SOCIAL FLOATING CARD */
      case 'social-card': {
        const bgThemes: Record<string, string> = {
          mountain: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
        };
        const themeKey = config.socialCard.bgTheme || 'mountain';
        const isGrad = themeKey.startsWith('gradient');
        const gradColors: [string, string] = themeKey === 'gradient-purple' ? ['#4F46E5', '#EC4899'] : ['#0A4737', '#10B981'];
        const bgPhoto = themeKey === 'custom' && config.socialCard.customBgUrl ? config.socialCard.customBgUrl : bgThemes[themeKey] || bgThemes.mountain;

        return (
          <View style={{ width: 324, height: 430, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            {isGrad ? (
              <LinearGradient colors={gradColors} style={StyleSheet.absoluteFill} />
            ) : (
              <Image source={{ uri: bgPhoto }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
            <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: 18, alignItems: 'center' }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#829079', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF', overflow: 'hidden', marginBottom: 8 }}>
                {config.logoUrl ? (
                  <Image source={{ uri: config.logoUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                    {config.brandName ? config.brandName.slice(0, 2).toUpperCase() : 'GP'}
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>{config.brandName || 'Keystone Designs'}</Text>
              <Text style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, textAlign: 'center' }}>{config.socialCard.subtitle || 'Hospitality & Dining Experience'}</Text>
              <View style={{ padding: 8, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', marginVertical: 12 }}>
                <StyledQR value={content} size={130} fgColor={fgColor} showCenterLogo={showLogo} />
              </View>
              <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: '#829079' }} />
            </View>
          </View>
        );
      }

      /* 11. HEXAGONAL DUAL COUNTER SIGN */
      case 'hexagon-dual': {
        const c = config.hexagon;
        const isDark = c.plateColor === 'black';
        const plateFill = isDark ? '#18181B' : '#FFFFFF';
        const metalColors: Record<string, string> = { gold: '#C29B38', rosegold: '#B76E79', silver: '#64748B' };
        const mColor = metalColors[c.accentMetal] || metalColors.gold;

        return (
          <View style={{ alignItems: 'center', width: 320 }}>
            <View style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 18 }}>
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 300 300">
                <Polygon points="150,2 298,75 298,225 150,298 2,225 2,75" fill={plateFill} stroke={mColor} strokeWidth="3" />
              </Svg>
              <Text style={{ fontSize: 11, fontWeight: '800', fontStyle: 'italic', color: '#EC4899', letterSpacing: 1.2 }}>
                {config.brandName || 'THE BEAUTY LAB'}
              </Text>
              <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Ionicons name="logo-instagram" size={26} color={mColor} />
                  <Text style={{ fontSize: 11, fontWeight: '900', fontStyle: 'italic', color: isDark ? '#FFF' : '#1E293B', marginTop: 2 }}>{c.leftTitle || 'Instagram'}</Text>
                  <Text style={{ fontSize: 9, color: isDark ? '#CBD5E1' : '#64748B' }} numberOfLines={1}>{c.leftHandle || '@grand_vista'}</Text>
                </View>
                <View style={{ width: 1.5, height: 55, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Ionicons name="wifi" size={26} color={mColor} />
                  <Text style={{ fontSize: 11, fontWeight: '900', fontStyle: 'italic', color: isDark ? '#FFF' : '#1E293B', marginTop: 2 }}>{c.rightTitle || 'Wi-Fi'}</Text>
                  <Text style={{ fontSize: 8.5, color: isDark ? '#CBD5E1' : '#475569' }} numberOfLines={1}>Net: {c.rightSsid || 'Guest_Wifi'}</Text>
                  <Text style={{ fontSize: 8.5, color: isDark ? '#CBD5E1' : '#475569' }} numberOfLines={1}>Pass: {c.rightPassword || '12345678'}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'center' }}>
                <View style={{ padding: 5, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <StyledQR value={content} size={64} fgColor={fgColor} showCenterLogo={showLogo} logoScale={0.26} />
                </View>
                <Text style={{ fontSize: 7.5, fontWeight: '800', color: '#94A3B8', marginTop: 3 }}>SCAN TO CONNECT</Text>
              </View>
            </View>
            <View style={{ width: 170, height: 12, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, backgroundColor: mColor, marginTop: -2 }} />
          </View>
        );
      }

      /* 12. TABLETOP TENT STAND */
      case 'tent-stand': {
        const themeMap: Record<string, { bg: string; text: string; sub: string; border: string }> = {
          cream: { bg: '#F7EFE9', text: '#3D312A', sub: '#7B695E', border: '#E5D7CD' },
          craft: { bg: '#DFD3C3', text: '#3A3845', sub: '#595567', border: '#C7B198' },
          slate: { bg: '#1E293B', text: '#FFFFFF', sub: '#CBD5E1', border: '#334155' },
          emerald: { bg: '#064E3B', text: '#FFFFFF', sub: '#A7F3D0', border: '#047857' },
        };
        const t = themeMap[config.tent.standColor] || themeMap.cream;

        return (
          <View style={{ alignItems: 'center', width: 300 }}>
            <View style={{ width: 280, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 2, borderBottomWidth: 0, borderColor: t.border, backgroundColor: t.bg, padding: 22, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: t.text, letterSpacing: 1.5 }}>{config.tent.headline || 'SCAN QR CODE'}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: t.sub, letterSpacing: 1, marginTop: 2, textAlign: 'center' }}>{config.tent.subtitle || 'TO VIEW OUR MENU'}</Text>
              <View style={{ width: 44, height: 3, backgroundColor: 'rgba(217,119,6,0.35)', borderRadius: 2, marginTop: 6 }} />
              <View style={{ padding: 10, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 14 }}>
                <StyledQR value={content} size={150} fgColor={fgColor} showCenterLogo={showLogo} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '900', color: t.text, letterSpacing: 1.2 }}>{config.tent.tableNumber || 'TABLE #04'}</Text>
              <Text style={{ fontSize: 9.5, color: t.sub, textAlign: 'center', marginTop: 3 }}>{config.tent.note || 'Touchless digital menu'}</Text>
            </View>
            <View style={{ width: 294, height: 11, backgroundColor: 'rgba(0,0,0,0.3)', borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }} />
          </View>
        );
      }

      /* 13. RETAIL SCAN & PAY */
      case 'retail-pay': {
        const themeMap: Record<string, { grad: [string, string]; ribbon: string; title: string; border: string }> = {
          pink: { grad: ['#FFF0F5', '#FFE4E1'], ribbon: '#F43F5E', title: '#E11D48', border: '#F9A8D4' },
          teal: { grad: ['#E6FFFA', '#B2F5EA'], ribbon: '#0D9488', title: '#0F766E', border: '#5EEAD4' },
          amber: { grad: ['#FFFBEB', '#FEF3C7'], ribbon: '#D97706', title: '#B45309', border: '#FCD34D' },
          indigo: { grad: ['#EEF2FF', '#E0E7FF'], ribbon: '#4F46E5', title: '#4338CA', border: '#A5B4FC' },
        };
        const t = themeMap[config.retailPay.theme] || themeMap.pink;

        return (
          <View style={{ alignItems: 'center', width: 320 }}>
            <LinearGradient colors={t.grad} style={{ width: 306, borderRadius: 30, borderWidth: 4, borderColor: t.border, padding: 20, alignItems: 'center' }}>
              <View style={{ backgroundColor: t.ribbon, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 16, marginBottom: 6 }}>
                <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 }}>✦ {config.retailPay.ribbonText || 'SCAN & PAY'} ✦</Text>
              </View>
              <Text style={{ fontSize: 26, fontWeight: '900', color: t.title }}>{config.retailPay.title || 'QRIS / UPI PAY'}</Text>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 1.5, marginBottom: 10 }}>{config.retailPay.subtitle || 'AMAN • CEPAT • TERPERCAYA'}</Text>

              <View style={{ padding: 14, backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 2, borderColor: '#E2E8F0', position: 'relative' }}>
                <View style={{ position: 'absolute', top: 7, left: 7, width: 14, height: 14, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#EF4444' }} />
                <View style={{ position: 'absolute', top: 7, right: 7, width: 14, height: 14, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#EF4444' }} />
                <View style={{ position: 'absolute', bottom: 7, left: 7, width: 14, height: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#EF4444' }} />
                <View style={{ position: 'absolute', bottom: 7, right: 7, width: 14, height: 14, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#EF4444' }} />
                <StyledQR value={content} size={150} fgColor={fgColor} showCenterLogo={showLogo} />
              </View>

              <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#1E293B', marginTop: 10, letterSpacing: 0.8 }}>{(config.brandName || 'BELLA SWEET CAFE').toUpperCase()}</Text>
              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="shield-checkmark" size={13} color="#059669" />
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#475569' }}>{config.retailPay.securityBadge || '100% Verified'}</Text>
                </View>
                <Text style={{ fontSize: 8.5, fontWeight: '700', color: '#475569', backgroundColor: 'rgba(255,255,255,0.75)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  {config.retailPay.acceptedMethods || 'All UPI / Cards'}
                </Text>
              </View>
            </LinearGradient>
            <View style={{ width: 296, height: 11, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, marginTop: -2 }} />
          </View>
        );
      }

      /* 14. PIZZA MELT */
      case 'pizza-melt': {
        const c = config.pizzaMelt;
        const qrFg = fgColor || '#1B4D28';
        return (
          <View style={[s.cardBase, { backgroundColor: '#1B4D28', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 2, width: 320, borderRadius: 30, padding: 18 }]}>
            <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#FAEED0', letterSpacing: 1.2, textAlign: 'center' }}>{(c?.tagline || 'Scan to browse our artisan menu').toUpperCase()}</Text>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.5, marginTop: 3, marginBottom: 8 }}>{(config.brandName || 'GETAIPILOT').toUpperCase()}</Text>

            <View style={{ width: 192, alignItems: 'center' }}>
              <Image source={TEMPLATE_COMPONENT_ASSETS.pizzaTop} style={{ width: 192, height: 52, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginBottom: -6, zIndex: 1 }} resizeMode="cover" />
              <View style={{ width: 192, padding: 10, backgroundColor: '#FFFEF2', borderRadius: 16, alignItems: 'center', zIndex: 2 }}>
                <StyledQR value={content} size={156} fgColor={qrFg} bgColor="#FFFEF2" showCenterLogo={showLogo} />
              </View>
              <Image source={TEMPLATE_COMPONENT_ASSETS.pizzaBottom} style={{ width: 192, height: 52, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginTop: -6, zIndex: 1 }} resizeMode="cover" />
            </View>

            <Text style={{ fontSize: 12, fontWeight: '900', color: '#FAEED0', letterSpacing: 1.5, marginTop: 10 }}>{c?.headline || 'WOOD-FIRED PIZZERIA'}</Text>
            <Text style={{ fontSize: 8.5, fontWeight: '600', color: '#A2C4AC', letterSpacing: 1.2, marginTop: 2 }}>CONTACTLESS TABLETOP ORDERING</Text>
          </View>
        );
      }

      /* 15. STRAWBERRY ART */
      case 'strawberry-art': {
        const c = config.strawberryArt;
        return (
          <View style={[s.cardBase, { backgroundColor: '#F8F9FB', borderColor: '#E2E8F0', borderWidth: 1, width: 320, borderRadius: 30, padding: 22, alignItems: 'flex-start' }]}>
            <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#BF3844', letterSpacing: 1.2 }}>{c?.categoryText || 'GETAIPILOT / AI QR ART'}</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#B72836', marginTop: 2 }}>{c?.headline || 'QR Code Design'}</Text>
            <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{c?.subheadline || 'Sweet ideas. Fresh design.'}</Text>

            <View style={{ width: '100%', alignItems: 'center', marginVertical: 14 }}>
              <View style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <StyledQR value={content} size={164} fgColor="#B72836" showCenterLogo={showLogo} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Svg width="26" height="26" viewBox="0 0 40 40" fill="none">
                <Path d="M12 34 C 10 26, 28 28, 24 18 C 22 12, 28 10, 26 4" stroke="#B72836" strokeWidth="2.5" strokeLinecap="round" />
                <Path d="M20 9 L 26 3 L 31 9" stroke="#B72836" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FDE9EB', borderColor: '#F8C5CB', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 }}>
                <Ionicons name="qr-code-outline" size={13} color="#B72836" />
                <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#B72836' }}>{c?.buttonText || 'Scan to see more'}</Text>
              </View>
            </View>

            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
              <View>
                <Text style={{ fontSize: 9.5, color: '#64748B' }}>{c?.footerText || 'Made to catch your eye.'}</Text>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#B72836' }}>{config.brandName || 'getaipilot.in'}</Text>
              </View>
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#BF3844', letterSpacing: 1 }}>{c?.tagNumber || 'STRAWBERRY / 07'}</Text>
            </View>
          </View>
        );
      }

      /* 16. RETRO FLORAL */
      case 'retro-floral': {
        const c = config.retroFloral;
        return (
          <View style={[s.cardBase, { backgroundColor: '#FFFDEE', borderColor: '#EAE3D2', borderWidth: 2, width: 320, borderRadius: 30, padding: 20, overflow: 'hidden' }]}>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Svg width="36" height="18" viewBox="0 0 40 20"><Path d="M6 16 A 5 5 0 0 1 12 11 A 7 7 0 0 1 24 10 A 6 6 0 0 1 35 16 Z" fill="#FFFFFF" stroke="#2C2621" strokeWidth="1.2" /></Svg>
              <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#4A3E35', letterSpacing: 2 }}>{c?.topBrand || 'GETAIPILOT'}</Text>
              <Svg width="36" height="18" viewBox="0 0 40 20"><Path d="M6 16 A 5 5 0 0 1 12 11 A 7 7 0 0 1 24 10 A 6 6 0 0 1 35 16 Z" fill="#FFFFFF" stroke="#2C2621" strokeWidth="1.2" /></Svg>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#2E261F', lineHeight: 28 }}>scan</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#34523C', lineHeight: 28 }}>here</Text>

            <View style={{ padding: 10, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 2, borderColor: '#2E261F', marginVertical: 10, zIndex: 5 }}>
              <StyledQR value={content} size={148} fgColor="#2E261F" showCenterLogo={showLogo} />
            </View>

            <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#2E261F', letterSpacing: 0.8, zIndex: 5 }}>{c?.subheadline || 'TO SEE OUR MENU AND PROMO'}</Text>
            <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: '#E2D7C5', paddingTop: 6, marginTop: 6, alignItems: 'center', zIndex: 5 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#34523C' }}>{(c?.shopName || config.brandName || 'our shop').toLowerCase()}</Text>
              <Text style={{ fontSize: 9.5, color: '#5E544A' }}>{c?.address || '123 Anywhere St., Any City'}</Text>
              <Text style={{ fontSize: 9.5, color: '#5E544A' }}>{c?.phone || '+91 89822 85510'}</Text>
              <Text style={{ fontSize: 9.5, color: '#5E544A' }}>{c?.email || 'hello@getaipilot.in'}</Text>
            </View>
            <Image source={TEMPLATE_COMPONENT_ASSETS.retroLeafLeft} style={{ position: 'absolute', bottom: 0, left: 0, width: 58, height: 58, opacity: 0.9 }} resizeMode="contain" />
            <Image source={TEMPLATE_COMPONENT_ASSETS.retroLeafRight} style={{ position: 'absolute', bottom: 0, right: 0, width: 68, height: 68, opacity: 0.9 }} resizeMode="contain" />
          </View>
        );
      }

      /* 17. SOCIAL SHOWCASE */
      case 'social-showcase': {
        const c = config.socialShowcase || ({} as any);
        const platMap: Record<string, { grad: [string, string]; tok: string; icon: any }> = {
          spotify: { grad: ['#3CD276', '#128A42'], tok: '#1ED760', icon: 'musical-notes' },
          instagram: { grad: ['#F58529', '#8134AF'], tok: '#E1306C', icon: 'logo-instagram' },
          youtube: { grad: ['#FF3333', '#990A0A'], tok: '#FF0000', icon: 'logo-youtube' },
          tiktok: { grad: ['#181822', '#040408'], tok: '#FE2C55', icon: 'musical-notes' },
          twitter: { grad: ['#27272A', '#09090B'], tok: '#18181B', icon: 'logo-twitter' },
          linkedin: { grad: ['#0A66C2', '#002952'], tok: '#0A66C2', icon: 'logo-linkedin' },
          whatsapp: { grad: ['#25D366', '#128C7E'], tok: '#25D366', icon: 'logo-whatsapp' },
          custom: { grad: ['#0A4737', '#02140F'], tok: '#10B981', icon: 'share-social' },
        };
        const pt = platMap[c.platform || 'spotify'] || platMap.spotify;
        const avatarUrl = c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

        const tok = (top: number | undefined, bottom: number | undefined, left: number | undefined, right: number | undefined, sz: number) => (
          <View style={{ position: 'absolute', top, bottom, left, right, width: sz, height: sz, borderRadius: sz / 2, backgroundColor: pt.tok, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
            <Ionicons name={pt.icon} size={sz * 0.52} color="#FFFFFF" />
          </View>
        );

        return (
          <LinearGradient colors={pt.grad} style={{ width: 324, minHeight: 420, borderRadius: 34, padding: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {tok(10, undefined, -14, undefined, 54)}
            {tok(22, undefined, undefined, -14, 54)}
            {tok(165, undefined, -18, undefined, 48)}
            {tok(185, undefined, undefined, -16, 54)}
            {tok(undefined, 12, -12, undefined, 54)}
            {tok(undefined, 10, undefined, -12, 54)}

            <View style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 26, padding: 20, alignItems: 'center', marginTop: 22 }}>
              <View style={{ marginTop: -52, marginBottom: 6 }}>
                <Image source={{ uri: avatarUrl }} style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 3.5, borderColor: '#FFFFFF' }} />
                <View style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: pt.tok, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={pt.icon} size={13} color="#FFFFFF" />
                </View>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>@{(c.username || 'getaipilot').replace(/^@/, '')}</Text>
              <Text style={{ fontSize: 10.5, color: '#64748B', textAlign: 'center', marginTop: 3, maxWidth: 210 }}>{c.actionText || 'Scan the QR Code below'}</Text>
              <View style={{ padding: 10, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 12 }}>
                <StyledQR value={content} size={146} fgColor="#000000" showCenterLogo={showLogo} />
              </View>
            </View>
          </LinearGradient>
        );
      }

      /* 18. CLOTHING BRAND / DENIM FASHION */
      case 'clothing-brand': {
        const c = config.clothingBrand || ({} as any);
        return (
          <LinearGradient colors={['#FFFFFF', '#F4F8F7', '#E2EEEC']} style={{ width: 326, borderRadius: 32, borderWidth: 2, borderColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 20, alignItems: 'center' }}>
            <View style={{ width: '100%', alignItems: 'flex-end', marginBottom: 8 }}>
              {c.headline ? <Text style={{ fontSize: 13, color: '#1E293B' }}>{c.headline}</Text> : null}
              {c.subheadline ? <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#1E293B' }}>{c.subheadline}</Text> : null}
              {c.highlightText ? <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#000000' }}>{c.highlightText}</Text> : null}
              {c.promoBadge ? (
                <View style={{ backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#FFFFFF' }}>{c.promoBadge}</Text>
                </View>
              ) : null}
            </View>
            <Image source={TEMPLATE_COMPONENT_ASSETS.denimCollar} style={{ width: 238, height: 64 }} resizeMode="contain" />
            <View style={{ paddingVertical: 2 }}>
              <StyledQR value={content} size={184} fgColor="#244A73" bgColor="transparent" showCenterLogo={showLogo} />
            </View>
            <Image source={TEMPLATE_COMPONENT_ASSETS.denimHem} style={{ width: 238, height: 48 }} resizeMode="contain" />
            <Image source={TEMPLATE_COMPONENT_ASSETS.denimShadow} style={{ width: 240, height: 22, opacity: 0.8 }} resizeMode="contain" />
          </LinearGradient>
        );
      }

      /* 19. DOODLE NATURE */
      case 'doodle-nature': {
        const c = config.doodleNature;
        return (
          <View style={[s.cardBase, { backgroundColor: '#FDFDFA', borderColor: '#E6E2D8', borderWidth: 2, width: 324, borderRadius: 30, padding: 18 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <View>
                <Svg width="44" height="22" viewBox="0 0 50 24" fill="none">
                  <Path d="M8 18 C 5 18, 2 15, 4 12 C 4 9, 8 8, 11 10 C 13 6, 20 6, 22 9 C 25 8, 28 11, 28 14 C 29 18, 24 18, 20 18 Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
                </Svg>
                <Text style={{ fontSize: 10, color: '#334155', marginLeft: 8 }}>v  v</Text>
              </View>
              <View style={{ alignItems: 'center', maxWidth: 145 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#1E293B', letterSpacing: 1.5 }}>{c?.headline || 'DISCOVER NATURE'}</Text>
                <Text style={{ fontSize: 9, color: '#64748B', textAlign: 'center' }}>{c?.subheadline || 'Scan to explore paths'}</Text>
              </View>
              {c?.showSun !== false ? (
                <Svg width="44" height="44" viewBox="0 0 60 60" fill="none">
                  <Line x1="30" y1="4" x2="30" y2="10" stroke="#EF4444" strokeWidth="2" />
                  <Line x1="30" y1="50" x2="30" y2="56" stroke="#EF4444" strokeWidth="2" />
                  <Line x1="4" y1="30" x2="10" y2="30" stroke="#EF4444" strokeWidth="2" />
                  <Line x1="50" y1="30" x2="56" y2="30" stroke="#EF4444" strokeWidth="2" />
                  <Circle cx="30" cy="30" r="14" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
                  <Circle cx="26" cy="27" r="1.5" fill="#FFF" />
                  <Circle cx="34" cy="27" r="1.5" fill="#FFF" />
                  <Path d="M26 34 Q 30 38 34 34" stroke="#FFF" strokeWidth="1.5" fill="none" />
                </Svg>
              ) : <View style={{ width: 44 }} />}
            </View>

            <View style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: '#1E293B', marginVertical: 12, position: 'relative' }}>
              <View style={{ position: 'absolute', top: -8, left: -8, width: 22, height: 22, borderRadius: 5, backgroundColor: '#10B981', borderWidth: 1, borderColor: '#000', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 10 }}>🚩</Text></View>
              <View style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#000', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 10, color: '#FFF' }}>▲</Text></View>
              <View style={{ position: 'absolute', bottom: -8, left: -8, width: 22, height: 22, borderRadius: 5, backgroundColor: '#0EA5E9', borderWidth: 1, borderColor: '#000', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 10 }}>🌊</Text></View>
              <StyledQR value={content} size={160} fgColor="#1E293B" showCenterLogo={showLogo} />
            </View>

            <View style={{ width: '100%', borderTopWidth: 2, borderTopColor: '#1E293B', paddingTop: 6 }}>
              <Svg width="100%" height="36" viewBox="0 0 300 40" fill="none">
                <Path d="M22 36 L 22 14 Q 22 10 26 10 Q 30 10 30 14 L 30 36" fill="#10B981" stroke="#1E293B" strokeWidth="1.5" />
                <Polygon points="75,36 95,12 115,36" fill="#FDE047" stroke="#1E293B" strokeWidth="1.5" />
                <Path d="M147 32 Q 155 30 161 34 C 163 30 159 22 165 20 Q 167 18 169 20 Q 171 22 167 26 Q 171 32 165 36 L 149 36 Z" fill="#FBCFE8" stroke="#1E293B" strokeWidth="1.2" />
                <Path d="M265 36 L 265 20 Q 265 16 269 16 Q 273 16 273 20 L 273 36" fill="#10B981" stroke="#1E293B" strokeWidth="1.5" />
                <Circle cx="288" cy="28" r="4" fill="#F43F5E" stroke="#1E293B" strokeWidth="1.2" />
              </Svg>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                <Text style={{ fontSize: 8.5, fontWeight: '900', color: '#64748B' }}>{c?.bottomTag || 'ORIGINAL ARTWORK / 01'}</Text>
                <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#EF4444' }}>{config.brandName || 'getaipilot.in'}</Text>
              </View>
            </View>
          </View>
        );
      }

      /* 20. LUXURY FLORAL REVIEW */
      case 'floral-review': {
        const c = config.floralReview || ({} as any);
        const toneMap: Record<string, { bg: string; text: string; sub: string; prompt: string }> = {
          'dove-gray': { bg: '#D0D5D8', text: '#1A1B1D', sub: '#282A2D', prompt: '#34383D' },
          'sage-mist': { bg: '#D5DED6', text: '#1C221D', sub: '#263028', prompt: '#333F35' },
          alabaster: { bg: '#F5F1E8', text: '#241E17', sub: '#382F25', prompt: '#4A3F33' },
          obsidian: { bg: '#181A1C', text: '#FFFFFF', sub: '#E4E4E7', prompt: '#D4D4D8' },
        };
        const foilMap: Record<string, { star: string; foil: string }> = {
          gold: { star: '#D4AF37', foil: '#9D7D52' },
          rosegold: { star: '#C47A7A', foil: '#A86565' },
          'rose-gold': { star: '#C47A7A', foil: '#A86565' },
          silver: { star: '#94A3B8', foil: '#64748B' },
        };
        const t = toneMap[c.cardTone || 'dove-gray'] || toneMap['dove-gray'];
        const f = foilMap[c.accentFoil || 'gold'] || foilMap.gold;
        const names = (c.signatureName || 'GetAiPilot Team').trim().split(' ');

        return (
          <View style={[s.cardBase, { backgroundColor: t.bg, width: 320, borderRadius: 32, padding: 20 }]}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: t.text, letterSpacing: 4 }}>{c.headerTitle || 'PLEASE'}</Text>
            <Text style={{ fontSize: 16, fontStyle: 'italic', color: t.sub, marginBottom: 10 }}>{c.scriptSubtitle || 'leave us a review'}</Text>
            <View style={{ width: 205, height: 205, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={TEMPLATE_COMPONENT_ASSETS.floralBouquet} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12 }}>
                <StyledQR value={content} size={126} fgColor="#1A1A1A" showCenterLogo={showLogo} />
              </View>
            </View>
            <Text style={{ fontSize: 10.5, color: t.prompt, textAlign: 'center', marginTop: 10, maxWidth: 240 }}>
              {c.promptText || 'Please scan the QR code to review us and help spread the word!'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 5, marginTop: 6 }}>
              {Array.from({ length: c.ratingStars || 5 }).map((_, i) => (
                <Ionicons key={i} name="star" size={15} color={f.star} />
              ))}
            </View>
            <View style={{ width: '100%', alignItems: 'flex-end', marginTop: 8 }}>
              <Text style={{ fontSize: 11, fontStyle: 'italic', color: f.foil }}>by {names[0] || 'GetAiPilot'}</Text>
              <Text style={{ fontSize: 12, fontWeight: '900', color: f.foil, letterSpacing: 3 }}>{(names.slice(1).join(' ') || 'TEAM').toUpperCase()}</Text>
              {c.socialHandle ? <Text style={{ fontSize: 8.5, color: f.foil }}>{c.socialHandle}</Text> : null}
            </View>
          </View>
        );
      }

      /* 21. BOTANICAL BLOOM ON STEM */
      case 'blooming-flower': {
        const c = config.bloomingFlower;
        return (
          <View style={[s.cardBase, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, width: 320, borderRadius: 32, padding: 20 }]}>
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 10, position: 'relative' }}>
              <View style={{ position: 'absolute', top: -10, left: -10, width: 54, height: 54, borderTopLeftRadius: 24, borderBottomRightRadius: 10, backgroundColor: '#FDE2E4', borderWidth: 1, borderColor: '#F8C6CB' }} />
              <View style={{ position: 'absolute', top: -10, right: -10, width: 54, height: 54, borderTopRightRadius: 24, borderBottomLeftRadius: 10, backgroundColor: '#FDE2E4', borderWidth: 1, borderColor: '#F8C6CB' }} />
              <View style={{ position: 'absolute', bottom: -10, left: -10, width: 54, height: 54, borderBottomLeftRadius: 24, borderTopRightRadius: 10, backgroundColor: '#FDE2E4', borderWidth: 1, borderColor: '#F8C6CB' }} />
              <View style={{ position: 'absolute', bottom: -10, right: -10, width: 54, height: 54, borderBottomRightRadius: 24, borderTopLeftRadius: 10, backgroundColor: '#FDE2E4', borderWidth: 1, borderColor: '#F8C6CB' }} />
              <View style={{ padding: 10, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F8C6CB', zIndex: 2 }}>
                <StyledQR value={content} size={156} fgColor="#C22B1E" showCenterLogo={showLogo} />
              </View>
            </View>
            <View style={{ width: 4, height: 76, backgroundColor: '#4A7C59', borderRadius: 2, position: 'relative' }}>
              <View style={{ position: 'absolute', bottom: 16, left: -34, width: 36, height: 22, backgroundColor: '#74A84A', borderTopLeftRadius: 20, borderBottomRightRadius: 20, borderWidth: 1, borderColor: '#4A7C59', transform: [{ rotate: '-12deg' }] }} />
              <View style={{ position: 'absolute', bottom: 8, right: -38, width: 40, height: 24, backgroundColor: '#87B85D', borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderWidth: 1, borderColor: '#4A7C59', transform: [{ rotate: '12deg' }] }} />
            </View>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {config.logoUrl ? (
                  <Image source={{ uri: config.logoUrl }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                ) : (
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#DC2626', borderWidth: 1, borderColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12 }}>🐞</Text>
                  </View>
                )}
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#1C1917' }}>{c?.brandName || config.brandName || 'GetAiPilot'}</Text>
                  <Text style={{ fontSize: 8, fontWeight: '800', color: '#4A7C59', letterSpacing: 1.5 }}>{c?.tagline || 'ORGANIC ESSENCE'}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 8.5, fontWeight: '700', color: '#94A3B8' }}>SCAN TO BLOOM</Text>
            </View>
          </View>
        );
      }

      /* 22. PLUSH CHARACTER */
      case 'plush-character': {
        const c = config.plushCharacter;
        return (
          <View style={[s.cardBase, { backgroundColor: '#FBF6EE', borderColor: '#EDE3D4', borderWidth: 1, width: 320, borderRadius: 32, padding: 20, alignItems: 'flex-start' }]}>
            <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#93785D', letterSpacing: 2 }}>{c?.brandTag || 'GETAIPILOT'}</Text>
            <Text style={{ fontSize: 22, color: '#2C241E', marginTop: 2 }}>{c?.headline || 'QR codes. With character.'}</Text>
            <Text style={{ fontSize: 10.5, color: '#6F5E51', marginTop: 4 }}>{c?.subheadline || 'Turn everyday links into something memorable.'}</Text>

            <View style={{ width: '100%', alignItems: 'center', marginVertical: 14 }}>
              <LinearGradient colors={['#FDE68A', '#FCD34D', '#FBBF24']} style={{ padding: 12, borderRadius: 24, borderWidth: 4, borderColor: '#FEF08A' }}>
                <View style={{ padding: 8, backgroundColor: '#FEF9C3', borderRadius: 16 }}>
                  <StyledQR value={content} size={154} fgColor="#3B2210" bgColor="#FEF9C3" showCenterLogo={showLogo} />
                </View>
              </LinearGradient>
            </View>

            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: '#2C241E' }}>{c?.ctaText || 'Scan to see more.'}</Text>
              <Svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <Path d="M10 32 C 14 24, 28 26, 26 14 C 24 8, 30 6, 28 2" stroke="#8D7055" strokeWidth="2.2" strokeLinecap="round" />
                <Path d="M22 6 L 28 2 L 32 8" stroke="#8D7055" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EDE3D4', paddingTop: 8, marginTop: 10 }}>
              <Text style={{ fontSize: 8, fontWeight: '700', color: '#93785D' }}>{c?.footerTag || 'ARTISTIC QR CODES'}</Text>
              <Text style={{ fontSize: 8.5, fontWeight: '900', color: '#3B2210' }}>{config.brandName || 'getaipilot.in'}</Text>
            </View>
          </View>
        );
      }

      /* 23. CLASSIC */
      case 'classic':
      default: {
        return (
          <View style={[s.cardBase, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', width: 290, borderRadius: 26, padding: 22 }]}>
            {config.brandName ? (
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B', letterSpacing: 1.2, marginBottom: 10 }}>
                {config.brandName.toUpperCase()}
              </Text>
            ) : null}
            <View style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
              <StyledQR value={content} size={180} fgColor={fgColor} bgColor={qrStyles.bgColor || '#FFFFFF'} showCenterLogo={showLogo} />
            </View>
            <Text style={{ fontSize: 10.5, fontWeight: '600', color: '#64748B', marginTop: 10 }}>
              Scan with your smartphone camera
            </Text>
          </View>
        );
      }
    }
  };

  if (scale === 1) {
    return <View style={s.container}>{renderInner()}</View>;
  }

  return (
    <View style={[s.container, { transform: [{ scale }] }]}>
      {renderInner()}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBase: {
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
});
