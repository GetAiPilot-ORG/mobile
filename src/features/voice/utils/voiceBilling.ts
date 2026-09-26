import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { QueryClient } from '@tanstack/react-query';

export const VOICE_WEB_BILLING_URL = 'https://voice.getaipilot.online/dashboard/billing';

/**
 * Opens VoicePilot web billing dashboard inside an in-app browser modal.
 * Refetches Voice telemetry and subscriptions upon browser closure.
 */
export async function openVoiceWebBilling(
  queryClient?: QueryClient,
  isDark: boolean = false
) {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await WebBrowser.openBrowserAsync(VOICE_WEB_BILLING_URL, {
      toolbarColor: isDark ? '#161618' : '#5B3AF5',
      controlsColor: '#FFFFFF',
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      enableBarCollapsing: true,
      showTitle: true,
    });

    if (queryClient) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['voice'] }),
        queryClient.invalidateQueries({ queryKey: ['voice', 'overview'] }),
        queryClient.invalidateQueries({ queryKey: ['voice', 'numbers'] }),
        queryClient.invalidateQueries({ queryKey: ['voice', 'calls'] }),
        queryClient.invalidateQueries({ queryKey: ['platform-subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['ecosystem-pricing-plans'] }),
      ]);
    }

    return result;
  } catch (error) {
    console.warn('[openVoiceWebBilling] In-app browser error:', error);
  }
}
