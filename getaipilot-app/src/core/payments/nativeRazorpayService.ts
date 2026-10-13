import { Alert, NativeModules, Platform } from 'react-native';
import type {
  RazorpayErrorData,
  RazorpayOptions,
  RazorpaySuccessData,
} from 'react-native-razorpay';
import { RazorpayApiService } from './razorpayService';
import { RazorpayCheckoutOptions, RazorpaySuccessResponse } from './types';

export class NativeRazorpayService {
  /**
   * Checks whether the native Razorpay SDK module is available in the current runtime
   */
  public static isNativeSdkAvailable(): boolean {
    if (Platform.OS === 'web') return false;
    return Boolean(NativeModules.RNRazorpayCheckout);
  }

  /**
   * Launches the official native Razorpay SDK checkout flow
   * Returns true if handled by native SDK, false if fallback modal should be used
   */
  public static async launchNativeCheckout(
    options: RazorpayCheckoutOptions,
    userInfo?: { id?: string; email?: string; name?: string; phone?: string }
  ): Promise<boolean> {
    if (!this.isNativeSdkAvailable()) {
      return false;
    }

    try {
      // Load the SDK only when its native module exists; web and Expo Go retain the modal fallback.
      const { default: RazorpayCheckout } = await import("react-native-razorpay");
      // 1. Fetch Gateway Config
      const config = await RazorpayApiService.getConfig();

      // 2. Initialize Verified Razorpay Order from BFF
      const order = await RazorpayApiService.createOrder({
        amount: options.amount,
        currency: options.currency || config.currency || 'INR',
        product: options.product || 'ecosystem',
        planId: options.planId,
        planName: options.planName,
        billingInterval: options.billingInterval,
        notes: options.notes,
      });

      const keyId = order.keyId || config.keyId;
      if (!keyId) {
        console.warn('[NativeRazorpay] No Razorpay keyId found, falling back to modal');
        return false;
      }

      // 3. Prepare Native SDK parameters
      const sdkOptions: RazorpayOptions = {
        description: options.description || `${options.planName} Subscription`,
        image: 'https://getaipilot.in/assets/images/logo.png',
        currency: options.currency || config.currency || 'INR',
        key: keyId,
        amount: order.amountInPaise || options.amount * 100,
        name: config.merchantName || 'GetAiPilot',
        order_id: order.orderId,
        prefill: {
          email: options.prefill?.email || userInfo?.email || '',
          contact: options.prefill?.contact || userInfo?.phone || '',
          name: options.prefill?.name || userInfo?.name || '',
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

      // 4. Invoke Native Razorpay Checkout
      const data: RazorpaySuccessData = await RazorpayCheckout.open(sdkOptions);

      // 5. Cryptographic Verification with BFF
      let verifiedResult: RazorpaySuccessResponse;
      try {
        verifiedResult = await RazorpayApiService.verifyPayment({
          orderId: data.razorpay_order_id || order.orderId,
          paymentId: data.razorpay_payment_id,
          signature: data.razorpay_signature,
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
      // If user cancelled, dismiss
      const errorData = err as RazorpayErrorData;
      console.warn('[NativeRazorpay] Payment cancelled or error:', errorData);

      if (errorData?.code === 0 || errorData?.description?.includes('cancelled')) {
        if (options.onDismiss) {
          options.onDismiss();
        }
        return true; // Successfully handled dismissal by native SDK
      }

      if (options.onFailure) {
        options.onFailure(err);
      } else {
        Alert.alert("Payment could not be completed", errorData?.description || "Please check your connection and try again.");
      }
      return true;
    }
  }
}
