import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { TrendItem } from '../../types';

const STORAGE_KEY = '@socialpilot_saved_trends_v1';

export function useSavedTrends() {
  const [savedTrends, setSavedTrends] = useState<TrendItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && isMounted) {
          const parsed: TrendItem[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSavedTrends(parsed);
            setSavedIds(new Set(parsed.map((item) => item.id).filter(Boolean)));
          }
        }
      } catch (err) {
        console.warn('[useSavedTrends] Failed to load saved trends:', err);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to AsyncStorage whenever state changes
  const persistTrends = useCallback(async (updated: TrendItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[useSavedTrends] Failed to persist saved trends:', err);
    }
  }, []);

  const isSaved = useCallback(
    (id: string) => {
      if (!id) return false;
      return savedIds.has(id);
    },
    [savedIds]
  );

  const toggleSave = useCallback(
    async (trend: TrendItem) => {
      if (!trend?.id) return false;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      let nextSaved: TrendItem[];
      let currentlySaved = false;

      if (savedIds.has(trend.id)) {
        // Remove
        nextSaved = savedTrends.filter((item) => item.id !== trend.id);
        currentlySaved = false;
      } else {
        // Add
        nextSaved = [trend, ...savedTrends];
        currentlySaved = true;
      }

      setSavedTrends(nextSaved);
      setSavedIds(new Set(nextSaved.map((item) => item.id).filter(Boolean)));
      await persistTrends(nextSaved);
      return currentlySaved;
    },
    [savedIds, savedTrends, persistTrends]
  );

  const removeSaved = useCallback(
    async (id: string) => {
      if (!id) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextSaved = savedTrends.filter((item) => item.id !== id);
      setSavedTrends(nextSaved);
      setSavedIds(new Set(nextSaved.map((item) => item.id).filter(Boolean)));
      await persistTrends(nextSaved);
    },
    [savedTrends, persistTrends]
  );

  return {
    savedTrends,
    savedIds,
    savedCount: savedTrends.length,
    isLoaded,
    isSaved,
    toggleSave,
    removeSaved,
  };
}

