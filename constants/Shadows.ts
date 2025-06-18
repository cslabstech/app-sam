import { Platform } from 'react-native';

/**
 * Modern Shadow System
 * Provides consistent elevation and depth across the app
 * Following Material Design elevation guidelines
 */

const createShadow = (
  elevation: number,
  color: string = '#000000',
  opacity: number = 0.15
) => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: {
        width: 0,
        height: Math.round(elevation * 0.6),
      },
      shadowOpacity: opacity,
      shadowRadius: Math.round(elevation * 0.8),
    };
  } else {
    return {
      elevation: elevation,
      shadowColor: color,
    };
  }
};

// Elevation levels following Material Design
export const shadow = {
  none: {},
  
  // Level 1: Cards resting state
  sm: createShadow(2),
  
  // Level 2: Cards raised state, Buttons
  md: createShadow(4),
  
  // Level 3: FABs, Modal dialogs
  lg: createShadow(8),
  
  // Level 4: Navigation drawer
  xl: createShadow(16),
  
  // Level 5: Modal backdrop
  '2xl': createShadow(24),
  
  // Custom shadows for specific components
  card: {
    ...createShadow(2, '#000000', 0.08),
    backgroundColor: '#FFFFFF', // Ensure card has background
  },
  
  cardHover: {
    ...createShadow(8, '#000000', 0.12),
    backgroundColor: '#FFFFFF',
  },
  
  button: {
    ...createShadow(3, '#000000', 0.1),
  },
  
  buttonPressed: {
    ...createShadow(1, '#000000', 0.1),
  },
  
  modal: {
    ...createShadow(20, '#000000', 0.25),
  },
  
  fab: {
    ...createShadow(6, '#000000', 0.15),
  },
  
  header: {
    ...createShadow(4, '#000000', 0.1),
  },
  
  // Colored shadows for brand elements
  primary: {
    ...createShadow(4, '#FF6B35', 0.2),
  },
  
  success: {
    ...createShadow(4, '#4CAF50', 0.2),
  },
  
  warning: {
    ...createShadow(4, '#FF9800', 0.2),
  },
  
  danger: {
    ...createShadow(4, '#F44336', 0.2),
  },
};

// Legacy support - map old shadow to new system
export const shadowLegacy = shadow.card;

// Utility function to create custom shadows
export const createCustomShadow = (
  elevation: number,
  color?: string,
  opacity?: number
) => createShadow(elevation, color, opacity);

// Shadow presets for common use cases
export const shadowPresets = {
  // For floating action buttons
  floating: shadow.fab,
  
  // For cards and tiles
  surface: shadow.card,
  
  // For interactive elements
  interactive: shadow.button,
  
  // For overlay content
  overlay: shadow.modal,
  
  // For navigation elements
  navigation: shadow.header,
}; 