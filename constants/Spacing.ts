/**
 * Enhanced Spacing System
 * Following 8pt grid system with semantic naming
 * Provides consistent spacing across all components
 */

// Base unit: 4px (following 8pt grid system)
const BASE_UNIT = 4;

// Core spacing scale
export const spacing = {
  // Base measurements
  px: 1,
  0: 0,
  0.5: BASE_UNIT * 0.5, // 2px
  1: BASE_UNIT * 1,     // 4px
  1.5: BASE_UNIT * 1.5, // 6px
  2: BASE_UNIT * 2,     // 8px
  2.5: BASE_UNIT * 2.5, // 10px
  3: BASE_UNIT * 3,     // 12px
  3.5: BASE_UNIT * 3.5, // 14px
  4: BASE_UNIT * 4,     // 16px
  5: BASE_UNIT * 5,     // 20px
  6: BASE_UNIT * 6,     // 24px
  7: BASE_UNIT * 7,     // 28px
  8: BASE_UNIT * 8,     // 32px
  9: BASE_UNIT * 9,     // 36px
  10: BASE_UNIT * 10,   // 40px
  11: BASE_UNIT * 11,   // 44px
  12: BASE_UNIT * 12,   // 48px
  14: BASE_UNIT * 14,   // 56px
  16: BASE_UNIT * 16,   // 64px
  20: BASE_UNIT * 20,   // 80px
  24: BASE_UNIT * 24,   // 96px
  28: BASE_UNIT * 28,   // 112px
  32: BASE_UNIT * 32,   // 128px
  36: BASE_UNIT * 36,   // 144px
  40: BASE_UNIT * 40,   // 160px
  44: BASE_UNIT * 44,   // 176px
  48: BASE_UNIT * 48,   // 192px
  52: BASE_UNIT * 52,   // 208px
  56: BASE_UNIT * 56,   // 224px
  60: BASE_UNIT * 60,   // 240px
  64: BASE_UNIT * 64,   // 256px
  72: BASE_UNIT * 72,   // 288px
  80: BASE_UNIT * 80,   // 320px
  96: BASE_UNIT * 96,   // 384px
  
  // Semantic spacing (T-shirt sizes)
  xs: BASE_UNIT * 1,    // 4px
  sm: BASE_UNIT * 2,    // 8px
  md: BASE_UNIT * 3,    // 12px
  lg: BASE_UNIT * 4,    // 16px
  xl: BASE_UNIT * 6,    // 24px
  '2xl': BASE_UNIT * 8, // 32px
  '3xl': BASE_UNIT * 12, // 48px
  '4xl': BASE_UNIT * 16, // 64px
  '5xl': BASE_UNIT * 20, // 80px
};

// Component-specific spacing tokens
export const componentSpacing = {
  // Button spacing
  button: {
    paddingHorizontal: spacing.lg,      // 16px
    paddingVertical: spacing.md,        // 12px
    paddingHorizontalSm: spacing.md,    // 12px
    paddingVerticalSm: spacing.sm,      // 8px
    paddingHorizontalLg: spacing.xl,    // 24px
    paddingVerticalLg: spacing.lg,      // 16px
    gap: spacing.sm,                    // 8px - between icon and text
  },
  
  // Card spacing
  card: {
    padding: spacing.lg,                // 16px
    paddingLarge: spacing.xl,           // 24px
    paddingSmall: spacing.md,           // 12px
    margin: spacing.sm,                 // 8px
    marginLarge: spacing.lg,            // 16px
    borderRadius: spacing.sm,           // 8px
    borderRadiusLarge: spacing.md,      // 12px
  },
  
  // Input spacing
  input: {
    padding: spacing.md,                // 12px
    paddingVertical: spacing.lg,        // 16px
    paddingHorizontal: spacing.lg,      // 16px
    marginVertical: spacing.sm,         // 8px
    iconPadding: spacing.md,            // 12px
    borderRadius: spacing.sm,           // 8px
  },
  
  // List spacing
  list: {
    itemPadding: spacing.lg,            // 16px
    itemPaddingVertical: spacing.md,    // 12px
    itemMargin: spacing.sm,             // 8px
    sectionSpacing: spacing.xl,         // 24px
    sectionSpacingLarge: spacing['2xl'], // 32px
    dividerSpacing: spacing.sm,         // 8px
  },
  
  // Screen layout spacing
  screen: {
    padding: spacing.lg,                // 16px
    paddingLarge: spacing.xl,           // 24px
    paddingHorizontal: spacing.lg,      // 16px
    paddingVertical: spacing.lg,        // 16px
    headerHeight: 56,                   // Standard header height
    tabBarHeight: 60,                   // Standard tab bar height
  },
  
  // Section spacing
  section: {
    marginVertical: spacing.xl,         // 24px
    marginVerticalLarge: spacing['2xl'], // 32px
    marginVerticalSmall: spacing.lg,    // 16px
    titleMarginBottom: spacing.md,      // 12px
    subtitleMarginBottom: spacing.sm,   // 8px
  },
  
  // Modal and overlay spacing
  modal: {
    padding: spacing.xl,                // 24px
    margin: spacing.lg,                 // 16px
    borderRadius: spacing.lg,           // 16px
    backdropOpacity: 0.5,
  },
  
  // Form spacing
  form: {
    fieldSpacing: spacing.lg,           // 16px
    sectionSpacing: spacing.xl,         // 24px
    submitButtonMargin: spacing.xl,     // 24px
    errorMargin: spacing.xs,            // 4px
  },
};

// Breakpoint-aware spacing
export const responsiveSpacing = {
  // Container max widths
  maxWidth: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Responsive padding
  container: {
    paddingXs: spacing.sm,    // 8px - mobile small
    paddingSm: spacing.lg,    // 16px - mobile
    paddingMd: spacing.xl,    // 24px - tablet
    paddingLg: spacing['2xl'], // 32px - desktop
  },
};

// Border radius tokens
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
  
  // Component specific
  button: 6,
  card: 8,
  input: 6,
  modal: 16,
  avatar: 9999,
  image: 8,
};

// Legacy support - maintain backward compatibility
export const spacingLegacy = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  xxl: spacing['2xl'],
  component: componentSpacing,
  container: responsiveSpacing.container,
}; 