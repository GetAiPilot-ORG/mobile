import { apiClient } from '../api/client';
import { supabase } from '../../lib/supabase';
import {
  RazorpayConfig,
  RazorpayOrder,
  RazorpaySuccessResponse,
  RazorpayQrCode,
  CreateQrParams,
  VerifyQrNumberParams,
  QrStatusResponse,
  PaymentInterval,
  RazorpayPaymentLink,
  CreatePaymentLinkParams,
} from './types';

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  product?: string;
  planId: string;
  planName: string;
  billingInterval: PaymentInterval;
  notes?: Record<string, string>;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
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
  userId?: string;
}

export class RazorpayApiService {
  /**
   * Fetches gateway metadata and key from Supabase / BFF
   */
  public static async getConfig(): Promise<RazorpayConfig> {
    try {
      const config = await apiClient.get<RazorpayConfig>('/mobile/v1/payments/razorpay/config');
      if (config?.keyId) {
        return config;
      }
    } catch {}

    return {
      keyId: 'rzp_live_TDiBRMBEMB7Mcc',
      currency: 'INR',
      merchantName: 'GetAiPilot Ecosystem',
      isTestMode: false,
      themeColor: '#8B5CF6',
    };
  }

  /**
   * Initializes a verified Razorpay order using Supabase Edge Function 'create-payment-session'
   */
  public static async createOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
    // 1. Primary: Invoke Supabase Edge Function 'create-payment-session'
    try {
      const session = (await supabase.auth.getSession())?.data?.session;
      const user = session?.user;

      let dbPlanName = params.planName;
      const lowerId = (params.planId || '').toLowerCase();
      if (lowerId.startsWith('calling') || lowerId.startsWith('call_')) {
        dbPlanName = lowerId.includes('elite') ? 'calling_elite_monthly' : 'calling_lite_monthly';
      } else if (lowerId.includes('whatsapp')) {
        dbPlanName = lowerId.includes('growth')
          ? 'whatsapp_growth_monthly'
          : lowerId.includes('pro')
            ? 'whatsapp_pro_monthly'
            : 'whatsapp_starter_monthly';
      } else if (lowerId.includes('social')) {
        dbPlanName = 'social_pilot_growth';
      } else if (lowerId.includes('telegram')) {
        dbPlanName = 'telegram_monthly';
      } else if (lowerId.includes('crm')) {
        dbPlanName = lowerId.includes('extra') ? 'crm_extra_user' : 'crm_standard';
      } else if (lowerId.includes('scale') || lowerId.includes('enterprise')) {
        dbPlanName = 'gap_scale';
      } else {
        dbPlanName = 'all_in_one_bundle_monthly';
      }

      const { data: edgeData, error: edgeError } = await supabase.functions.invoke<{
        gateway?: string;
        razorpay_order_id?: string;
        razorpay_key_id?: string;
        amount?: number;
        currency?: string;
        name?: string;
        description?: string;
      }>('create-payment-session', {
        body: {
          plan_name: dbPlanName,
          amount: params.amount,
          currency: params.currency || 'INR',
          user_token: session?.access_token,
          userEmail: params.userEmail || user?.email,
          userName: params.userName || user?.user_metadata?.full_name,
          userPhone: params.userPhone || user?.phone,
        },
      });

      if (!edgeError && edgeData?.razorpay_order_id) {
        return {
          orderId: edgeData.razorpay_order_id,
          amount: params.amount,
          amountInPaise: edgeData.amount || Math.round(params.amount * 100),
          currency: edgeData.currency || params.currency || 'INR',
          keyId: edgeData.razorpay_key_id || 'rzp_live_TDiBRMBEMB7Mcc',
          receipt: `rcpt_${params.planId.slice(0, 6)}_${Date.now()}`,
          notes: params.notes,
        };
      }

      if (edgeError) {
        console.warn('[Razorpay] create-payment-session edge notice:', edgeError);
      }
    } catch (edgeErr) {
      console.warn('[Razorpay] Supabase Edge Function create-payment-session exception:', edgeErr);
    }

    // 2. Fallback: Local BFF endpoint
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
   * Initializes an official Razorpay hosted payment link
   */
  public static async createPaymentLink(params: CreatePaymentLinkParams): Promise<RazorpayPaymentLink> {
    // 1. Try Supabase Edge Function 'create-razorpay-payment-link'
    try {
      const session = (await supabase.auth.getSession())?.data?.session;
      const user = session?.user;

      const { data: edgeData, error: edgeError } = await supabase.functions.invoke<{
        short_url?: string;
        id?: string;
        amount?: number;
      }>('create-razorpay-payment-link', {
        body: {
          amount: params.amount,
          payee_name: params.planName,
          description: `${params.planName} Subscription`,
          user_token: session?.access_token,
          customer_email: user?.email,
          customer_phone: user?.phone,
        },
      });

      if (!edgeError && edgeData?.short_url) {
        return {
          paymentLinkId: edgeData.id || `plink_${Date.now()}`,
          shortUrl: edgeData.short_url,
          amount: params.amount,
          currency: params.currency || 'INR',
        };
      }
    } catch (edgeErr) {
      console.warn('[Razorpay] create-razorpay-payment-link edge notice:', edgeErr);
    }

    // 2. Fallback: Local BFF endpoint
    const res = await apiClient.post<{ success: boolean; data: RazorpayPaymentLink }>(
      '/mobile/v1/payments/razorpay/create-payment-link',
      params
    );

    if (!res || !res.data) {
      throw new Error('Failed to create Razorpay payment link.');
    }

    return res.data;
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
   * Verifies cryptographic HMAC signature and syncs entitlements via Supabase Edge Function 'verify-platform-payment'
   */
  public static async verifyPayment(params: VerifyPaymentParams): Promise<RazorpaySuccessResponse> {
    // 1. Primary: Invoke Supabase Edge Function 'verify-platform-payment'
    try {
      const session = (await supabase.auth.getSession())?.data?.session;
      const user = session?.user;
      const effectiveUserId = params.userId || user?.id;

      if (effectiveUserId) {
        const { data: edgeVerify, error: edgeError } = await supabase.functions.invoke<{
          status?: string;
          message?: string;
        }>('verify-platform-payment', {
          body: {
            gateway: 'razorpay',
            user_id: effectiveUserId,
            user_token: session?.access_token,
            razorpay_order_id: params.orderId,
            razorpay_payment_id: params.paymentId,
            razorpay_signature: params.signature,
            plan_id: params.planId,
            plans: [params.planName],
          },
        });

        if (!edgeError && (edgeVerify?.status === 'success' || !edgeVerify?.status)) {
          return {
            orderId: params.orderId,
            paymentId: params.paymentId,
            signature: params.signature,
            planId: params.planId,
            planName: params.planName,
            billingInterval: params.billingInterval,
            amount: params.amount,
            currency: params.currency || 'INR',
            status: 'SUCCESS',
          };
        }

        if (edgeError) {
          console.warn('[Razorpay] verify-platform-payment edge notice:', edgeError);
        }
      }
    } catch (edgeErr) {
      console.warn('[Razorpay] Supabase Edge Function verify-platform-payment exception:', edgeErr);
    }

    // 2. Fallback: Local BFF endpoint
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
