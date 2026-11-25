import { Ionicons } from '@expo/vector-icons';

export interface ChannelMeta {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_ID_REGEX = /^[0-9a-f]{20,}$/i;
const NUMERIC_ID_REGEX = /^\d{10,}$/;

/**
 * Filter out raw database UUIDs or internal IDs from channel lists and return clean platform names
 */
export const filterAndNormalizeChannels = (rawChannels: any): string[] => {
  if (!rawChannels) return ['social'];
  const list = Array.isArray(rawChannels)
    ? rawChannels
    : typeof rawChannels === 'string'
    ? [rawChannels]
    : [];

  const platforms = new Set<string>();

  for (const item of list) {
    if (!item) continue;
    const str = String(item).trim();
    if (!str) continue;

    // Skip if the item itself is an internal UUID or numeric ID
    if (UUID_REGEX.test(str) || HEX_ID_REGEX.test(str) || NUMERIC_ID_REGEX.test(str)) {
      continue;
    }

    // Handle "platform:accountId" format (e.g. "instagram:a385cccb-...")
    let base = str;
    if (str.includes(':')) {
      const parts = str.split(':');
      if (parts[0].toLowerCase() === 'account') {
        base = parts[1] || '';
      } else {
        base = parts[0];
      }
    }

    // Skip if base part is a UUID or hex hash
    if (UUID_REGEX.test(base) || HEX_ID_REGEX.test(base) || NUMERIC_ID_REGEX.test(base)) {
      continue;
    }

    const clean = base.toLowerCase();
    if (clean.includes('youtube')) platforms.add('youtube');
    else if (clean.includes('instagram')) platforms.add('instagram');
    else if (clean.includes('facebook')) platforms.add('facebook');
    else if (clean.includes('x') || clean.includes('twitter')) platforms.add('x');
    else if (clean.includes('linkedin')) platforms.add('linkedin');
    else if (clean.includes('pinterest')) platforms.add('pinterest');
    else if (clean.includes('tiktok')) platforms.add('tiktok');
    else if (clean.includes('threads')) platforms.add('threads');
    else if (clean.includes('bluesky')) platforms.add('bluesky');
    else if (clean.includes('mastodon')) platforms.add('mastodon');
    else if (clean.includes('reddit')) platforms.add('reddit');
    else if (clean.includes('google')) platforms.add('google');
    else if (clean && clean !== 'social' && !/^[0-9a-f-]+$/i.test(clean)) {
      platforms.add(clean);
    }
  }

  const result = Array.from(platforms);
  return result.length > 0 ? result : ['social'];
};

export const getChannelMeta = (channelKey: string): ChannelMeta => {
  const clean = (channelKey || '').toLowerCase();
  if (clean.includes('youtube')) {
    return { name: 'YouTube', icon: 'logo-youtube', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  }
  if (clean.includes('instagram')) {
    return { name: 'Instagram', icon: 'logo-instagram', color: '#e1306c', bg: 'rgba(225, 48, 108, 0.12)' };
  }
  if (clean.includes('facebook')) {
    return { name: 'Facebook', icon: 'logo-facebook', color: '#1877f2', bg: 'rgba(24, 119, 242, 0.12)' };
  }
  if (clean.includes('x') || clean.includes('twitter')) {
    return { name: 'X', icon: 'logo-twitter', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
  }
  if (clean.includes('linkedin')) {
    return { name: 'LinkedIn', icon: 'logo-linkedin', color: '#0a66c2', bg: 'rgba(10, 102, 194, 0.12)' };
  }
  if (clean.includes('pinterest')) {
    return { name: 'Pinterest', icon: 'logo-pinterest', color: '#e60023', bg: 'rgba(230, 0, 35, 0.12)' };
  }
  if (clean.includes('tiktok')) {
    return { name: 'TikTok', icon: 'videocam', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
  }
  if (clean.includes('threads')) {
    return { name: 'Threads', icon: 'at-outline', color: '#9333ea', bg: 'rgba(147, 51, 234, 0.12)' };
  }
  if (clean.includes('bluesky')) {
    return { name: 'Bluesky', icon: 'cloud-outline', color: '#0285FF', bg: 'rgba(2, 133, 255, 0.12)' };
  }
  if (clean.includes('reddit')) {
    return { name: 'Reddit', icon: 'logo-reddit', color: '#ff4500', bg: 'rgba(255, 69, 0, 0.12)' };
  }

  // Never leak a UUID or ID as the name
  if (UUID_REGEX.test(channelKey) || HEX_ID_REGEX.test(channelKey) || NUMERIC_ID_REGEX.test(channelKey)) {
    return { name: 'Social', icon: 'share-social', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' };
  }

  const rawName = channelKey.includes(':') ? channelKey.split(':')[0] : channelKey;
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  return { name: displayName, icon: 'share-social', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' };
};

export const getStatusMeta = (status: string): StatusMeta => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'sent':
    case 'published':
      return { label: 'Published', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.14)', icon: 'checkmark-circle' };
    case 'failed':
      return { label: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', icon: 'alert-circle' };
    case 'scheduled':
    case 'queued':
      return { label: 'Scheduled', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)', icon: 'time' };
    case 'processing':
      return { label: 'Processing', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', icon: 'sync' };
    case 'cancelled':
      return { label: 'Cancelled', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.14)', icon: 'close-circle' };
    default:
      return { label: status || 'Pending', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.14)', icon: 'time' };
  }
};

/**
 * Strips technical IDs, UUIDs, attempt numbers, internal error wrappers, and converts
 * raw platform errors into friendly, professional user-facing messages.
 */
export const formatUserFriendlyError = (rawError?: string | null, platformHint?: string | null): string => {
  if (!rawError) return '';
  let err = String(rawError).trim();
  if (!err) return '';

  // 1. Strip retry/attempt prefixes like "[Attempt 5]" or "Attempt 3:"
  err = err.replace(/^\[Attempt\s+\d+(?:\/\d+)?\]\s*/i, '');
  err = err.replace(/^Attempt\s+\d+:\s*/i, '');

  // 2. Strip internal prefixes like "REAUTH_REQUIRED: " or "Platform publishing failed - "
  err = err.replace(/^REAUTH_REQUIRED:\s*/i, '');
  err = err.replace(/^Platform publishing failed\s*-\s*/i, '');
  err = err.replace(/^Publishing failed\s*-\s*/i, '');

  // 3. Remove platform:UUID prefixes like "instagram:a385cccb-7124-4e6e-a175-b8e21d4a5253: "
  err = err.replace(/(?:^|\s*\|\s*)([a-zA-Z0-9_-]+):[0-9a-fA-F-]{8,}(?::\s*|\s*-\s*)/gi, (_m, p) => {
    const pName = p.charAt(0).toUpperCase() + p.slice(1);
    return `${pName}: `;
  });

  // 4. Remove any remaining raw UUIDs (e.g. 9bf6cb5f-c3af-4738-8787-42f94eb5a446)
  err = err.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '');

  // 5. Clean repetitive phrases like "Instagram: Instagram publishing failed: "
  err = err.replace(/Instagram:\s*Instagram publishing failed:\s*/gi, 'Instagram: ');
  err = err.replace(/Facebook:\s*Facebook (?:posting|publishing) failed:\s*/gi, 'Facebook: ');
  err = err.replace(/YouTube:\s*YouTube (?:upload|publishing) failed:\s*/gi, 'YouTube: ');
  err = err.replace(/Pinterest:\s*Pinterest (?:pin|publishing) failed:\s*/gi, 'Pinterest: ');
  err = err.replace(/X:\s*X (?:posting|publishing) failed:\s*/gi, 'X: ');

  // 6. Try parsing JSON error bodies if any (e.g. {"error":{"message":"..."}})
  if (err.includes('{"') && err.includes('}')) {
    try {
      const match = err.match(/\{.*?\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const msg = parsed?.error?.message || parsed?.message;
        if (msg) {
          err = err.replace(match[0], msg);
        }
      }
    } catch {}
  }

  // 7. Check for semantic error patterns and provide friendly, helpful descriptions
  const lower = err.toLowerCase();
  const targetPlatform = (platformHint || (lower.includes('instagram') ? 'instagram' : lower.includes('youtube') ? 'youtube' : lower.includes('facebook') ? 'facebook' : '')).toLowerCase();

  // Authentication / Token / Reconnect errors
  if (
    lower.includes('invalid access token') ||
    lower.includes('session has expired') ||
    lower.includes('session has been invalidated') ||
    lower.includes('error validating access token') ||
    lower.includes('token expired') ||
    lower.includes('invalid_grant') ||
    lower.includes('reauth_required')
  ) {
    if (targetPlatform === 'instagram' || lower.includes('instagram')) {
      return 'Instagram session expired. Please reconnect your Instagram account in Channels.';
    }
    if (targetPlatform === 'facebook' || lower.includes('facebook')) {
      return 'Facebook authorization expired. Please reconnect Facebook in Channels.';
    }
    if (targetPlatform === 'youtube' || lower.includes('youtube')) {
      return 'Google account authorization expired. Please reconnect YouTube in Channels.';
    }
    return 'Account authorization expired. Please reconnect this account in Channels.';
  }

  // YouTube missing channel
  if (
    lower.includes('channelnotfound') ||
    lower.includes('youtubesignuprequired') ||
    lower.includes('no youtube channel') ||
    (lower.includes('404') && (lower.includes('youtube') || targetPlatform === 'youtube'))
  ) {
    return 'No YouTube channel found for this account. Create a channel on YouTube and reconnect.';
  }

  // Rate limit / Quota
  if (
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('quotaexceeded') ||
    lower.includes('user request limit reached')
  ) {
    return 'Publishing rate limit reached for this platform. Please wait a few moments before retrying.';
  }

  // Missing media / 404 download / temporary storage
  if (
    lower.includes('media download') ||
    lower.includes('missing media') ||
    lower.includes('expired in temporary storage') ||
    lower.includes('failed to download media') ||
    lower.includes('publicly accessible https url')
  ) {
    return 'Media file could not be processed or has expired. Please re-upload media and retry.';
  }

  // Aspect ratio / Video container / Format requirements
  if (
    lower.includes('aspect ratio') ||
    lower.includes('video container') ||
    lower.includes('format requirements') ||
    lower.includes('resolution') ||
    lower.includes('dimensions')
  ) {
    return 'Media format or aspect ratio is not supported by the platform. Please check format requirements.';
  }

  // Permissions / Not authorized
  if (
    lower.includes('permission') ||
    lower.includes('insufficient permissions') ||
    lower.includes('not authorized') ||
    lower.includes('requires permission') ||
    lower.includes('403')
  ) {
    return 'Insufficient platform permissions to publish. Please check account permissions.';
  }

  // Network / Gateway timeout
  if (
    lower.includes('etimedout') ||
    lower.includes('econnreset') ||
    lower.includes('network error') ||
    lower.includes('gateway timeout') ||
    lower.includes('504') ||
    lower.includes('502') ||
    lower.includes('503')
  ) {
    return 'Platform service temporarily unreachable. Please retry shortly.';
  }

  // Truncated "Ins..." or similar incomplete failure message from database
  if (/^Instagram:\s*(?:Ins\.{0,3}|publishing failed\.{0,3}|failed\.{0,3})?$/i.test(err)) {
    return 'Instagram: Publishing failed. Please verify account permissions in Channels.';
  }

  // Clean trailing punctuation or empty colons like "Instagram: "
  err = err
    .replace(/:\s*:\s*/g, ': ')
    .replace(/^\s*:\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If after stripping it's empty or just says "Failed", provide a standard message
  if (!err || err === 'Failed' || err.endsWith(':')) {
    return 'Platform publishing encountered an issue. Please retry or check account connection.';
  }

  return err;
};
