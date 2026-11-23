import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import QRCode from 'react-native-qrcode-svg';
import { SvgXml } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { CanvasConfig, CanvasTemplateId, QRStyles, QRType } from './types';
import { buildCanvasHtml } from './htmlCanvasRenderer';
import { NativeCanvasTemplate } from './NativeCanvasTemplate';
import { TEMPLATE_RASTER_IMAGES, TEMPLATE_SVG_STRINGS } from './templateAssets';
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

  const [previewMode, setPreviewMode] = useState<'canvas' | 'poster' | 'pure-qr'>('canvas');
  const [isExporting, setIsExporting] = useState(false);

  const webViewRef = useRef<any>(null);
  const qrSvgRef = useRef<any>(null);

  // Generate HTML for the Standee Canvas
  const htmlContent = useMemo(() => {
    return buildCanvasHtml(canvasId, config, qrStyles, qrContent);
  }, [canvasId, config, qrStyles, qrContent]);

  // Handle Export / Download 300 DPI PNG
  const handleExportCanvas = () => {
    if (previewMode === 'pure-qr') {
      handleExportPureQr();
      return;
    }

    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Call html2canvas inside WebView
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

  // Handle Pure QR code export via react-native-qrcode-svg
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

  // WebView Message Listener for Export
  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
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
      console.warn('[CanvasPreview] Error processing export message:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Content / Link to clipboard
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
        {/* Toggle Pill: Standee Mockup vs Pure QR */}
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
              previewMode === 'poster' && [
                styles.toggleBtnActive,
                { backgroundColor: '#0A4737' },
              ],
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPreviewMode('poster');
            }}
          >
            <Ionicons
              name="image-outline"
              size={14}
              color={previewMode === 'poster' ? '#FFFFFF' : colors.mutedForeground}
            />
            <Text
              style={[
                styles.toggleBtnText,
                {
                  color: previewMode === 'poster' ? '#FFFFFF' : colors.mutedForeground,
                  fontWeight: previewMode === 'poster' ? '700' : '500',
                },
              ]}
            >
              Design
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

        {/* Quick Action: Copy Link */}
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
        {previewMode === 'poster' ? (
          /* High-Resolution Studio Poster Design from getaipilot.in */
          <View style={styles.posterContainer}>
            {TEMPLATE_SVG_STRINGS[canvasId] ? (
              <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <SvgXml xml={TEMPLATE_SVG_STRINGS[canvasId]} width="100%" height="100%" />
              </View>
            ) : TEMPLATE_RASTER_IMAGES[canvasId] ? (
              <Image
                source={TEMPLATE_RASTER_IMAGES[canvasId]}
                style={styles.fullPosterImage}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={TEMPLATE_RASTER_IMAGES['bold-retail-promo']}
                style={styles.fullPosterImage}
                resizeMode="contain"
              />
            )}
          </View>
        ) : previewMode === 'canvas' ? (
          /* True-to-life Standee Mockup Rendered via HTML/CSS Studio Canvas matching getaipilot.in */
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: htmlContent }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              style={styles.webView}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ) : (
          /* Pure Standalone Vector QR Code Card */
          <View
            style={[
              styles.pureQrCard,
              {
                backgroundColor: isDark ? '#1C1B24' : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.qrShadowBox}>
              <QRCode
                value={qrContent || 'https://getaipilot.in'}
                size={210}
                color={qrStyles.fgColor || '#000000'}
                backgroundColor={qrStyles.bgColor || '#FFFFFF'}
                getRef={(ref) => (qrSvgRef.current = ref)}
              />
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
        {/* Download 300 DPI Canvas */}
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

        {/* Save to Dashboard */}
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
  posterContainer: {
    width: '100%',
    height: 480,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  fullPosterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  nativeMockupViewport: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  webViewContainer: {
    width: '100%',
    height: 530,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
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
