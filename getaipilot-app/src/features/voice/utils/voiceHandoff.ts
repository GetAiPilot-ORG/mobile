import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { QueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../core/api/client';
import { supabase } from '../../../lib/supabase';

export const VOICE_WEB_BASE_URL = 'https://voice.getaipilot.online';
export const VOICE_PHONE_NUMBERS_URL = 'https://voice.getaipilot.online/dashboard/phone-numbers';

export interface OpenVoiceHandoffOptions {
  external?: boolean;
}

/**
 * Resolves an authenticated Supabase SSO URL for GAP VoicePilot Web.
 * Defaults to https://voice.getaipilot.online/dashboard/phone-numbers.
 */
export async function getVoiceSsoUrl(
  targetUrl: string = VOICE_PHONE_NUMBERS_URL,
): Promise<string> {
  const cleanTarget = targetUrl.startsWith('http')
    ? targetUrl
    : `${VOICE_WEB_BASE_URL}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;

  // 1. Primary: Request authentic SSO URL from BFF
  try {
    const res = await apiClient.post<{ success: boolean; ssoUrl: string }>(
      '/mobile/v1/voice/sso-url',
      { redirectPath: cleanTarget },
    );
    if (res?.ssoUrl) {
      console.log('[VoiceSSO] Resolved BFF SSO URL:', res.ssoUrl);
      return res.ssoUrl;
    }
  } catch (bffErr) {
    console.warn('[VoiceSSO] BFF SSO endpoint failed, checking client Supabase session:', bffErr);
  }

  // 2. Secondary: Client-side edge function handoff via Hub Supabase session
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (token) {
      const edgeRes = await supabase.functions.invoke<{ launch_url?: string }>(
        'voice-sso',
        {
          body: { voice_pilot_url: null },
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const launchUrl = edgeRes.data?.launch_url;
      if (launchUrl) {
        return launchUrl;
      }
    }
  } catch (clientErr) {
    console.warn('[VoiceSSO] Client Supabase session handoff error:', clientErr);
  }

  // 3. Fallback: Direct destination URL
  return cleanTarget;
}

/**
 * Seamlessly opens VoicePilot Web with an authenticated SSO session.
 * Defaults to the Dedicated Phone Lines dashboard (https://voice.getaipilot.online/dashboard/phone-numbers).
 */
export async function openVoiceHandoff(
  targetUrl: string = VOICE_PHONE_NUMBERS_URL,
  queryClient?: QueryClient,
  isDark: boolean = false,
  options?: OpenVoiceHandoffOptions,
): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}

  const ssoUrl = await getVoiceSsoUrl(targetUrl);

  try {
    if (options?.external) {
      await Linking.openURL(ssoUrl);
    } else {
      await WebBrowser.openBrowserAsync(ssoUrl, {
        toolbarColor: isDark ? '#161618' : '#5B3AF5',
        controlsColor: '#FFFFFF',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        enableBarCollapsing: true,
        showTitle: true,
      });
    }
  } catch (err) {
    console.warn('[VoiceSSO] In-app browser failed, opening via Linking:', err);
    try {
      await Linking.openURL(ssoUrl);
    } catch (linkErr) {
      console.error('[VoiceSSO] Failed to open external URL:', linkErr);
    }
  }

  // Refresh Voice telemetry and subscriptions upon returning
  if (queryClient) {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['voice'] }),
        queryClient.invalidateQueries({ queryKey: ['voice', 'overview'] }),
        queryClient.invalidateQueries({ queryKey: ['voice', 'numbers'] }),
        queryClient.invalidateQueries({ queryKey: ['voice', 'calls'] }),
        queryClient.invalidateQueries({ queryKey: ['platform-subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['ecosystem-pricing-plans'] }),
      ]);
    } catch {}
  }
}

/**
 * Seamlessly opens the Dedicated Phone Lines management screen on VoicePilot Web
 * (https://voice.getaipilot.online/dashboard/phone-numbers) with authentic SSO.
 */
export async function openVoicePhoneNumbersSSO(
  queryClient?: QueryClient,
  isDark: boolean = false,
  options?: OpenVoiceHandoffOptions,
): Promise<void> {
  return openVoiceHandoff(VOICE_PHONE_NUMBERS_URL, queryClient, isDark, options);
}
