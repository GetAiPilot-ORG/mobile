import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { apiClient } from '../../../core/api/client';
import { supabase } from '../../../lib/supabase';

export type SocialHandoffTarget =
  | 'new-post'
  | 'schedule'
  | 'builder'
  | 'upload-short'
  | 'new-automation';

export const SOCIAL_TARGET_URLS: Record<SocialHandoffTarget, string> = {
  'new-post': 'https://social.getaipilot.in/dashboard',
  'schedule': 'https://social.getaipilot.in/dashboard/queue',
  'builder': 'https://social.getaipilot.in/dashboard/instapilot?mode=builder',
  'upload-short': 'https://social.getaipilot.in/dashboard/compose',
  'new-automation': 'https://social.getaipilot.in/dashboard/auto-dm/automations/new',
};

export const SOCIAL_TOOL_KEYS: Record<SocialHandoffTarget, string> = {
  'new-post': 'social-post',
  'schedule': 'social-schedule',
  'builder': 'social-builder',
  'upload-short': 'social-compose',
  'new-automation': 'social-automation',
};

/**
 * Seamlessly opens SocialPilot in the user's mobile browser with an authenticated SSO session.
 * Automatically deep-links to the exact tool/screen requested.
 */
export async function openSocialHandoff(
  target: SocialHandoffTarget,
  customWebAppUrl?: string,
): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}

  const directUrl = SOCIAL_TARGET_URLS[target];

  // 1. Primary: Generate SSO handoff consumed in getaipilot.in (/auth/handoff)
  try {
    const webAppUrl = customWebAppUrl || 'https://getaipilot.in';
    const { data, error } = await supabase.functions.invoke<{
      targetUrl: string;
      redirectPath?: string;
      webAppBaseUrl?: string;
    }>('web-handoff', {
      body: {
        targetTool: SOCIAL_TOOL_KEYS[target],
        clientId: SOCIAL_TOOL_KEYS[target],
        webAppUrl,
      },
    });

    if (!error && data?.targetUrl) {
      console.log(`[SocialSSO] Opening getaipilot.in handoff URL for ${target}:`, data.targetUrl);
      await Linking.openURL(data.targetUrl);
      return;
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
      await Linking.openURL(res.ssoUrl);
      return;
    }
  } catch (bffErr) {
    console.warn(`[SocialSSO] BFF fallback failed for ${target}:`, bffErr);
  }

  // 3. Fallback: Direct external link
  try {
    console.log(`[SocialSSO] Opening direct fallback URL for ${target}:`, directUrl);
    await Linking.openURL(directUrl);
  } catch (err) {
    console.error(`[SocialSSO] Failed to open external URL for ${target}:`, err);
    Alert.alert('Unable to open browser', 'Please check your internet connection and try again.');
  }
}
