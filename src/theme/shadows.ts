import { Platform } from 'react-native';

export const shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
  }) as any,
  hero: Platform.select({
    web: {
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
  }) as any,
  button: Platform.select({
    web: {
      boxShadow: '0px 3px 6px rgba(0, 60, 51, 0.2)',
    },
    default: {
      shadowColor: '#003C33',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 2,
    },
  }) as any,
  tabActive: Platform.select({
    web: {
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
  }) as any,
};
