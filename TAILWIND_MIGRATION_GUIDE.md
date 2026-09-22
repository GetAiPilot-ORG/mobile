# 🎨 GetAiPilot Mobile: Complete Tailwind CSS Migration Guide

**Objective:** Convert entire GetAiPilot Mobile app from inline CSS styles to Tailwind CSS (NativeWind v4) while maintaining perfect light/dark theme support.

**Estimated Time:** 2-4 hours (depending on app size)

---

## PHASE 1: Initial Setup & Configuration (30 mins)

### Step 1.1: Install Dependencies

```bash
# Navigate to your project root
cd mobile

# Install NativeWind
npm install nativewind

# Install Tailwind CSS
npm install -D tailwindcss

# Initialize Tailwind config
npx tailwindcss init

# Verify installations
npm list nativewind tailwindcss
```

**Expected Output:**
```
nativewind@4.x.x
tailwindcss@3.x.x
```

---

### Step 1.2: Create Tailwind Configuration (`tailwind.config.js`)

Replace the entire content of your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // ===== CUSTOM COLORS =====
      colors: {
        // Canvas Backgrounds
        background: {
          light: '#F8F9FA',
          dark: '#000000',
          DEFAULT: '#F8F9FA', // Fallback for light mode
        },
        
        // Surface Cards
        surface: {
          light: '#FFFFFF',
          dark: '#1C1C1E',
          DEFAULT: '#FFFFFF',
        },
        
        // Grouped Surfaces
        'surface-grouped': {
          light: '#F2F4F7',
          dark: '#1C1C1E',
          DEFAULT: '#F2F4F7',
        },
        
        // Borders & Dividers
        border: {
          light: '#E5E7EB',
          dark: '#2C2C2E',
          DEFAULT: '#E5E7EB',
        },
        
        'border-dark': '#3A3A3C',
        
        // Text Colors
        foreground: {
          light: '#000000',
          dark: '#FFFFFF',
          DEFAULT: '#000000',
        },
        
        'foreground-muted': {
          light: '#6B7280',
          dark: '#8E8E93',
          DEFAULT: '#6B7280',
        },
        
        // Brand Colors (Stay consistent in both modes)
        'primary': '#0084FF',
        'primary-light': '#EBF5FF',
        'primary-dark': '#0B2942',
        
        'destructive': '#DC2626',
        'destructive-light': '#FEE2E2',
        'destructive-dark': '#3D0000',
        
        success: {
          light: '#16A34A',
          dark: '#30D158',
          DEFAULT: '#16A34A',
        },
        
        'success-light': '#F0FDF4',
        'success-dark': '#0B2D1B',
        
        warning: {
          light: '#F59E0B',
          dark: '#F59E0B',
          DEFAULT: '#F59E0B',
        },
        
        'warning-light': '#FFFBEB',
        'warning-dark': '#332700',
        
        // Product Accent Colors
        'product-whatsapp': '#25D366',
        'product-whatsapp-dark': '#075E54',
        
        'product-telegram': '#229ED9',
        'product-telegram-dark': '#0088CC',
        
        'product-voice': '#8B5CF6',
        'product-voice-dark': '#6D28D9',
        
        'product-social': '#E1306C',
        'product-social-dark': '#C13584',
        
        'product-crm': '#F59E0B',
        'product-crm-dark': '#B45309',
      },

      // ===== CUSTOM SPACING =====
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        xxl: '32px',
        xxxl: '48px',
      },

      // ===== CUSTOM BORDER RADIUS =====
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        full: '999px',
      },

      // ===== CUSTOM FONT SIZES & LINE HEIGHTS =====
      fontSize: {
        'display-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'display-md': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'headline-lg': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-md': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '16px', fontWeight: '600' }],
      },

      // ===== CUSTOM SHADOWS (for light mode) =====
      boxShadow: {
        'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
        'shadow-md': '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        'shadow-lg': '0 4px 8px 0 rgba(0, 0, 0, 0.12)',
      },

      // ===== RESPONSIVE BREAKPOINTS =====
      screens: {
        sm: '380px',   // Mobile
        md: '768px',   // Tablet
        lg: '1024px',  // Landscape tablet
      },
    },
  },
  plugins: [],
};
```

---

### Step 1.3: Create Global CSS File (`global.css`)

Create a new file at your project root or `src/` directory:

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ===== LAYER: Base =====  */
@layer base {
  /* Default light mode styles */
  :root {
    --color-background: #F8F9FA;
    --color-surface: #FFFFFF;
    --color-surface-grouped: #F2F4F7;
    --color-border: #E5E7EB;
    --color-foreground: #000000;
    --color-foreground-muted: #6B7280;
  }

  /* Dark mode overrides */
  .dark {
    --color-background: #000000;
    --color-surface: #1C1C1E;
    --color-surface-grouped: #1C1C1E;
    --color-border: #2C2C2E;
    --color-foreground: #FFFFFF;
    --color-foreground-muted: #8E8E93;
  }
}

/* ===== LAYER: Components (Reusable classes) ===== */
@layer components {
  /* Card base style */
  .card-base {
    @apply bg-surface border border-border rounded-md;
  }

  /* Text base styles */
  .text-display-lg {
    @apply text-display-lg font-bold;
  }

  .text-headline-lg {
    @apply text-headline-lg font-semibold;
  }

  .text-body-md {
    @apply text-body-md font-normal;
  }

  /* Button base styles */
  .btn-base {
    @apply rounded-md items-center justify-center font-semibold;
  }

  .btn-primary {
    @apply btn-base bg-primary text-white;
  }

  .btn-secondary {
    @apply btn-base bg-surface border border-border text-foreground;
  }

  .btn-destructive {
    @apply btn-base bg-destructive text-white;
  }

  .btn-ghost {
    @apply btn-base bg-transparent text-primary;
  }

  /* Input base styles */
  .input-base {
    @apply rounded-md px-lg py-md font-body-md bg-surface border border-border;
  }

  .input-filled {
    @apply rounded-md px-lg py-md font-body-md bg-surface-grouped border-0;
  }
}

/* ===== LAYER: Utilities (Custom utilities) ===== */
@layer utilities {
  /* Flex centering utilities */
  .flex-center {
    @apply flex items-center justify-center;
  }

  .flex-between {
    @apply flex items-center justify-between;
  }

  /* Gap utilities using custom spacing */
  .gap-xs {
    @apply gap-xs;
  }

  .gap-sm {
    @apply gap-sm;
  }

  .gap-md {
    @apply gap-md;
  }

  .gap-lg {
    @apply gap-lg;
  }

  /* Padding utilities */
  .p-xs {
    @apply p-xs;
  }

  .p-sm {
    @apply p-sm;
  }

  .p-md {
    @apply p-md;
  }

  .p-lg {
    @apply p-lg;
  }

  /* Margin utilities */
  .m-xs {
    @apply m-xs;
  }

  .m-sm {
    @apply m-sm;
  }

  .m-md {
    @apply m-md;
  }

  .m-lg {
    @apply m-lg;
  }

  /* Safe area padding for notches */
  .safe-area-top {
    @apply pt-lg;
  }

  .safe-area-bottom {
    @apply pb-lg;
  }
}
```

