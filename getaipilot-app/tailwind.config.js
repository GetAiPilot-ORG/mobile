/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // ===== APPLE CORE & CUSTOM COLORS =====
      colors: {
        // Apple Palette Tokens
        'gallery-white': '#ffffff',
        'studio-mist': '#f0eef8',
        'paper-frost': '#f8f7fc',
        'hairline-silver': '#e9e6f2',
        'control-gray': '#e6e6e8',
        'ink': '#1d1d1f',
        'slate': '#707070',
        'steel': '#86868b',
        'apple-blue': '#6c55c5',
        'pricing-blue': '#17171c',
        'launch-orange': '#b64400',

        // Canvas Backgrounds
        background: {
          light: '#f5f3fb',
          dark: '#14131b',
          DEFAULT: '#f5f3fb',
        },
        
        // Surface Cards (Gallery White / Studio Mist)
        surface: {
          light: '#ffffff',
          dark: '#0a0a0c',
          DEFAULT: '#ffffff',
        },
        
        // Grouped Surfaces
        'surface-grouped': {
          light: '#f0eef8',
          dark: '#121214',
          DEFAULT: '#f0eef8',
        },
        
        // Borders & Dividers
        border: {
          light: '#e9e6f2',
          dark: '#2c2c2e',
          DEFAULT: '#e9e6f2',
        },
        
        'border-dark': '#2c2c2e',
        'card-dark': '#0a0a0c',
        'card-border-dark': '#2c2c2e',
        'pricing-dark': '#0a0a0c',
        'pricing-border-dark': '#2c2c2e',
        'pricing-border-light': '#e9e6f2',
        'track-light': '#e6e6e8',
        'track-dark': '#121214',
        'tab-active-dark': '#121214',
        
        // Text Colors
        foreground: {
          light: '#1d1d1f',
          dark: '#f0eef8',
          DEFAULT: '#1d1d1f',
        },
        
        'foreground-muted': {
          light: '#707070',
          dark: '#86868b',
          DEFAULT: '#707070',
        },
        
        // Brand & Conversion Colors (Apple Blue & Pricing Blue)
        'primary': '#17171c',
        'primary-light': '#ebf5ff',
        'primary-dark': '#6c55c5',
        
        'destructive': '#d70015',
        'destructive-light': '#feeff0',
        'destructive-dark': '#3d0006',
        
        success: {
          light: '#16a34a',
          dark: '#30d158',
          DEFAULT: '#16a34a',
        },
        
        'success-light': '#f0fdf4',
        'success-dark': '#0b2d1b',
        
        warning: {
          light: '#b64400',
          dark: '#ff9f0a',
          DEFAULT: '#b64400',
        },
        
        'warning-light': '#fff8f0',
        'warning-dark': '#331300',
        
        // Product Accent Colors
        'product-whatsapp': '#25d366',
        'product-whatsapp-dark': '#075e54',
        
        'product-telegram': '#229ed9',
        'product-telegram-dark': '#0088cc',
        
        'product-voice': '#8b5cf6',
        'product-voice-dark': '#6d28d9',
        
        'product-social': '#e1306c',
        'product-social-dark': '#c13584',
        
        'product-crm': '#f59e0b',
        'product-crm-dark': '#b45309',
      },

      // ===== APPLE TYPOGRAPHY FAMILIES =====
      fontFamily: {
        'sf-pro-display': ['SF Pro Display', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'sf-pro-text': ['SF Pro Text', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'arial': ['Arial', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // ===== APPLE SPACING SCALE =====
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        xxl: '24px',
        xxxl: '32px',
        28: '28px',
        40: '40px',
        48: '48px',
        52: '52px',
        64: '64px',
        76: '76px',
        80: '80px',
        90: '90px',
        128: '128px',
        144: '144px',
      },

      // ===== APPLE BORDER RADIUS =====
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '10px',
        lg: '16px',
        navigation: '20px',
        cards: '28px',
        images: '28px',
        pills: '36px',
        inputs: '18px',
        buttons: '9999px',
        full: '9999px',
      },

      borderWidth: {
        hairline: '0.5px',
        1: '1px',
      },

      // ===== APPLE TYPE SCALE & LETTER SPACING =====
      fontSize: {
        'hero-display': ['80px', { lineHeight: '84px', letterSpacing: '-1.2px', fontWeight: '600' }],
        'feature-heading': ['40px', { lineHeight: '40px', letterSpacing: '0px', fontWeight: '600' }],
        'product-kicker': ['21px', { lineHeight: '21px', letterSpacing: '0.231px', fontWeight: '600' }],
        'product-nav-title': ['19px', { lineHeight: '23px', letterSpacing: '0.228px', fontWeight: '600' }],
        'body': ['17px', { lineHeight: '25px', letterSpacing: '-0.374px', fontWeight: '400' }],
        'feature-copy': ['17px', { lineHeight: '21px', letterSpacing: '-0.374px', fontWeight: '400' }],
        'body-small': ['14px', { lineHeight: '18px', letterSpacing: '-0.224px', fontWeight: '400' }],
        'compact-control': ['12px', { lineHeight: '16px', letterSpacing: '-0.12px', fontWeight: '400' }],
        'global-nav': ['12px', { lineHeight: '12px', letterSpacing: '-0.12px', fontWeight: '400' }],

        // Compatibility aliases
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

      // ===== APPLE SHADOWS & OUTLINES =====
      boxShadow: {
        'none': 'none',
        'subtle': '0 0 0 1px rgb(230, 230, 232)',
        'subtle-2': '0 0 0 1px rgb(134, 134, 139)',
        'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'shadow-md': '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'shadow-lg': '0 4px 8px 0 rgba(0, 0, 0, 0.08)',
      },

      // ===== RESPONSIVE BREAKPOINTS =====
      screens: {
        sm: '380px',
        md: '768px',
        lg: '1024px',
      },
    },
  },
  plugins: [],
};
