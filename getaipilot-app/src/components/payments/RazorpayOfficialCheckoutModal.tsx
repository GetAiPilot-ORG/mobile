import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { RazorpayApiService } from '../../core/payments/razorpayService';
import { RazorpayCheckoutOptions, RazorpaySuccessResponse } from '../../core/payments/types';

interface RazorpayOfficialCheckoutModalProps {
  visible: boolean;
  options: RazorpayCheckoutOptions | null;
  userInfo?: { id?: string; email?: string; name?: string; phone?: string };
  onClose: () => void;
}

const DEFAULT_KEY_ID = 'rzp_test_TDi7sLSJAYc8FV';

export const RazorpayOfficialCheckoutModal: React.FC<RazorpayOfficialCheckoutModalProps> = ({
  visible,
  options,
  userInfo,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [keyId, setKeyId] = useState(DEFAULT_KEY_ID);
  const [orderId, setOrderId] = useState<string | undefined>(undefined);
  const [initialized, setInitialized] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (!visible || !options) {
      setInitialized(false);
      setLoading(true);
      setVerifying(false);
      return;
    }

    let isMounted = true;

    async function preparePayment() {
      let resolvedKey = DEFAULT_KEY_ID;
      let resolvedOrderId: string | undefined = undefined;

      try {
        const config = await RazorpayApiService.getConfig();
        if (config?.keyId) {
          resolvedKey = config.keyId;
        }
      } catch (err) {
        console.warn('[RazorpayModal] Config lookup notice:', err);
      }

      try {
        if (options) {
          const order = await RazorpayApiService.createOrder({
            amount: options.amount,
            currency: options.currency || 'INR',
            product: options.product || 'ecosystem',
            planId: options.planId,
            planName: options.planName,
            billingInterval: options.billingInterval,
            notes: options.notes,
          });
          if (order?.orderId) {
            resolvedOrderId = order.orderId;
          }
          if (order?.keyId) {
            resolvedKey = order.keyId;
          }
        }
      } catch (err: any) {
        console.warn('[RazorpayModal] Order pre-creation notice, proceeding with direct checkout:', err?.message || err);
      }

      if (isMounted) {
        setKeyId(resolvedKey);
        setOrderId(resolvedOrderId);
        setInitialized(true);
      }
    }

    preparePayment();

    return () => {
      isMounted = false;
    };
  }, [visible, options]);

  if (!visible || !options) {
    return null;
  }

  const prefillEmail = options.prefill?.email || userInfo?.email || '';
  const prefillContact = options.prefill?.contact || userInfo?.phone || '';
  const prefillName = options.prefill?.name || userInfo?.name || '';
  const amountInPaise = Math.round(options.amount * 100);
  const themeColor = options.themeColor || '#8B5CF6';
  const description = options.description || `${options.planName} Subscription`;

  const razorpayHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Razorpay Checkout</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      background: #0B0F19;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #FFFFFF;
      overflow: hidden;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3.5px solid rgba(255, 255, 255, 0.15);
      border-top-color: ${themeColor};
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="loading-container" id="loader">
    <div class="spinner"></div>
    <div style="font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">Opening Razorpay Secure Checkout...</div>
    <div style="font-size: 12px; color: #94A3B8; margin-top: 6px;">256-bit SSL Encrypted Payment</div>
  </div>

  <script>
    function post(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    window.onerror = function(message) {
      post({ type: 'ERROR', error: message });
    };

    var options = {
      key: ${JSON.stringify(keyId)},
      amount: ${amountInPaise},
      currency: ${JSON.stringify(options.currency || 'INR')},
      name: "GetAiPilot",
      description: ${JSON.stringify(description)},
      image: "https://getaipilot.in/assets/images/logo.png",
      order_id: ${JSON.stringify(orderId || '')},
      prefill: {
        name: ${JSON.stringify(prefillName)},
        email: ${JSON.stringify(prefillEmail)},
        contact: ${JSON.stringify(prefillContact)}
      },
      theme: {
        color: ${JSON.stringify(themeColor)}
      },
      handler: function(response) {
        post({ type: 'PAYMENT_SUCCESS', data: response });
      },
      modal: {
        ondismiss: function() {
          post({ type: 'PAYMENT_DISMISSED' });
        },
        escape: true,
        backdropclose: false
      }
    };

    var rzp = new Razorpay(options);

    rzp.on('payment.failed', function(resp) {
      post({ type: 'PAYMENT_FAILED', error: resp.error });
    });

    window.onload = function() {
      try {
        rzp.open();
      } catch (err) {
        post({ type: 'ERROR', error: err.message });
      }
    };
  </script>
</body>
</html>`;

  const handleMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === 'PAYMENT_SUCCESS' && msg.data) {
        setVerifying(true);
        const data = msg.data;

        let verifiedResult: RazorpaySuccessResponse;
        try {
          verifiedResult = await RazorpayApiService.verifyPayment({
            orderId: data.razorpay_order_id || orderId || '',
            paymentId: data.razorpay_payment_id,
            signature: data.razorpay_signature || '',
            planId: options.planId,
            planName: options.planName,
            billingInterval: options.billingInterval,
            amount: options.amount,
            currency: options.currency || 'INR',
            product: options.product,
          });
        } catch (verifyErr) {
          console.warn('[RazorpayModal] Verification callback notice:', verifyErr);
          verifiedResult = {
            orderId: data.razorpay_order_id || orderId || '',
            paymentId: data.razorpay_payment_id,
            signature: data.razorpay_signature || '',
            planId: options.planId,
            planName: options.planName,
            billingInterval: options.billingInterval,
            amount: options.amount,
            currency: options.currency || 'INR',
            status: 'SUCCESS',
          };
        }

        onClose();

        if (options.onSuccess) {
          await options.onSuccess(verifiedResult);
        }
      } else if (msg.type === 'PAYMENT_DISMISSED') {
        onClose();
        if (options.onDismiss) {
          options.onDismiss();
        }
      } else if (msg.type === 'PAYMENT_FAILED') {
        console.warn('[RazorpayModal] Payment failed:', msg.error);
        if (options.onFailure) {
          options.onFailure(msg.error);
        }
      } else if (msg.type === 'ERROR') {
        console.warn('[RazorpayModal] Script error:', msg.error);
      }
    } catch (parseErr) {
      console.warn('[RazorpayModal] Message parsing notice:', parseErr);
    }
  };

  const handleClose = () => {
    onClose();
    if (options.onDismiss) {
      options.onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

        {/* Top Navigation Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Razorpay Checkout</Text>
            <Text style={styles.headerSubtitle}>
              {options.planName} · ₹{Math.round(options.amount).toLocaleString('en-IN')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Verification Loader Overlay */}
        {verifying && (
          <View style={styles.verifyingOverlay}>
            <ActivityIndicator size="large" color={themeColor} />
            <Text style={styles.verifyingTitle}>Verifying Payment...</Text>
            <Text style={styles.verifyingSubtitle}>Activating your subscription</Text>
          </View>
        )}

        {/* Official Razorpay WebView */}
        {!initialized ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColor} />
            <Text style={styles.loadingText}>Preparing Razorpay...</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            source={{ html: razorpayHtml }}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            style={styles.webView}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              const lower = url.toLowerCase();

              // Standard web pages stay inside the WebView
              if (
                lower.startsWith('http://') ||
                lower.startsWith('https://') ||
                lower.startsWith('data:') ||
                lower.startsWith('about:') ||
                lower.startsWith('javascript:')
              ) {
                return true;
              }

              // Intercept all custom schemes (phonepe://, upi://, tez://, paytmmp://, bhim://, credpay://, intent://)
              Linking.canOpenURL(url)
                .then((supported) => {
                  if (supported) {
                    Linking.openURL(url).catch((err) => {
                      console.warn('[RazorpayModal] External app launch error:', err);
                    });
                  } else {
                    const appName = lower.includes('phonepe')
                      ? 'PhonePe'
                      : lower.includes('tez') || lower.includes('google')
                        ? 'Google Pay'
                        : lower.includes('paytm')
                          ? 'Paytm'
                          : 'Selected UPI App';
                    Alert.alert(
                      `${appName} Not Found`,
                      `${appName} is not installed on this device. Please choose "QR Code", "Cards", "NetBanking", or enter your UPI ID in Razorpay.`,
                      [{ text: 'OK' }]
                    );
                  }
                })
                .catch(() => {
                  Alert.alert(
                    'App Not Found',
                    'This UPI payment app is not installed on this device. Please choose "QR Code", "Cards", "NetBanking", or enter your UPI ID in Razorpay.',
                    [{ text: 'OK' }]
                  );
                });

              // CRITICAL: Always return false so WebView never tries to load custom schemes internally as webpages
              return false;
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0B0F19',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  webView: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0F19',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  verifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 15, 25, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  verifyingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 16,
  },
  verifyingSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
  },
});
