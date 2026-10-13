import React, { createContext, useCallback, useContext, useState } from 'react';
import { RazorpayCheckoutModal } from '../components/payments/RazorpayCheckoutModal';
import { NativeRazorpayService } from '../core/payments/nativeRazorpayService';
import { RazorpayCheckoutOptions } from '../core/payments/types';
import { useAuthStore } from '../core/store/authStore';

export interface RazorpayContextType {
  openRazorpayCheckout: (options: RazorpayCheckoutOptions) => Promise<void>;
  closeRazorpayCheckout: () => void;
  isCheckoutOpen: boolean;
  isNativeSdkAvailable: boolean;
}

const RazorpayContext = createContext<RazorpayContextType | undefined>(undefined);

export const RazorpayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeOptions, setActiveOptions] = useState<RazorpayCheckoutOptions | null>(null);
  const currentUser = useAuthStore((s) => s.user);

  const openRazorpayCheckout = useCallback(
    async (options: RazorpayCheckoutOptions) => {
      // 1. If native Razorpay SDK module is available in binary runtime, launch it directly
      if (NativeRazorpayService.isNativeSdkAvailable()) {
        const handled = await NativeRazorpayService.launchNativeCheckout(options, {
          id: currentUser?.id,
          email: options.prefill?.email || currentUser?.email,
          name: options.prefill?.name || currentUser?.name || currentUser?.user_metadata?.full_name,
          phone: options.prefill?.contact || currentUser?.phone,
        });
        if (handled) {
          return;
        }
      }

      // 2. Otherwise fall back to in-app Razorpay modal (UPI QR, Direct UPI & Web Gateway)
      setActiveOptions(options);
    },
    [currentUser]
  );

  const closeRazorpayCheckout = useCallback(() => {
    setActiveOptions(null);
  }, []);

  return (
    <RazorpayContext.Provider
      value={{
        openRazorpayCheckout,
        closeRazorpayCheckout,
        isCheckoutOpen: Boolean(activeOptions),
        isNativeSdkAvailable: NativeRazorpayService.isNativeSdkAvailable(),
      }}
    >
      {children}
      <RazorpayCheckoutModal
        visible={Boolean(activeOptions)}
        options={activeOptions}
        onClose={closeRazorpayCheckout}
      />
    </RazorpayContext.Provider>
  );
};

export const useRazorpay = (): RazorpayContextType => {
  const context = useContext(RazorpayContext);
  if (!context) {
    throw new Error('useRazorpay must be used within a RazorpayProvider');
  }
  return context;
};
