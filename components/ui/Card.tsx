import React from 'react';
import { Pressable, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { Colors } from '@/constants/Colors';
import { shadow, shadowPresets } from '@/constants/Shadows';
import { borderRadius, componentSpacing, spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/hooks/useColorScheme';

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

export function Card({ 
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
  const colors = Colors[colorScheme ?? 'light'];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'filled':
        return colors.backgroundAlt;
      case 'elevated':
      case 'default':
      case 'outlined':
      default:
        return colors.card;
    }
  };

  const getBorderStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'elevated':
        return {
          borderWidth: 0,
        };
      default:
        return {
          borderWidth: 1,
          borderColor: colors.borderLight,
        };
    }
  };

  const getShadowStyle = () => {
    if (disabled) return {};
    
    switch (variant) {
      case 'elevated':
        return shadowPresets.surface;
      case 'default':
        return shadow.sm;
      case 'outlined':
      case 'filled':
        return {};
      default:
        return shadow.sm;
    }
  };

  const getPadding = () => {
    if (noPadding) return 0;
    
    switch (size) {
      case 'sm':
        return componentSpacing.card.paddingSmall;
      case 'lg':
        return componentSpacing.card.paddingLarge;
      default:
        return componentSpacing.card.padding;
    }
  };

  const getBorderRadius = () => {
    switch (size) {
      case 'sm':
        return borderRadius.sm;
      case 'lg':
        return componentSpacing.card.borderRadiusLarge;
      default:
        return borderRadius.card;
    }
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      padding: getPadding(),
      borderRadius: getBorderRadius(),
      opacity: disabled ? 0.6 : 1,
    },
    getBorderStyle(),
    getShadowStyle(),
    style,
  ];

  // If onPress is provided, make it interactive
  if (onPress && !disabled) {
    return (
      <Pressable
        style={({ pressed }) => [
          ...cardStyle,
          {
            transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        onPress={onPress}
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
      style={cardStyle}
      testID={testID}
      {...props}
    >
      {children}
    </View>
  );
}

// Additional Card components for common patterns
export function CardHeader({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.cardHeader, style]} {...props}>
      {children}
    </View>
  );
}

export function CardContent({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.cardContent, style]} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.cardFooter, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: componentSpacing.card.margin,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardFooter: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: spacing.md,
  },
});