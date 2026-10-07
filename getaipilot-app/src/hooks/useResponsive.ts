import { useMemo } from 'react';
import { useWindowDimensions, PixelRatio, Platform } from 'react-native';

export type DeviceType = 'small' | 'medium' | 'large' | 'tablet' | 'desktop';

export interface ResponsiveInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  isSmallDevice: boolean;
  isMediumDevice: boolean;
  isLargeDevice: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPhone: boolean;
  isLandscape: boolean;
  scale: number;
  fontScale: number;
  contentMaxWidth: number;
  columns: number;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  wp: (percentage: number) => number;
  hp: (percentage: number) => number;
  getCardWidth: (options?: { padding?: number; maxCardWidth?: number; minCardWidth?: number }) => number;
}

/**
 * Universal Responsive Hook for React Native & Web
 * Dynamically adapts typography, card widths, grid columns and layout wrappers.
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isLandscape = width > height;
    const isSmallDevice = width < 375;
    const isMediumDevice = width >= 375 && width < 430;
    const isLargeDevice = width >= 430 && width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const isPhone = width < 768;

    let deviceType: DeviceType = 'medium';
    if (isSmallDevice) deviceType = 'small';
    else if (isMediumDevice) deviceType = 'medium';
    else if (isLargeDevice) deviceType = 'large';
    else if (isTablet) deviceType = 'tablet';
    else if (isDesktop) deviceType = 'desktop';

    const columns = isDesktop ? 3 : isTablet ? 2 : 1;
    const contentMaxWidth = isDesktop ? 1200 : isTablet ? 900 : width;

    const scale = PixelRatio.get();
    const fontScale = PixelRatio.getFontScale();

    const wp = (percentage: number) => Math.round((width * percentage) / 100);
    const hp = (percentage: number) => Math.round((height * percentage) / 100);

    const spacing = {
      xs: isSmallDevice ? 4 : 6,
      sm: isSmallDevice ? 8 : 10,
      md: isSmallDevice ? 12 : 16,
      lg: isSmallDevice ? 18 : 24,
      xl: isSmallDevice ? 24 : 32,
    };

    const getCardWidth = (options?: { padding?: number; maxCardWidth?: number; minCardWidth?: number }) => {
      const padding = options?.padding ?? 32;
      const maxWidth = options?.maxCardWidth ?? 360;
      const minWidth = options?.minCardWidth ?? 280;

      if (isDesktop) {
        return Math.min(maxWidth, Math.max(minWidth, Math.round((contentMaxWidth - 64) / 3)));
      }
      if (isTablet) {
        return Math.min(maxWidth, Math.max(minWidth, Math.round((width - 64) / 2)));
      }
      // Mobile screen: card fits comfortably in horizontal carousel or vertical stack
      const availableWidth = width - padding;
      return Math.min(maxWidth, Math.max(minWidth, Math.round(availableWidth * 0.84)));
    };

    return {
      width,
      height,
      deviceType,
      isSmallDevice,
      isMediumDevice,
      isLargeDevice,
      isTablet,
      isDesktop,
      isPhone,
      isLandscape,
      scale,
      fontScale,
      contentMaxWidth,
      columns,
      spacing,
      wp,
      hp,
      getCardWidth,
    };
  }, [width, height]);
}
