import React, { createContext, useCallback, useContext, useState } from 'react';
import { RazorpayCheckoutModal } from '../components/payments/RazorpayCheckoutModal';
import { RazorpayCheckoutOptions } from '../core/payments/types';

export interface RazorpayContextType {
  openRazorpayCheckout: (options: RazorpayCheckoutOptions) => void;
  closeRazorpayCheckout: () => void;
  isCheckoutOpen: boolean;
}

const RazorpayContext = createContext<RazorpayContextType | undefined>(undefined);

export const RazorpayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeOptions, setActiveOptions] = useState<RazorpayCheckoutOptions | null>(null);

  const openRazorpayCheckout = useCallback((options: RazorpayCheckoutOptions) => {
    setActiveOptions(options);
  }, []);

  const closeRazorpayCheckout = useCallback(() => {
    setActiveOptions(null);
  }, []);

  return (
    <RazorpayContext.Provider
      value={{
        openRazorpayCheckout,
        closeRazorpayCheckout,
        isCheckoutOpen: Boolean(activeOptions),
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
