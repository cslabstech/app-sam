// Enhanced typography system with complete scale and semantic naming
export const typography = {
  // Font Family
  fontFamily: 'Inter',
  
  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
  
  // Font Sizes (follows 8pt grid system)
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 42,
  },
  
  // Line Heights (relative to font size)
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
  
  // Semantic Typography Styles
  heading: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 38.4, // 1.2
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 33.6, // 1.2
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 28.8, // 1.2
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 24, // 1.2
    },
    h5: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 21.6, // 1.2
    },
    h6: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 19.2, // 1.2
    },
  },
  
  // Body Text
  body: {
    large: {
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 28.8, // 1.6
    },
    base: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 25.6, // 1.6
    },
    small: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 22.4, // 1.6
    },
    xs: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 19.2, // 1.6
    },
  },
  
  // Labels and UI Text
  label: {
    large: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 19.2, // 1.2
    },
    base: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 16.8, // 1.2
    },
    small: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 14.4, // 1.2
    },
  },
  
  // Legacy support for existing code
  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  fontSizeXs: 12,
  fontSizeSm: 14,
  fontSizeMd: 16,
  fontSizeLg: 18,
  fontSizeXl: 20,
  fontSize2xl: 24,
}; 