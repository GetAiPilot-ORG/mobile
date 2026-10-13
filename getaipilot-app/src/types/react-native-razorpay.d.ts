declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    description?: string;
    image?: string;
    currency: string;
    key: string;
    amount: number | string;
    name: string;
    order_id?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    notes?: Record<string, string>;
    modal?: {
      confirm_close?: boolean;
      ondismiss?: () => void;
      animation?: boolean;
    };
  }

  export interface RazorpaySuccessData {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayErrorData {
    code: number;
    description: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }

  export default class RazorpayCheckout {
    static open(
      options: RazorpayOptions,
      successCallback?: (data: RazorpaySuccessData) => void,
      errorCallback?: (error: RazorpayErrorData) => void
    ): Promise<RazorpaySuccessData>;
    static onExternalWalletSelection(
      externalWalletCallback: (data: any) => void
    ): void;
  }
}
