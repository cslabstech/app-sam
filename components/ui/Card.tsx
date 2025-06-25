import React, { useCallback } from 'react';
import { Pressable, View, ViewProps, ViewStyle } from 'react-native';

import { useColorScheme } from '@/hooks/utils/useColorScheme';

// 1. Types first
type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';
type CardSize = 'sm' | 'md' | 'lg';

interface CardProps extends ViewProps {
  children?: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  noPadding?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

// 2. Custom hook for component logic
const useCardLogic = ({ onPress, disabled }: {
  onPress?: () => void;
  disabled: boolean;
}) => {
  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
  }, [disabled, onPress]);

  return { handlePress };
};

// 3. Main component
export const Card = React.memo(function Card({ 
  children, 
  variant = 'default',
  size = 'md',
  style, 
  noPadding = false,
  onPress,
  disabled = false,
  testID,
  ...props 
}: CardProps) {
  const colorScheme = useColorScheme();
  const { handlePress } = useCardLogic({ onPress, disabled });

  // ✅ PRIMARY - NativeWind classes
  const getBaseClasses = () => {
    const baseClasses = [
      'overflow-hidden',
      // Margin
      'my-3',
    ].filter(Boolean).join(' ');

    return baseClasses;
  };

  const getVariantClasses = () => {
    const baseVariantClasses = (() => {
      switch (variant) {
        case 'filled':
          return 'bg-neutral-100 dark:bg-neutral-800';
        case 'outlined':
          return 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700';
        case 'elevated':
          return 'bg-white dark:bg-neutral-900';
        case 'default':
        default:
          return 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800';
      }
    })();

    return baseVariantClasses;
  };

  const getSizeClasses = () => {
    if (noPadding) return '';
    
    switch (size) {
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-6';
      case 'md':
      default:
        return 'p-4';
    }
  };

  const getBorderRadiusClasses = () => {
    switch (size) {
      case 'sm':
        return 'rounded';
      case 'lg':
        return 'rounded-xl';
      case 'md':
      default:
        return 'rounded-lg';
    }
  };

  const cardClasses = [
    getBaseClasses(),
    getVariantClasses(),
    getSizeClasses(),
    getBorderRadiusClasses(),
    disabled && 'opacity-60',
  ].filter(Boolean).join(' ');

  // ⚠️ SECONDARY - Complex dynamic styling for shadows
  const getShadowStyle = () => {
    if (disabled) return {};
    
    switch (variant) {
      case 'elevated':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'default':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        };
      case 'outlined':
      case 'filled':
        return {};
      default:
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        };
    }
  };

  // If onPress is provided, make it interactive
  if (onPress && !disabled) {
    return (
      <Pressable
        className={cardClasses}
        style={[
          getShadowStyle(),
          style,
        ]}
        onPress={handlePress}
        testID={testID}
        accessibilityRole="button"
        disabled={disabled}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  // Static card
  return (
    <View
      className={cardClasses}
      style={[
        getShadowStyle(),
        style,
      ]}
      testID={testID}
      {...props}
    >
      {children}
    </View>
  );
});

// Additional Card components for common patterns
export const CardHeader = React.memo(function CardHeader({ children, style, ...props }: ViewProps) {
  return (
    <View 
      className="pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3" 
      style={style} 
      {...props}
    >
      {children}
    </View>
  );
});

export const CardContent = React.memo(function CardContent({ children, style, ...props }: ViewProps) {
  return (
    <View 
      className="flex-1" 
      style={style} 
      {...props}
    >
      {children}
    </View>
  );
});

export const CardFooter = React.memo(function CardFooter({ children, style, ...props }: ViewProps) {
  return (
    <View 
      className="pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-3" 
      style={style} 
      {...props}
    >
      {children}
    </View>
  );
});

// 4. Export types for reuse
export type { CardProps, CardSize, CardVariant };
