import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { CanvasConfig, CanvasTemplateId, QRStyles, QRType } from './types';
import { buildCanvasHtml } from './htmlCanvasRenderer';
import { GetAiPilotVectorLogo } from './NativeCanvasTemplate';
import { useTheme, getColors } from '@/theme';

interface CanvasPreviewProps {
  canvasId: CanvasTemplateId;
  config: CanvasConfig;
  styles: QRStyles;
  qrContent: string;
  qrType: QRType;
  title: string;
  onSaveToDashboard: () => Promise<void>;
  isSaving: boolean;
  isSaved: boolean;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  canvasId,
  config,
  styles: qrStyles,
  qrContent,
  qrType,
  title,
  onSaveToDashboard,
  isSaving,
  isSaved,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [previewMode, setPreviewMode] = useState<'canvas' | 'pure-qr'>('canvas');
  const [isExporting, setIsExporting] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState<number>(580);

  const webViewRef = useRef<any>(null);
  const qrSvgRef = useRef<any>(null);
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [laserAnim]);

  const htmlContent = useMemo(() => {
    return buildCanvasHtml(canvasId, config, qrStyles, qrContent);
  }, [canvasId, config, qrStyles, qrContent]);

  const handleExportCanvas = () => {
    if (previewMode === 'pure-qr') {
      handleExportPureQr();
      return;
    }

    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    webViewRef.current?.injectJavaScript(`
      if (typeof window.exportCanvas === 'function') {
        window.exportCanvas(3);
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'EXPORT_ERROR',
          error: 'Export engine not loaded yet. Please wait a second and retry.'
        }));
      }
      true;
    `);
  };

  const handleExportPureQr = () => {
    if (!qrSvgRef.current) return;
    setIsExporting(true);
    qrSvgRef.current.toDataURL(async (data: string) => {
      try {
        const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'qr-code'}-${Date.now()}.png`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: 'Share QR Code',
          });
        } else {
          Alert.alert('Saved!', 'QR Code image saved to cache.');
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        Alert.alert('Export Failed', err?.message || 'Could not save QR image');
      } finally {
        setIsExporting(false);
      }
    });
  };

  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'CANVAS_HEIGHT' && typeof data.height === 'number') {
        const clamped = Math.max(420, Math.min(820, Math.ceil(data.height)));
        setCanvasHeight(clamped);
        return;
      }
      if (data.type === 'EXPORT_SUCCESS' && data.dataUrl) {
        const base64Data = data.dataUrl.replace(/^data:image\/png;base64,/, '');
        const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'qr-standee'}-300dpi.png`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: 'Download 300 DPI Standee Print',
          });
        } else {
          Alert.alert('Success', 'Standee PNG saved to cache.');
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (data.type === 'EXPORT_ERROR') {
        Alert.alert('Export Error', data.error || 'Failed to render 300 DPI image');
      }
    } catch (err: any) {
      console.warn('[CanvasPreview] Error processing WebView message:', err);
    } finally {
      if (event.nativeEvent.data && !event.nativeEvent.data.includes('CANVAS_HEIGHT')) {
        setIsExporting(false);
      }
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(qrContent);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const label =
      qrType === 'vcard'
        ? 'Contact vCard copied!'
        : qrType === 'wifi'
        ? 'Wi-Fi credentials copied!'
        : 'QR destination URL copied!';
    Alert.alert('Copied!', label);
  };

  const fgColor = qrStyles.fgColor || '#000000';
  const bgColor = qrStyles.bgColor || '#FFFFFF';
  const showCenterLogo = config.showCenterLogo !== false;
  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 200],
  });

  return (
    <View style={styles.container}>
      {/* Top Preview Control Bar */}
      <View
        style={[
          styles.controlBar,
          {
            backgroundColor: isDark ? '#1C1B24' : '#F8FAFC',
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.togglePill,
            {
              backgroundColor: isDark ? '#121118' : '#E2E8F0',
              borderColor: colors.border,
            },
          ]}
        >
          <Pressable
            style={[
              styles.toggleBtn,
              previewMode === 'canvas' && [
                styles.toggleBtnActive,
                { backgroundColor: '#0A4737' },
              ],
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPreviewMode('canvas');
            }}
          >
            <Ionicons
              name="easel-outline"
              size={14}
              color={previewMode === 'canvas' ? '#FFFFFF' : colors.mutedForeground}
            />
            <Text
              style={[
                styles.toggleBtnText,
                {
                  color: previewMode === 'canvas' ? '#FFFFFF' : colors.mutedForeground,
                  fontWeight: previewMode === 'canvas' ? '700' : '500',
                },
              ]}
            >
              Standee
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toggleBtn,
              previewMode === 'pure-qr' && [
                styles.toggleBtnActive,
                { backgroundColor: '#0A4737' },
              ],
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPreviewMode('pure-qr');
            }}
          >
            <Ionicons
              name="qr-code-outline"
              size={14}
              color={previewMode === 'pure-qr' ? '#FFFFFF' : colors.mutedForeground}
            />
            <Text
              style={[
                styles.toggleBtnText,
                {
                  color: previewMode === 'pure-qr' ? '#FFFFFF' : colors.mutedForeground,
                  fontWeight: previewMode === 'pure-qr' ? '700' : '500',
                },
              ]}
            >
              Pure QR
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.copyBtn,
            {
              backgroundColor: isDark ? '#262435' : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
          onPress={handleCopy}
        >
          <Ionicons name="copy-outline" size={15} color={colors.foreground} />
          <Text style={[styles.copyBtnText, { color: colors.foreground }]}>
            Copy Link
          </Text>
        </Pressable>
      </View>

      {/* Main Preview Viewport */}
      <View
        style={[
          styles.viewportCard,
          {
            backgroundColor: isDark ? '#14131C' : '#F1F5F9',
            borderColor: colors.border,
          },
        ]}
      >
        {previewMode === 'canvas' ? (
          <View style={[styles.webViewContainer, { height: canvasHeight }]}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: htmlContent }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              style={styles.webView}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ) : (
          <View
            style={[
              styles.pureQrCard,
              {
                backgroundColor: isDark ? '#1C1B24' : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.qrShadowBox, { backgroundColor: bgColor }]}>
              <View style={styles.pureQrInnerWrap}>
                <QRCode
                  value={qrContent || 'https://getaipilot.in'}
                  size={210}
                  color={fgColor}
                  backgroundColor={bgColor}
                  ecl="H"
                  getRef={(ref) => (qrSvgRef.current = ref)}
                />

                {showCenterLogo && (
                  <View style={[styles.centerLogoWrap, { backgroundColor: bgColor }]}>
                    <GetAiPilotVectorLogo size={38} color={fgColor} />
                  </View>
                )}

                {/* Animated Emerald Corner Reticles */}
                <View pointerEvents="none" style={styles.reticleBox}>
                  <View style={[styles.reticleCorner, styles.reticleTL]} />
                  <View style={[styles.reticleCorner, styles.reticleTR]} />
                  <View style={[styles.reticleCorner, styles.reticleBL]} />
                  <View style={[styles.reticleCorner, styles.reticleBR]} />
                </View>

                {/* Animated Laser Scan Beam */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.laserLine,
                    { transform: [{ translateY: laserTranslateY }] },
                  ]}
                />
              </View>
            </View>

            <View style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={[styles.pureQrBrand, { color: colors.foreground }]}>
                {config.brandName || 'GetAiPilot'}
              </Text>
              <Text
                style={[styles.pureQrLink, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {qrContent}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Primary Action Buttons Deck */}
      <View style={styles.actionDeck}>
        <Pressable
          style={[
            styles.downloadBtn,
            { backgroundColor: '#0A4737' },
            isExporting && { opacity: 0.7 },
          ]}
          onPress={handleExportCanvas}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.downloadBtnText}>Rendering 300 DPI Standee...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" />
              <Text style={styles.downloadBtnText}>
                {previewMode === 'canvas'
                  ? 'Download Print Canvas (300 DPI PNG)'
                  : 'Download QR Image (PNG)'}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.saveBtn,
            {
              backgroundColor: isSaved
                ? isDark
                  ? '#143126'
                  : '#ECFDF5'
                : isDark
                ? '#222030'
                : '#FFFFFF',
              borderColor: isSaved ? '#0A4737' : colors.border,
            },
          ]}
          onPress={onSaveToDashboard}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#0A4737" />
          ) : (
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? '#0A4737' : colors.foreground}
            />
          )}
          <Text
            style={[
              styles.saveBtnText,
              {
                color: isSaved ? '#0A4737' : colors.foreground,
                fontWeight: isSaved ? '800' : '600',
              },
            ]}
          >
            {isSaved ? 'Saved to Dashboard' : 'Save to Dashboard'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    gap: 12,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  togglePill: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  toggleBtnActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 11.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  copyBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  viewportCard: {
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 460,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  webViewContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pureQrCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  qrShadowBox: {
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  pureQrInnerWrap: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  centerLogoWrap: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBox: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
  },
  reticleCorner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#10B981',
  },
  reticleTL: { top: 0, left: 0, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 4 },
  reticleTR: { top: 0, right: 0, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4 },
  reticleBL: { bottom: 0, left: 0, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 4 },
  reticleBR: { bottom: 0, right: 0, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4 },
  laserLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#34D399',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
  pureQrBrand: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pureQrLink: {
    fontSize: 11,
    marginTop: 4,
    maxWidth: 220,
    textAlign: 'center',
  },
  actionDeck: {
    gap: 10,
    marginTop: 4,
  },
  downloadBtn: {
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  saveBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    fontSize: 13,
  },
});
