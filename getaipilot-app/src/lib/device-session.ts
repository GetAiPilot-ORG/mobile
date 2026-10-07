import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { SecureStorage } from '../core/storage/secureStorage';

const INSTALLATION_ID_KEY = '@gap_device_installation_id';

export interface DeviceLoginInfo {
  installationId: string;
  platform: 'ios' | 'android' | 'web';
  deviceName: string;
  deviceType: 'phone' | 'tablet' | 'desktop' | 'tv' | 'unknown';
  osVersion?: string;
  appVersion?: string;
}

function createInstallationId(): string {
  // This identifies this app installation, not the physical device. It is
  // intentionally random rather than relying on a hardware identifier.
  const random = Math.random().toString(36).slice(2);
  return `installation_${Date.now().toString(36)}_${random}`;
}

function getDeviceType(): DeviceLoginInfo['deviceType'] {
  switch (Device.deviceType) {
    case Device.DeviceType.PHONE:
      return 'phone';
    case Device.DeviceType.TABLET:
      return 'tablet';
    case Device.DeviceType.DESKTOP:
      return 'desktop';
    case Device.DeviceType.TV:
      return 'tv';
    default:
      return 'unknown';
  }
}

export async function getDeviceLoginInfo(): Promise<DeviceLoginInfo> {
  let installationId = await SecureStorage.getItem(INSTALLATION_ID_KEY);
  if (!installationId) {
    installationId = createInstallationId();
    await SecureStorage.setItem(INSTALLATION_ID_KEY, installationId);
  }

  const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
  const fallbackName = platform === 'web' ? 'Web browser' : `${platform === 'ios' ? 'iOS' : 'Android'} device`;

  return {
    installationId,
    platform,
    deviceName: Device.deviceName || Device.modelName || fallbackName,
    deviceType: getDeviceType(),
    osVersion: Device.osVersion || undefined,
    appVersion: Constants.expoConfig?.version || undefined,
  };
}
