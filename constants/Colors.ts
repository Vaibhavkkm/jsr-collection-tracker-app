/**
 * Premium Collection Tracker Theme System
 * Dark theme with gold accents, Light theme with blue accents
 */

// Premium Colors
export const Colors = {
  dark: {
    // Backgrounds
    background: '#1a1a2e',
    surface: '#2a2a4e',
    surfaceElevated: '#3a3a5e',
    
    // Text
    text: '#ffffff',
    textSecondary: '#a0a0c0',
    textMuted: '#6b6b8a',
    
    // Accent & Actions
    accent: '#d4af37',
    accentLight: '#e6c65a',
    primary: '#4a90d4',
    
    // Status
    success: '#00c853',
    successLight: '#e8f5e9',
    warning: '#ff9800',
    error: '#ff5252',
    errorLight: '#ffebee',
    
    // Cards & UI
    card: '#2a2a4e',
    cardBorder: '#3a3a5e',
    divider: '#3a3a5e',
    
    // Tab Bar
    tabBar: '#1a1a2e',
    tabIconDefault: '#6b6b8a',
    tabIconSelected: '#d4af37',
    
    // Buttons
    buttonPrimary: '#d4af37',
    buttonPrimaryText: '#1a1a2e',
    buttonSecondary: '#3a3a5e',
    buttonSecondaryText: '#ffffff',
    buttonSuccess: '#00c853',
    buttonSuccessText: '#ffffff',
    buttonSkip: '#6b6b8a',
    buttonSkipText: '#ffffff',
  },
  light: {
    // Backgrounds
    background: '#f8f9fa',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    
    // Text
    text: '#1a1a2e',
    textSecondary: '#666680',
    textMuted: '#9999aa',
    
    // Accent & Actions
    accent: '#2563eb',
    accentLight: '#3b82f6',
    primary: '#2563eb',
    
    // Status
    success: '#00c853',
    successLight: '#e8f5e9',
    warning: '#ff9800',
    error: '#ff5252',
    errorLight: '#ffebee',
    
    // Cards & UI
    card: '#ffffff',
    cardBorder: '#e8e8ef',
    divider: '#e8e8ef',
    
    // Tab Bar
    tabBar: '#ffffff',
    tabIconDefault: '#9999aa',
    tabIconSelected: '#2563eb',
    
    // Buttons
    buttonPrimary: '#2563eb',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#e8e8ef',
    buttonSecondaryText: '#1a1a2e',
    buttonSuccess: '#00c853',
    buttonSuccessText: '#ffffff',
    buttonSkip: '#9999aa',
    buttonSkipText: '#ffffff',
  },
};

// Spacing system (based on 8dp grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Font Sizes
export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
};

// Font Weights
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Shadows (for iOS and Android)
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Touch targets (minimum 48dp, preferred 56dp)
export const TouchTargets = {
  minimum: 48,
  preferred: 56,
  large: 64,
};

// Animation durations
export const Animations = {
  fast: 150,
  normal: 250,
  slow: 400,
};

// Export default for backwards compatibility
export default Colors;
