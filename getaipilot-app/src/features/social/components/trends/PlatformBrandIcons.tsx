import React from 'react';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

interface BrandIconProps {
  size?: number;
  withLightHalo?: boolean;
}

/**
 * Official Pinterest brand icon (red circle + white P pin mark).
 */
export const PinterestBrandIcon: React.FC<BrandIconProps> = ({
  size = 14,
  withLightHalo = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {withLightHalo && <Circle cx="12" cy="12" r="11.75" fill="#FFFFFF" />}
    <Circle cx="12" cy="12" r={withLightHalo ? '10.6' : '11'} fill="#E60023" />
    <Path
      d="M12.17 5.5C8.55 5.5 6.72 7.93 6.72 10.58c0 1.24.66 2.78 1.72 3.27.16.07.25.04.29-.11.03-.11.17-.69.23-.96.02-.08.01-.15-.05-.22-.35-.42-.62-1.19-.62-1.91 0-1.85 1.4-3.64 3.79-3.64 2.06 0 3.51 1.4 3.51 3.4 0 2.26-1.14 3.83-2.62 3.83-.82 0-1.43-.68-1.24-1.51.24-.99.69-2.06.69-2.78 0-.64-.34-1.17-1.06-1.17-.84 0-1.52.87-1.52 2.04 0 .74.25 1.25.25 1.25l-1.01 4.28c-.21.88-.13 2.06-.06 2.86 0 .06.07.09.11.04.06-.07.77-.95 1.01-1.76.09-.29.46-1.78.46-1.78.24.46.94.85 1.69.85 2.22 0 3.83-2.05 3.83-4.6C18.08 7.56 15.69 5.5 12.17 5.5z"
      fill="#FFFFFF"
    />
  </Svg>
);

/**
 * Official YouTube Shorts brand icon (red double-loop S mark + white play triangle).
 */
export const YouTubeShortsBrandIcon: React.FC<BrandIconProps> = ({
  size = 14,
  withLightHalo = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.77 10.32c-.77-.32-1.2-.5-1.2-.5L17.99 9c1.77-1.04 2.38-3.32 1.35-5.1-1.03-1.78-3.3-2.39-5.08-1.35L6.23 7.26c-1.77 1.04-2.38 3.32-1.35 5.1.44.76 1.1 1.32 1.86 1.63l1.19.5-1.42.83c-1.77 1.04-2.38 3.32-1.35 5.1 1.03 1.78 3.3 2.39 5.08 1.35l8.03-4.71c1.77-1.04 2.38-3.32 1.35-5.1a3.7 3.7 0 0 0-1.85-1.64z"
      fill="#FF0000"
      stroke={withLightHalo ? '#FFFFFF' : undefined}
      strokeWidth={withLightHalo ? 1.4 : 0}
      strokeLinejoin="round"
    />
    <Polygon points="10,8.8 15.4,12 10,15.2" fill="#FFFFFF" />
  </Svg>
);
