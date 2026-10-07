import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function toSafeKey(key: string): string {
  // Expo SecureStore keys must only contain alphanumeric characters, '.', '-', and '_'
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export class SecureStorage {
  public static async setItem(key: string, value: string): Promise<void> {
    const safeKey = toSafeKey(key);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(safeKey, value);
      } else {
        await SecureStore.setItemAsync(safeKey, value);
      }
    } catch (e) {
      console.warn(`[SecureStorage] Failed to set item for key: ${key}`, e);
    }
  }

  public static async getItem(key: string): Promise<string | null> {
    const safeKey = toSafeKey(key);
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(safeKey);
      }
      return await SecureStore.getItemAsync(safeKey);
    } catch (e) {
      console.warn(`[SecureStorage] Failed to get item for key: ${key}`, e);
      return null;
    }
  }

  public static async removeItem(key: string): Promise<void> {
    const safeKey = toSafeKey(key);
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(safeKey);
      } else {
        await SecureStore.deleteItemAsync(safeKey);
      }
    } catch (e) {
      console.warn(`[SecureStorage] Failed to remove item for key: ${key}`, e);
    }
  }
}
