import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_CHECK_KEY = '@app_last_version_check';
const DISMISSED_VERSION_KEY = '@app_dismissed_update_version';
const DEFAULT_PACKAGE_NAME = 'com.getaipilot';

export interface AppUpdateInfo {
  isUpdateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  storeUrl: string;
  isMandatory?: boolean;
}

/**
 * Returns currently installed app version (from expoConfig or fallback)
 */
export function getCurrentVersion(): string {
  return Constants?.expoConfig?.version || '1.0.0';
}

/**
 * Returns Android package name or iOS bundle ID
 */
export function getAppPackageName(): string {
  return (
    Constants?.expoConfig?.android?.package ||
    Constants?.expoConfig?.ios?.bundleIdentifier ||
    DEFAULT_PACKAGE_NAME
  );
}

/**
 * Compare two semver strings: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = (v1 || '').replace(/[^0-9.]/g, '');
  const clean2 = (v2 || '').replace(/[^0-9.]/g, '');

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length, 3);

  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Fetch latest version from Google Play Store web listing for Android
 */
async function fetchPlayStoreVersion(packageName: string): Promise<string | null> {
  try {
    const url = `https://play.google.com/store/apps/details?id=${packageName}&hl=en&gl=US`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Mobile Safari/537.36',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const html = await response.text();

    // Google Play Store embeds version in [[["X.Y.Z"]]] or Current Version string patterns
    const match1 = html.match(/\[\[\["([0-9]+\.[0-9]+\.[0-9]+)"\]\]/);
    if (match1 && match1[1]) return match1[1];

    const match2 = html.match(/\["([0-9]+\.[0-9]+\.[0-9]+)"\]/);
    if (match2 && match2[1]) return match2[1];

    const match3 = html.match(/Current Version.*?([0-9]+\.[0-9]+\.[0-9]+)/i);
    if (match3 && match3[1]) return match3[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a newer version of the application is available on Google Play Store
 */
export async function checkForAppUpdate(options?: {
  forceCheck?: boolean;
}): Promise<AppUpdateInfo> {
  const currentVersion = getCurrentVersion();
  const packageName = getAppPackageName();
  const storeUrl = `https://play.google.com/store/apps/details?id=${packageName}`;

  const defaultResult: AppUpdateInfo = {
    isUpdateAvailable: false,
    currentVersion,
    latestVersion: currentVersion,
    storeUrl,
    isMandatory: false,
  };

  // Only run automatic store update checks on native platforms (mainly Android)
  if (Platform.OS === 'web') {
    return defaultResult;
  }

  try {
    // Throttling: avoid hitting network more than once every 6 hours unless forced
    if (!options?.forceCheck) {
      const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
      if (lastCheck) {
        const lastCheckTime = parseInt(lastCheck, 10);
        const hoursPassed = (Date.now() - lastCheckTime) / (1000 * 60 * 60);
        if (hoursPassed < 6) {
          return defaultResult;
        }
      }
    }

    await AsyncStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

    // 1. Check Play Store
    let latestVersion: string | null = null;
    if (Platform.OS === 'android') {
      latestVersion = await fetchPlayStoreVersion(packageName);
    }

    // 2. Fallback to BFF or remote config if available
    if (!latestVersion) {
      try {
        const bffUrl = process.env.EXPO_PUBLIC_BFF_URL || 'https://app.getaipilot.com';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${bffUrl}/api/app-version`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const json = await res.json();
          latestVersion = json.latestVersion || json.version || null;
        }
      } catch {
        // Ignored
      }
    }

    if (!latestVersion) {
      return defaultResult;
    }

    // Check if user previously dismissed this exact version
    const dismissedVersion = await AsyncStorage.getItem(DISMISSED_VERSION_KEY);
    if (dismissedVersion === latestVersion && !options?.forceCheck) {
      return defaultResult;
    }

    const isUpdateAvailable = compareVersions(latestVersion, currentVersion) > 0;

    return {
      isUpdateAvailable,
      currentVersion,
      latestVersion,
      storeUrl,
      isMandatory: false,
    };
  } catch (error) {
    console.warn('[AppUpdateService] Check update error:', error);
    return defaultResult;
  }
}

/**
 * Launch Google Play Store directly to the app details page
 */
export async function openPlayStore(customPackageName?: string): Promise<void> {
  const pkg = customPackageName || getAppPackageName();
  const playStoreUri = `market://details?id=${pkg}`;
  const webUrl = `https://play.google.com/store/apps/details?id=${pkg}`;

  try {
    const supported = await Linking.canOpenURL(playStoreUri);
    if (supported) {
      await Linking.openURL(playStoreUri);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    await Linking.openURL(webUrl);
  }
}

/**
 * Dismiss this version update prompt until another new version is published
 */
export async function dismissVersionUpdate(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_VERSION_KEY, version);
  } catch {
    // Ignored
  }
}

