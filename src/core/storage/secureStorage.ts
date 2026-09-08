import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export class SecureStorage {
  public static async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (e) {
      console.warn(`[SecureStorage] Failed to set item for key: ${key}`, e);
    }
  }

  public static async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn(`[SecureStorage] Failed to get item for key: ${key}`, e);
      return null;
    }
  }

  public static async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      console.warn(`[SecureStorage] Failed to remove item for key: ${key}`, e);
    }
  }
}
