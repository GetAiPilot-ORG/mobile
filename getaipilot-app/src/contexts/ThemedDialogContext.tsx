import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { Alert } from 'react-native';
import {
  ThemedDialog,
  ThemedDialogProps,
  ThemedDialogType,
  DialogButton,
  DialogButtonVariant,
  DialogButtonAlign,
} from '../components/ThemedDialog';

export interface ShowDialogOptions extends Omit<ThemedDialogProps, 'visible' | 'onClose'> {
  onClose?: () => void;
}

export interface LogoutConfirmOptions {

  description?: string;

  confirmText?: string;
  cancelText?: string;
  confirmTextColor?: string;
  cancelTextColor?: string;
  confirmBgColor?: string;
  cancelBgColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  buttonAlign?: DialogButtonAlign;
  alignRight?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ReferralDialogOptions {
  referralCode: string;
  referralLink?: string;
  referralReward?: string;
  title?: string;
  description?: string;
  backgroundColor?: string;
  borderColor?: string;
  onShare?: () => void;
  onClose?: () => void;
}

export interface SimpleAlertOptions {
  title: string;
  message?: string;
  type?: ThemedDialogType;
  buttonText?: string;
  buttonTextColor?: string;
  buttonBgColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  buttonAlign?: DialogButtonAlign;
  alignRight?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  onConfirm?: () => void;
}

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  type?: ThemedDialogType;
  confirmText?: string;
  cancelText?: string;
  confirmTextColor?: string;
  cancelTextColor?: string;
  confirmBgColor?: string;
  cancelBgColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  buttonAlign?: DialogButtonAlign;
  alignRight?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface PromptDialogOptions {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  confirmTextColor?: string;
  cancelTextColor?: string;
  confirmBgColor?: string;
  cancelBgColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  buttonAlign?: DialogButtonAlign;
  alignRight?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  onConfirm: (value: string) => void | Promise<void>;
  onCancel?: () => void;
}

export interface ThemedDialogContextType {
  showDialog: (options: ShowDialogOptions) => void;
  hideDialog: () => void;
  confirmLogout: (options: LogoutConfirmOptions) => void;
  showReferral: (options: ReferralDialogOptions) => void;
  showAlert: (options: SimpleAlertOptions) => void;
  confirm: (options: ConfirmDialogOptions) => void;
  prompt: (
    optionsOrTitle: PromptDialogOptions | string,
    messageOrOnConfirm?: string | ((value: string) => void | Promise<void>),
    onConfirm?: (value: string) => void | Promise<void>,
    defaultValue?: string
  ) => void;
}

// Global Alert Listener & Manager
type AlertListener = (payload: ShowDialogOptions | null) => void;

class ThemedAlertManager {
  private listener: AlertListener | null = null;

  register(listener: AlertListener) {
    this.listener = listener;
    return () => {
      this.listener = null;
    };
  }

  isReady() {
    return Boolean(this.listener);
  }

  show(payload: ShowDialogOptions) {
    if (this.listener) {
      this.listener(payload);
    }
  }

