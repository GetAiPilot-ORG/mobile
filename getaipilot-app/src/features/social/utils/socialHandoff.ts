import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';
import { apiClient } from '../../../core/api/client';
import { supabase } from '../../../lib/supabase';

export type SocialHandoffTarget =
  | 'new-post'
  | 'schedule'
  | 'builder'
  | 'upload-short'
  | 'new-automation'
  | 'billing'
  | 'channels'
  | 'connect-instagram'
  | 'connect-threads'
  | 'connect-facebook'
  | 'connect-youtube'
  | 'connect-linkedin'
  | 'connect-bluesky'
  | 'connect-mastodon'
  | 'connect-x'
  | 'connect-reddit'
  | 'connect-pinterest'
  | 'connect-googleBusiness';

export const SOCIAL_TARGET_URLS: Record<SocialHandoffTarget, string> = {
  'new-post': 'https://social.getaipilot.in/dashboard',
  'schedule': 'https://social.getaipilot.in/dashboard/queue',
  'builder': 'https://social.getaipilot.in/dashboard/instapilot?mode=builder',
  'upload-short': 'https://social.getaipilot.in/dashboard/compose',
  'new-automation': 'https://social.getaipilot.in/dashboard/auto-dm/automations/new',
  'billing': 'https://social.getaipilot.in/dashboard/settings?tab=billing',
  'channels': 'https://social.getaipilot.in/dashboard/settings?tab=channels',
  'connect-instagram': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=instagram',
  'connect-threads': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=threads',
  'connect-facebook': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=facebook',
  'connect-youtube': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=youtube',
  'connect-linkedin': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=linkedin',
  'connect-bluesky': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=bluesky',
  'connect-mastodon': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=mastodon',
  'connect-x': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=x',
  'connect-reddit': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=reddit',
  'connect-pinterest': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=pinterest',
  'connect-googleBusiness': 'https://social.getaipilot.in/dashboard/settings?tab=channels&connect=googleBusiness',
};

export const SOCIAL_TOOL_KEYS: Record<string, string> = {
  'new-post': 'social-post',
  'schedule': 'social-schedule',
  'builder': 'social-builder',
  'upload-short': 'social-compose',
  'new-automation': 'social-automation',
  'billing': 'social-billing',
  'channels': 'social-channels',
  'connect-instagram': 'social-channels',
  'connect-threads': 'social-channels',
  'connect-facebook': 'social-channels',
  'connect-youtube': 'social-channels',
  'connect-linkedin': 'social-channels',
  'connect-x': 'social-channels',
  'connect-pinterest': 'social-channels',
};

/**
 * Opens a URL in an In-App Safari View Controller (iOS) or Chrome Custom Tab (Android).
 * On Web, opens a new tab.
 */
export async function openUrlInAppBrowser(url: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
      return true;
    }
  }

  try {
    const result = await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: '#121214',
      controlsColor: '#EC4899',
      showTitle: true,
      enableBarCollapsing: true,
    });
    return result.type !== 'cancel';
  } catch (err) {
    console.warn('[SocialSSO] WebBrowser error, falling back to Linking:', err);
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Seamlessly opens SocialPilot in an in-app browser with an authenticated SSO session.
 * Automatically deep-links to the exact tool or channel connection screen requested.
 */
export async function openSocialHandoff(
  target: SocialHandoffTarget,
  customWebAppUrl?: string,
): Promise<boolean> {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {}

  const directUrl = SOCIAL_TARGET_URLS[target] || 'https://social.getaipilot.in/dashboard';

  // 1. Primary: Generate SSO handoff consumed in getaipilot.in (/auth/handoff)
  try {
    const webAppUrl = customWebAppUrl || 'https://getaipilot.in';
    const toolKey = SOCIAL_TOOL_KEYS[target] || 'social-channels';
    const { data, error } = await supabase.functions.invoke<{
      targetUrl: string;
      redirectPath?: string;
      webAppBaseUrl?: string;
    }>('web-handoff', {
      body: {
        targetTool: toolKey,
        clientId: toolKey,
        webAppUrl,
      },
    });

    if (!error && data?.targetUrl) {
      console.log(`[SocialSSO] Opening getaipilot.in handoff URL for ${target}:`, data.targetUrl);
      return await openUrlInAppBrowser(data.targetUrl);
    }
    if (error) {
      console.warn(`[SocialSSO] web-handoff edge function error for ${target}:`, error);
    }
  } catch (edgeErr) {
    console.warn(`[SocialSSO] web-handoff invoke failed for ${target}:`, edgeErr);
  }

  // 2. Secondary: Fallback to BFF SSO URL
  try {
    const res = await apiClient.post<{ success: boolean; ssoUrl: string }>(
      '/mobile/v1/social/sso-url',
      { target },
    );

    if (res?.ssoUrl) {
      console.log(`[SocialSSO] Opening BFF SSO URL fallback for ${target}:`, res.ssoUrl);
      return await openUrlInAppBrowser(res.ssoUrl);
    }
  } catch (bffErr) {
    console.warn(`[SocialSSO] BFF fallback failed for ${target}:`, bffErr);
  }

  // 3. Fallback: Direct external link
  try {
    console.log(`[SocialSSO] Opening direct fallback URL for ${target}:`, directUrl);
    return await openUrlInAppBrowser(directUrl);
  } catch (err) {
    console.error(`[SocialSSO] Failed to open external URL for ${target}:`, err);
    Alert.alert('Unable to open browser', 'Please check your internet connection and try again.');
    return false;
  }
}

/**
 * Directly initiates platform OAuth for Instagram, Threads, YouTube, Facebook, LinkedIn, X, etc.
 * Uses openAuthSessionAsync so the in-app browser automatically dismisses once Meta/Google OAuth finishes.
 */
export async function openDirectSocialConnect(platform: string): Promise<{ completed: boolean; username?: string }> {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {}

  try {
    // 1. Get direct OAuth connect URL from BFF
    const res = await apiClient.get<{ success: boolean; connectUrl: string }>(
      '/mobile/v1/social/connect-url',
      { params: { platform } }
    );

    if (res?.connectUrl) {
      console.log(`[SocialConnect] Launching OAuth session for ${platform}:`, res.connectUrl);

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.open(res.connectUrl, '_blank');
          return { completed: true };
        }
      }

      try {
        // Intercepts redirect to social.getaipilot.in/connect/success and immediately closes the browser tab!
        const authResult = await WebBrowser.openAuthSessionAsync(
          res.connectUrl,
          'https://social.getaipilot.in'
        );

        console.log('[SocialConnect] openAuthSessionAsync finished:', authResult);

        if (authResult.type === 'success' && authResult.url) {
          try {
            const parsed = new URL(authResult.url);
            const username = parsed.searchParams.get('username') || undefined;
            return { completed: true, username };
          } catch {
            return { completed: true };
          }
        }

        // Even if type is 'dismiss' or 'cancel', the user might have clicked Allow and then dismissed
        return { completed: true };
      } catch (browserErr) {
        console.warn('[SocialConnect] openAuthSessionAsync fallback to openBrowserAsync:', browserErr);
        await WebBrowser.openBrowserAsync(res.connectUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          toolbarColor: '#121214',
          controlsColor: '#EC4899',
        });
        return { completed: true };
      }
    }
  } catch (err: any) {
    console.warn(`[SocialConnect] BFF direct connect failed for ${platform}:`, err?.message);
  }

  // Fallback to handoff
  const handoffTarget = (`connect-${platform}` as SocialHandoffTarget);
  await openSocialHandoff(handoffTarget);
  return { completed: true };
}

