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
      // ===== CUSTOM COLORS =====
      colors: {
        // Canvas Backgrounds
        background: {
          light: '#F8F9FA',
          dark: '#000000',
          DEFAULT: '#F8F9FA',
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
          dark: '#262C36',
          DEFAULT: '#E5E7EB',
        },
        
        'border-dark': '#262C36',
        'card-dark': '#161B22',
        'card-border-dark': '#262C36',
        'pricing-dark': '#0F172A',
        'pricing-border-dark': '#1E293B',
        'pricing-border-light': '#E2E8F0',
        'track-light': '#E3E3E8',
        'track-dark': '#161B22',
        'tab-active-dark': '#262C36',
        
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
        
        // Brand Colors
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

      borderWidth: {
        hairline: '0.5px',
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

      // ===== CUSTOM SHADOWS =====
      boxShadow: {
        'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
        'shadow-md': '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        'shadow-lg': '0 4px 8px 0 rgba(0, 0, 0, 0.12)',
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