  hide() {
    if (this.listener) {
      this.listener(null);
    }
  }
}

export const themedAlertManager = new ThemedAlertManager();

const originalNativeAlert = Alert.alert;

/**
 * Universal Drop-In Alert
 * Can be called anywhere: ThemedAlert.alert(title, message, buttons)
 * or via standard Alert.alert(...)
 */
export const ThemedAlert = {
  alert(
    title: string,
    message?: string,
    buttons?: Array<{
      text?: string;
      onPress?: () => void | Promise<void>;
      style?: 'default' | 'cancel' | 'destructive';
      textColor?: string;
      backgroundColor?: string;
      borderColor?: string;
    }>,
    options?: {
      cancelable?: boolean;
      onDismiss?: () => void;
      backgroundColor?: string;
      borderColor?: string;
      buttonAlign?: DialogButtonAlign;
      alignRight?: boolean;
      textAlign?: 'left' | 'center' | 'right';
      showCloseButton?: boolean;
    }
  ) {
    if (!themedAlertManager.isReady()) {
      originalNativeAlert(title, message, buttons as any, options);
      return;
    }

    const tLower = (title || '').toLowerCase();
    const mLower = (message || '').toLowerCase();

    // Auto-detect dialog type "kam ke hisab se"
    let dialogType: ThemedDialogType = 'default';
    if (
      tLower.includes('sign out') ||
      tLower.includes('logout') ||
      tLower.includes('log out') ||
      mLower.includes('sign out') ||
      mLower.includes('logout')
    ) {
      dialogType = 'logout';
    } else if (
      tLower.includes('delete') ||
      tLower.includes('remove') ||
      tLower.includes('discard') ||
      tLower.includes('revoke') ||
      buttons?.some(
        (b) =>
          b.style === 'destructive' ||
          (b.text || '').toLowerCase().includes('delete') ||
          (b.text || '').toLowerCase().includes('remove')
      )
    ) {
      dialogType = 'destructive';
    } else if (
      tLower.includes('referral') ||
      mLower.includes('referral') ||
      tLower.includes('reward') ||
      mLower.includes('reward') ||
      tLower.includes('invite')
    ) {
      dialogType = 'referral';
    } else if (
      tLower.includes('success') ||
      tLower.includes('copied') ||
      tLower.includes('saved') ||
      tLower.includes('created') ||
      tLower.includes('added')
    ) {
      dialogType = 'success';
    } else if (
      tLower.includes('error') ||
      tLower.includes('failed') ||
      tLower.includes('warning') ||
      tLower.includes('limit') ||
      tLower.includes('notice') ||
      tLower.includes('needed')
    ) {
      dialogType = 'warning';
    }

    // Process buttons
    let dialogButtons: DialogButton[] = [];
    if (buttons && buttons.length > 0) {
      dialogButtons = buttons.map((b, idx) => {
        const bText = b.text || 'OK';
        const bTextLower = bText.toLowerCase();

        let variant: DialogButtonVariant = 'primary';
        if (
          b.style === 'cancel' ||
          bTextLower.includes('cancel') ||
          bTextLower.includes('no') ||
          bTextLower.includes('dismiss') ||
          bTextLower.includes('close') ||
          (buttons.length === 2 && idx === 0)
        ) {
          variant = 'secondary';
        } else if (
          b.style === 'destructive' ||
          bTextLower.includes('delete') ||
          bTextLower.includes('remove') ||
          bTextLower.includes('sign out') ||
          bTextLower.includes('logout')
        ) {
          variant = 'destructive';
        } else if (bTextLower.includes('share') || bTextLower.includes('refer')) {
          variant = 'referral';
        }

        return {
          text: bText,
          variant,
          textColor: b.textColor,
          backgroundColor: b.backgroundColor,
          borderColor: b.borderColor,
          onPress: async () => {
            try {
              if (b.onPress) {
                await b.onPress();
              }
            } finally {
              themedAlertManager.hide();
            }
          },
        };
      });
    } else {
      dialogButtons = [
        {
          text: 'OK',
          variant: 'primary',
          onPress: () => {
            themedAlertManager.hide();
            options?.onDismiss?.();
          },
        },
      ];
    }

    themedAlertManager.show({
      type: dialogType,
      title: title || '',
      description: message,
      buttons: dialogButtons,
      backgroundColor: options?.backgroundColor,
      borderColor: options?.borderColor,
      buttonAlign: options?.buttonAlign,
      alignRight: options?.alignRight,
      textAlign: options?.textAlign,
      dismissable: options?.cancelable ?? true,
      showCloseButton: options?.showCloseButton ?? true,
      buttonLayout: dialogButtons.length === 2 ? 'row' : 'auto',
      onClose: () => {
        options?.onDismiss?.();
      },
    });
  },

  prompt(
    title: string,
    message?: string,
    callbackOrButtons?:
      | ((text: string) => void)
      | Array<{
        text?: string;
        onPress?: (text: string) => void | Promise<void>;
        style?: 'default' | 'cancel' | 'destructive';
      }>,
    type: 'default' | 'plain-text' | 'secure-text' | 'login-password' = 'default',
    defaultValue: string = '',
    keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' = 'default'
  ) {
    let currentInput = defaultValue;
    let dialogButtons: DialogButton[] = [];

    if (typeof callbackOrButtons === 'function') {
      dialogButtons = [
        {
          text: 'Cancel',
          variant: 'secondary',
          onPress: () => {
            themedAlertManager.hide();
          },
        },
        {
          text: 'OK',
          variant: 'primary',
          onPress: async () => {
            try {
              await callbackOrButtons(currentInput);
            } finally {
              themedAlertManager.hide();
            }
          },
        },
      ];
    } else if (Array.isArray(callbackOrButtons) && callbackOrButtons.length > 0) {
      dialogButtons = callbackOrButtons.map((b) => ({
        text: b.text || 'OK',
        variant:
          b.style === 'cancel'
            ? 'secondary'
            : b.style === 'destructive'
              ? 'destructive'
              : 'primary',
        onPress: async () => {
          try {
            await b.onPress?.(currentInput);
          } finally {
            themedAlertManager.hide();
          }
        },
      }));
    } else {
      dialogButtons = [
        {
          text: 'OK',
          variant: 'primary',
          onPress: () => {
            themedAlertManager.hide();
          },
        },
      ];
    }

    themedAlertManager.show({
      type: 'default',
      title: title || '',
      description: message,
      isPrompt: true,
      promptValue: defaultValue,
      keyboardType,
      secureTextEntry: type === 'secure-text' || type === 'login-password',
      onPromptChange: (text) => {
        currentInput = text;
      },
      buttons: dialogButtons,
      buttonLayout: dialogButtons.length === 2 ? 'row' : 'auto',
    });
  },
};

// Global interceptor for standard Alert.alert and Alert.prompt everywhere in the app
Alert.alert = (title: string, message?: string, buttons?: any[], options?: any) => {
  ThemedAlert.alert(title, message, buttons, options);
};

(Alert as any).prompt = (
  title: string,
  message?: string,
  callbackOrButtons?: any,
  type?: any,
  defaultValue?: string,
  keyboardType?: any
) => {
  ThemedAlert.prompt(title, message, callbackOrButtons, type, defaultValue, keyboardType);
};

const ThemedDialogContext = createContext<ThemedDialogContextType | undefined>(undefined);

export const ThemedDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<ShowDialogOptions | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const hideDialog = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setDialogState(null);
    }, 200);
  }, []);

  const showDialog = useCallback((options: ShowDialogOptions) => {
    setDialogState(options);
    setIsVisible(true);
  }, []);

  // Listen for global ThemedAlert calls
  useEffect(() => {
    const unsubscribe = themedAlertManager.register((payload) => {
      if (payload) {
        setDialogState(payload);
        setIsVisible(true);
      } else {
        hideDialog();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [hideDialog]);

  const confirmLogout = useCallback(
    ({
      description = 'Are you sure you want to sign out from GetAiPilot?',
      confirmText = 'Sign Out',
      cancelText = 'Cancel',
      confirmTextColor,
      cancelTextColor,
      confirmBgColor,
      cancelBgColor,
      backgroundColor,
      borderColor,
      buttonAlign,
      alignRight,
      textAlign,
      onConfirm,
      onCancel,
    }: LogoutConfirmOptions) => {
      showDialog({
        type: 'logout',
        description,
        backgroundColor,
        borderColor,
        buttonLayout: 'row',
        buttonAlign,
        alignRight,
        textAlign,
        secondaryButton: {
          text: cancelText,
          variant: 'secondary',
          textColor: cancelTextColor,
          backgroundColor: cancelBgColor,
          onPress: () => {
            hideDialog();
            onCancel?.();
          },
        },
        primaryButton: {
          text: confirmText,
          variant: 'destructive',
          textColor: confirmTextColor,
          backgroundColor: confirmBgColor,
          onPress: async () => {
            try {
              await onConfirm();
            } finally {
              hideDialog();
            }
          },
        },
      });
    },
    [showDialog, hideDialog]
  );

  const showReferral = useCallback(
    ({
      referralCode,
      referralLink,
      referralReward,
      title = 'Invite & Earn Rewards',
      description = 'Share your referral code with your colleagues and earn recurring credits.',
      backgroundColor,
      borderColor,
      onShare,
      onClose,
    }: ReferralDialogOptions) => {
      showDialog({
        type: 'referral',
        title,
        description,
        referralCode,
        referralLink,
        referralReward,
        backgroundColor,
        borderColor,
        onShareReferral: onShare,
        buttonLayout: 'row',
        secondaryButton: {
          text: 'Done',
          variant: 'secondary',
          onPress: () => {
            hideDialog();
            onClose?.();
          },
        },
        primaryButton: {
          text: 'Share',
          variant: 'referral',
          onPress: () => {
            if (onShare) {
              onShare();
            }
          },
        },
      });
    },
    [showDialog, hideDialog]
  );

  const showAlert = useCallback(
    ({
      title,
      message,
      type = 'info',
      buttonText = 'Got It',
      buttonTextColor,
      buttonBgColor,
      backgroundColor,
      borderColor,
      buttonAlign,
      alignRight,
      textAlign,
      onConfirm,
    }: SimpleAlertOptions) => {
      showDialog({
        type,
        title,
        description: message,
        backgroundColor,
        borderColor,
        buttonAlign,
        alignRight,
        textAlign,
        primaryButton: {
          text: buttonText,
          variant: type === 'destructive' ? 'destructive' : 'primary',
          textColor: buttonTextColor,
          backgroundColor: buttonBgColor,
          onPress: () => {
            hideDialog();
            onConfirm?.();
          },
        },
      });
    },
    [showDialog, hideDialog]
  );

  const confirm = useCallback(
    ({
      title,
      message,
      type = 'warning',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmTextColor,
      cancelTextColor,
      confirmBgColor,
      cancelBgColor,
      backgroundColor,
      borderColor,
      buttonAlign,
      alignRight,
      textAlign,
      destructive = false,
      onConfirm,
      onCancel,
    }: ConfirmDialogOptions) => {
      showDialog({
        type: destructive ? 'destructive' : type,
        title,
        description: message,
        backgroundColor,
        borderColor,
        buttonLayout: 'row',
        buttonAlign,
        alignRight,
        textAlign,
        secondaryButton: {
          text: cancelText,
          variant: 'secondary',
          textColor: cancelTextColor,
          backgroundColor: cancelBgColor,
          onPress: () => {
            hideDialog();
            onCancel?.();
          },
        },
        primaryButton: {
          text: confirmText,
          variant: destructive ? 'destructive' : 'primary',
          textColor: confirmTextColor,
          backgroundColor: confirmBgColor,
          onPress: async () => {
            try {
              await onConfirm();
            } finally {
              hideDialog();
            }
          },
        },
      });
    },
    [showDialog, hideDialog]
  );

  const prompt = useCallback(
    (
      optionsOrTitle: PromptDialogOptions | string,
      messageOrOnConfirm?: string | ((value: string) => void | Promise<void>),
      onConfirmParam?: (value: string) => void | Promise<void>,
      defaultValueParam: string = ''
    ) => {
      let options: PromptDialogOptions;

      if (typeof optionsOrTitle === 'string') {
        const title = optionsOrTitle;
        let message: string | undefined;
        let onConfirm: (value: string) => void | Promise<void> = () => { };
        let defaultValue = defaultValueParam;

        if (typeof messageOrOnConfirm === 'function') {
          onConfirm = messageOrOnConfirm;
        } else if (typeof messageOrOnConfirm === 'string') {
          message = messageOrOnConfirm;
          if (typeof onConfirmParam === 'function') {
            onConfirm = onConfirmParam;
          }
        }

        options = {
          title,
          message,
          defaultValue,
          onConfirm,
        };
      } else {
        options = optionsOrTitle;
      }

      const {
        title,
        message,
        defaultValue = '',
        placeholder = '',
        confirmText = 'OK',
        cancelText = 'Cancel',
        confirmTextColor,
        cancelTextColor,
        confirmBgColor,
        cancelBgColor,
        backgroundColor,
        borderColor,
        buttonAlign,
        alignRight,
        textAlign,
        keyboardType = 'default',
        secureTextEntry = false,
        onConfirm,
        onCancel,
      } = options;

      let promptText = defaultValue;

      showDialog({
        type: 'default',
        title,
        description: message,
        backgroundColor,
        borderColor,
        buttonAlign,
        alignRight,
        textAlign,
        isPrompt: true,
        promptValue: defaultValue,
        promptPlaceholder: placeholder,
        keyboardType,
        secureTextEntry,
        onPromptChange: (text) => {
          promptText = text;
        },
        buttonLayout: 'row',
        secondaryButton: {
          text: cancelText,
          variant: 'secondary',
          textColor: cancelTextColor,
          backgroundColor: cancelBgColor,
          onPress: () => {
            hideDialog();
            onCancel?.();
          },
        },
        primaryButton: {
          text: confirmText,
          variant: 'primary',
          textColor: confirmTextColor,
          backgroundColor: confirmBgColor,
          onPress: async () => {
            try {
              await onConfirm(promptText);
            } finally {
              hideDialog();
            }
          },
        },
      });
    },
    [showDialog, hideDialog]
  );

  const contextValue = useMemo(
    () => ({
      showDialog,
      hideDialog,
      confirmLogout,
      showReferral,
      showAlert,
      confirm,
      prompt,
    }),
    [showDialog, hideDialog, confirmLogout, showReferral, showAlert, confirm, prompt]
  );

  return (
    <ThemedDialogContext.Provider value={contextValue}>
      {children}
      {dialogState && (
        <ThemedDialog
          visible={isVisible}
          onClose={() => {
            dialogState.onClose?.();
            hideDialog();
          }}
          {...dialogState}
        />
      )}
    </ThemedDialogContext.Provider>
  );
};

export const useThemedDialog = (): ThemedDialogContextType => {
  const context = useContext(ThemedDialogContext);
  if (!context) {
    throw new Error('useThemedDialog must be used within a ThemedDialogProvider');
  }
  return context;
};
