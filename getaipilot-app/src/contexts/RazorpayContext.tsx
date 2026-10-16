import React, { createContext, useCallback, useContext, useState } from 'react';
import { NativeRazorpayService } from '../core/payments/nativeRazorpayService';
import { RazorpayCheckoutOptions } from '../core/payments/types';
import { useAuthStore } from '../core/store/authStore';
import { RazorpayOfficialCheckoutModal } from '../components/payments/RazorpayOfficialCheckoutModal';

export interface RazorpayContextType {
  openRazorpayCheckout: (options: RazorpayCheckoutOptions) => Promise<void>;
  closeRazorpayCheckout: () => void;
  isCheckoutOpen: boolean;
  isNativeSdkAvailable: boolean;
}

const RazorpayContext = createContext<RazorpayContextType | undefined>(undefined);

export const RazorpayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useAuthStore((s) => s.user);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeOptions, setActiveOptions] = useState<RazorpayCheckoutOptions | null>(null);

  const openRazorpayCheckout = useCallback(
    async (options: RazorpayCheckoutOptions) => {
      const userInfo = {
        id: currentUser?.id,
        email: options.prefill?.email || currentUser?.email,
        name: options.prefill?.name || currentUser?.name || currentUser?.user_metadata?.full_name,
        phone: options.prefill?.contact || currentUser?.phone,
      };

      // 1. If native SDK is compiled and available in current runtime, run native checkout
      if (NativeRazorpayService.isNativeSdkAvailable()) {
        try {
          const handled = await NativeRazorpayService.launchCheckout(options, userInfo);
          if (handled) return;
        } catch (err: any) {
          console.warn('[Razorpay] Native launch attempt notice, switching to in-app checkout:', err);
        }
      }

      // 2. In Expo Go / Waydroid / environments without native binary or browser app:
      // Launch official Razorpay checkout directly in-app via react-native-webview
      setActiveOptions(options);
      setModalVisible(true);
    },
    [currentUser]
  );

  const closeRazorpayCheckout = useCallback(() => {
    setModalVisible(false);
    setActiveOptions(null);
  }, []);

  return (
    <RazorpayContext.Provider
      value={{
        openRazorpayCheckout,
        closeRazorpayCheckout,
        isCheckoutOpen: modalVisible,
        isNativeSdkAvailable: NativeRazorpayService.isNativeSdkAvailable(),
      }}
    >
      {children}
      <RazorpayOfficialCheckoutModal
        visible={modalVisible}
        options={activeOptions}
        userInfo={{
          id: currentUser?.id,
          email: currentUser?.email,
          name: currentUser?.name || currentUser?.user_metadata?.full_name,
          phone: currentUser?.phone,
        }}
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
