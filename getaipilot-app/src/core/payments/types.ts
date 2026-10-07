export type PaymentInterval = 'month' | 'quarterly' | 'six_months' | 'year';

export interface RazorpayOrder {
  orderId: string;
  amount: number; // in INR
  amountInPaise: number;
  currency: string;
  keyId: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayConfig {
  keyId: string;
  currency: string;
  merchantName: string;
  isTestMode: boolean;
  themeColor: string;
}

export interface RazorpaySuccessResponse {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: string;
  planName: string;
  billingInterval: PaymentInterval;
  amount: number;
  currency: string;
  status: string;
  startedAt?: string;
  expiresAt?: string;
}

export interface RazorpayCheckoutOptions {
  amount: number; // in INR
  currency?: string; // default 'INR'
  product?: string; // e.g. 'social'
  planId: string;
  planName: string;
  billingInterval: PaymentInterval;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  themeColor?: string;
  onSuccess?: (result: RazorpaySuccessResponse) => void | Promise<void>;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
}

export interface RazorpayQrCode {
  qrId: string;
  imageUrl: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  closeBy: number;
  name: string;
  upiPayload?: string;
}

export interface CreateQrParams {
  amount: number;
  currency?: string;
  product?: string;
  planId: string;
  planName: string;
  billingInterval: PaymentInterval;
}

export interface VerifyQrNumberParams {
  qrId: string;
  number: string;
  orderId?: string;
  planId: string;
  planName: string;
  billingInterval: PaymentInterval;
  amount: number;
  currency?: string;
  product?: string;
}

export interface QrStatusResponse {
  success: boolean;
  isPaid: boolean;
  paymentId?: string;
  amount?: number;
  status?: string;
}
