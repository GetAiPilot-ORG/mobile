import { apiClient } from '../api/client';
import {
  RazorpayConfig,
  RazorpayOrder,
  RazorpaySuccessResponse,
  RazorpayQrCode,
  CreateQrParams,
  VerifyQrNumberParams,
  QrStatusResponse,
  PaymentInterval,
} from './types';

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  product?: string;
  planId: string;
  planName: string;
  billingInterval: PaymentInterval;
  notes?: Record<string, string>;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: string;
  planName: string;
  billingInterval: PaymentInterval;
  amount: number;
  currency?: string;
  product?: string;
  isTestMode?: boolean;
}

export class RazorpayApiService {
  /**
   * Fetches gateway metadata and key from BFF
   */
  public static async getConfig(): Promise<RazorpayConfig> {
    try {
      const config = await apiClient.get<RazorpayConfig>('/mobile/v1/payments/razorpay/config');
      return (
        config || {
          keyId: '',
          currency: 'INR',
          merchantName: 'GetAiPilot Ecosystem',
          isTestMode: false,
          themeColor: '#ec4899',
        }
      );
    } catch {
      return {
        keyId: '',
        currency: 'INR',
        merchantName: 'GetAiPilot Ecosystem',
        isTestMode: false,
        themeColor: '#ec4899',
      };
    }
  }

  /**
   * Requests BFF to initialize a verified Razorpay order
   */
  public static async createOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
    const res = await apiClient.post<{ success: boolean; order: RazorpayOrder }>(
      '/mobile/v1/payments/razorpay/create-order',
      params
    );

    if (!res || !res.order) {
      throw new Error('Failed to create Razorpay payment order.');
    }

    return res.order;
  }

  /**
   * Requests BFF to generate a dynamic UPI QR Code
   */
  public static async createQrCode(params: CreateQrParams): Promise<RazorpayQrCode> {
    const res = await apiClient.post<{ success: boolean; data: RazorpayQrCode }>(
      '/mobile/v1/payments/razorpay/create-qr',
      params
    );

    if (!res || !res.data) {
      throw new Error('Failed to create Razorpay UPI QR code.');
    }

    return res.data;
  }

  /**
   * Checks real-time payment status of a QR code
   */
  public static async checkQrStatus(qrId: string): Promise<QrStatusResponse> {
    try {
      const res = await apiClient.get<QrStatusResponse>(`/mobile/v1/payments/razorpay/qr-status/${qrId}`);
      return res || { success: true, isPaid: false };
    } catch {
      return { success: false, isPaid: false };
    }
  }

  /**
   * Verifies payment using Phone Number OR 12-digit UPI UTR / RRN Reference Number
   */
  public static async verifyQrPaymentByNumber(params: VerifyQrNumberParams): Promise<RazorpaySuccessResponse> {
    const res = await apiClient.post<{ success: boolean; data: RazorpaySuccessResponse }>(
      '/mobile/v1/payments/razorpay/verify-qr-number',
      params
    );

    if (!res || !res.data) {
      throw new Error('QR Payment verification failed.');
    }

    return res.data;
  }

  /**
   * Sends payment credentials to BFF for cryptographic HMAC verification and subscription entitlement
   */
  public static async verifyPayment(params: VerifyPaymentParams): Promise<RazorpaySuccessResponse> {
    const res = await apiClient.post<{ success: boolean; data: RazorpaySuccessResponse }>(
      '/mobile/v1/payments/razorpay/verify-payment',
      params
    );

    if (!res || !res.data) {
      throw new Error('Payment verification failed.');
    }

    return res.data;
  }
}