---

### Step 1.4: Import Global CSS in Root Layout

Update your `app/_layout.tsx`:

```tsx
// app/_layout.tsx
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import '../src/global.css'; // ← Import Tailwind CSS
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { queryClient } from '../src/core/api/queryClient';
import RootNavigator from './RootNavigator';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter_18pt-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter_18pt-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

---

## PHASE 2: Update Theme Context (20 mins)

### Step 2.1: Enhanced ThemeContext with Tailwind Support

```tsx
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  tailwindClass: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    border: string;
    foreground: string;
    mutedForeground: string;
    primary: string;
    success: string;
    warning: string;
    destructive: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(deviceColorScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('@gap_app_theme_mode');
        if (saved) {
          setThemeMode(saved as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(deviceColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
    
    AsyncStorage.setItem('@gap_app_theme_mode', themeMode).catch(console.error);
  }, [themeMode, deviceColorScheme]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        setIsDark(colorScheme === 'dark');
      }
    });

    return () => subscription.remove();
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const colors = {
    background: isDark ? '#000000' : '#F8F9FA',
    surface: isDark ? '#1C1C1E' : '#FFFFFF',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
    foreground: isDark ? '#FFFFFF' : '#000000',
    mutedForeground: isDark ? '#8E8E93' : '#6B7280',
    primary: '#0084FF',
    success: isDark ? '#30D158' : '#16A34A',
    warning: '#F59E0B',
    destructive: '#DC2626',
  };

  const value: ThemeContextType = {
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
    tailwindClass: isDark ? 'dark' : 'light',
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

---

## PHASE 3: Create Tailwind-Based Components (1 hour)

### Step 3.1: AppScreen Component (`src/components/AppScreen.tsx`)
### Step 3.2: Button Component (`src/components/Button.tsx`)
### Step 3.3: Card Component (`src/components/Card.tsx`)
### Step 3.4: Input Component (`src/components/Input.tsx`)
### Step 3.5: AppTopBar Component (`src/components/AppTopBar.tsx`)

---

## PHASE 4: Migrate Existing Screens (1-2 hours)

### Step 4.1: Home Screen Migration (`app/(tabs)/index.tsx`)
### Step 4.2: VoicePilot Screen Migration (`app/products/voice.tsx`)
### Step 4.3: WhatsApp Screen Migration (`app/products/whatsapp/index.tsx`)
### Step 4.4: Account/Settings Screen Migration (`app/account/customize.tsx`)
### Step 4.5: FloatingTabBar Component (`src/components/FloatingTabBar.tsx`)

---

## PHASE 5: Testing & Validation (30 mins)

### Step 5.1: Manual Testing Checklist
### Step 5.2: Automated Color Contrast Test (`src/utils/colorContrast.ts`)
### Step 5.3: Theme Test Panel (`src/components/ThemeTestPanel.tsx`)

---

## PHASE 6: Cleanup & Optimization (30 mins)

### Step 6.1: Deprecate Legacy Style Objects
### Step 6.2: Create Migration Tracker (`MIGRATION_STATUS.md`)
### Step 6.3: Update Documentation (`docs/TAILWIND_GUIDE.md`)

---

## PHASE 7: Final Verification Checklist
