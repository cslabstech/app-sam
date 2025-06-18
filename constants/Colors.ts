/**
 * Modern Color System for SAM App
 * Following design system best practices with semantic color naming
 */

// Primary brand colors
const brand = {
  primary: '#FF6B35', // Modern orange - lebih vibrant
  primaryLight: '#FF8A65',
  primaryDark: '#E65100',
  secondary: '#2196F3', // Blue accent
  secondaryLight: '#64B5F6',
  secondaryDark: '#1976D2',
};

// Semantic colors
const semantic = {
  success: '#4CAF50',
  successLight: '#81C784',
  successDark: '#388E3C',
  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningDark: '#F57C00',
  error: '#F44336',
  errorLight: '#E57373',
  errorDark: '#D32F2F',
  info: '#2196F3',
  infoLight: '#64B5F6',
  infoDark: '#1976D2',
};

// Neutral colors
const neutral = {
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  black: '#000000',
};

// Surface colors for better hierarchy
const surface = {
  background: '#FAFBFC',
  backgroundAlt: '#F5F6FA',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  input: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const Colors = {
  light: {
    // Text colors
    text: neutral.gray900,
    textSecondary: neutral.gray600,
    textTertiary: neutral.gray500,
    textInverse: neutral.white,
    textDisabled: neutral.gray400,
    
    // Background colors
    background: surface.background,
    backgroundAlt: surface.backgroundAlt,
    surface: surface.card,
    surfaceElevated: surface.cardElevated,
    
    // Brand colors
    primary: brand.primary,
    primaryLight: brand.primaryLight,
    primaryDark: brand.primaryDark,
    secondary: brand.secondary,
    
    // Semantic colors
    success: semantic.success,
    successLight: semantic.successLight,
    warning: semantic.warning,
    warningLight: semantic.warningLight,
    danger: semantic.error,
    dangerLight: semantic.errorLight,
    errorLight: semantic.errorLight,
    info: semantic.info,
    infoLight: semantic.infoLight,
    
    // UI colors
    border: neutral.gray200,
    borderLight: neutral.gray100,
    borderFocus: brand.primary,
    divider: neutral.gray200,
    
    // Component specific
    card: surface.card,
    input: surface.input,
    inputBorder: neutral.gray300,
    inputFocus: brand.primary,
    overlay: surface.overlay,
    
    // Legacy support
    tint: brand.primary,
    icon: neutral.gray600,
    tabIconDefault: neutral.gray500,
    tabIconSelected: brand.primary,
    white: neutral.white,
  },
  dark: {
    // Text colors
    text: '#FFFFFF',
    textSecondary: neutral.gray300,
    textTertiary: neutral.gray400,
    textInverse: neutral.gray900,
    textDisabled: neutral.gray600,
    
    // Background colors
    background: '#121212',
    backgroundAlt: '#1E1E1E',
    surface: '#1E1E1E',
    surfaceElevated: '#2D2D2D',
    
    // Brand colors
    primary: brand.primary,
    primaryLight: brand.primaryLight,
    primaryDark: brand.primaryDark,
    secondary: brand.secondary,
    
    // Semantic colors
    success: semantic.success,
    successLight: semantic.successLight,
    warning: semantic.warning,
    warningLight: semantic.warningLight,
    danger: semantic.error,
    dangerLight: semantic.errorLight,
    info: semantic.info,
    infoLight: semantic.infoLight,
    
    // UI colors
    border: neutral.gray700,
    borderLight: neutral.gray800,
    borderFocus: brand.primary,
    divider: neutral.gray700,
    
    // Component specific
    card: '#1E1E1E',
    input: '#2D2D2D',
    inputBorder: neutral.gray600,
    inputFocus: brand.primary,
    overlay: surface.overlay,
    
    // Legacy support
    tint: brand.primary,
    icon: neutral.gray400,
    tabIconDefault: neutral.gray500,
    tabIconSelected: brand.primary,
    white: neutral.white,
  },
};

// Export color utilities
export const colorUtils = {
  // Create transparent versions
  alpha: (color: string, opacity: number) => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  },
  
  // Gradient definitions
  gradients: {
    primary: ['#FF6B35', '#FF8A65'],
    success: ['#4CAF50', '#81C784'],
    info: ['#2196F3', '#64B5F6'],
    warning: ['#FF9800', '#FFB74D'],
  },
};
