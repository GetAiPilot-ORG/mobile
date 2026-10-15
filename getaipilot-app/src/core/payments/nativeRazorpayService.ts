import { Alert, NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import RazorpayCheckout, {
  RazorpayErrorData,
  RazorpayOptions,
  RazorpaySuccessData,
} from 'react-native-razorpay';
import { RazorpayApiService } from './razorpayService';
import { RazorpayCheckoutOptions, RazorpaySuccessResponse } from './types';

const DEFAULT_KEY_ID = 'rzp_test_TDi7sLSJAYc8FV';

export class NativeRazorpayService {
  /**
   * Checks whether the native Razorpay SDK module is available in the current runtime.
   * Returns false in Expo Go, Waydroid without native build, or Web.
   */
  public static isNativeSdkAvailable(): boolean {
    if (Platform.OS === 'web') return false;
    try {
      if (NativeModules?.RNRazorpayCheckout && typeof NativeModules.RNRazorpayCheckout.open === 'function') {
        return true;
      }
      if (typeof TurboModuleRegistry !== 'undefined' && TurboModuleRegistry?.get) {
        const turbo: any = TurboModuleRegistry.get('RNRazorpayCheckout');
        if (turbo && typeof turbo.open === 'function') {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * Attempts to launch native SDK checkout if compiled into the application binary.
   * Returns true if native SDK handled checkout, false if fallback in-app modal should take over.
   */
  public static async launchCheckout(
    options: RazorpayCheckoutOptions,
    userInfo?: { id?: string; email?: string; name?: string; phone?: string }
  ): Promise<boolean> {
    if (!this.isNativeSdkAvailable()) {
      return false;
    }

    let keyId = DEFAULT_KEY_ID;
    let orderId: string | undefined = undefined;

    try {
      // Load the SDK only when its native module exists; web and Expo Go retain the modal fallback.
      const { default: RazorpayCheckout } = await import("react-native-razorpay");
      // 1. Fetch Gateway Config
      const config = await RazorpayApiService.getConfig();
      if (config?.keyId) {
        keyId = config.keyId;
      }
    } catch (configErr) {
      console.warn('[Razorpay] Config lookup notice:', configErr);
    }

    try {
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
        orderId = order.orderId;
      }
      if (order?.keyId) {
        keyId = order.keyId;
      }
    } catch (orderErr: any) {
      console.warn('[Razorpay] Backend order notice, proceeding with direct checkout:', orderErr?.message || orderErr);
    }

    try {
      return await this.launchNativeSdk(options, keyId, orderId, userInfo);
    } catch (nativeErr: any) {
      console.warn('[Razorpay] Native SDK run notice, falling back to in-app checkout:', nativeErr?.message || nativeErr);
      return false;
    }
  }

  /**
   * Official react-native-razorpay native SDK checkout
   */
  public static async launchNativeSdk(
    options: RazorpayCheckoutOptions,
    keyId: string,
    orderId?: string,
    userInfo?: { id?: string; email?: string; name?: string; phone?: string }
  ): Promise<boolean> {
    const prefillEmail = options.prefill?.email || userInfo?.email || '';
    const prefillContact = options.prefill?.contact || userInfo?.phone || '';
    const prefillName = options.prefill?.name || userInfo?.name || '';
    const amountInPaise = Math.round(options.amount * 100);

    const sdkOptions: RazorpayOptions = {
      description: options.description || `${options.planName} Subscription`,
      image: 'https://getaipilot.in/assets/images/logo.png',
      currency: options.currency || 'INR',
      key: keyId,
      amount: amountInPaise,
      name: 'GetAiPilot',
      order_id: orderId,
      prefill: {
        email: prefillEmail,
        contact: prefillContact,
        name: prefillName,
      },
      theme: {
        color: options.themeColor || '#8B5CF6',
      },
      notes: {
        planId: options.planId,
        planName: options.planName,
        billingInterval: options.billingInterval,
        ...options.notes,
      },
    };

    try {
      const data: RazorpaySuccessData = await RazorpayCheckout.open(sdkOptions);

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
        // Never report a payment as successful before the server verifies it.
        console.warn('[NativeRazorpay] Payment verification failed:', verifyErr);
        if (options.onFailure) options.onFailure(verifyErr);
        else Alert.alert("Payment confirmation failed", "We couldn’t confirm this payment. Check your payment history before trying again.");
        return true;
      }

      if (options.onSuccess) {
        await options.onSuccess(verifiedResult);
      }
      return true;
    } catch (err: any) {
      const errorData = err as RazorpayErrorData;
      console.warn('[Razorpay] Native payment notice:', errorData);

      if (errorData?.code === 0 || errorData?.description?.toLowerCase().includes('cancel')) {
        if (options.onDismiss) {
          options.onDismiss();
        }
        return true;
      }

      if (err?.message?.includes('null') || err?.message?.includes('open')) {
        // Native module not initialized in current binary
        throw err;
      }

      if (options.onFailure) {
        options.onFailure(err);
      } else {
        Alert.alert('Payment Incomplete', errorData?.description || err?.message || 'Payment was not completed.');
      }
      return false;
    }
  }

  /**
   * Backwards compatibility alias
   */
  public static async launchNativeCheckout(
    options: RazorpayCheckoutOptions,
    userInfo?: { id?: string; email?: string; name?: string; phone?: string }
  ): Promise<boolean> {
    return this.launchCheckout(options, userInfo);
  }
}
