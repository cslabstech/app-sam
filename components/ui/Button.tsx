import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  Vibration,
  ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { shadow } from '@/constants/Shadows';
import { borderRadius, componentSpacing, spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
  hapticFeedback = true,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) {
      return colors.border;
    }

    const baseColor = (() => {
      switch (variant) {
        case 'primary':
          return colors.primary;
        case 'secondary':
          return colors.secondary;
        case 'tertiary':
          return colors.surface;
        case 'danger':
          return colors.danger;
        case 'success':
          return colors.success;
        case 'outline':
        case 'ghost':
        case 'link':
          return 'transparent';
        default:
          return colors.primary;
      }
    })();

    if (pressed && baseColor !== 'transparent') {
      // Darken the color when pressed
      return baseColor + 'CC'; // Add some transparency for pressed state
    }

    return baseColor;
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.textDisabled;
    }

    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return colors.textInverse;
      case 'secondary':
        return colors.textInverse;
      case 'tertiary':
        return colors.text;
      case 'outline':
      case 'ghost':
        return colors.primary;
      case 'link':
        return colors.primary;
      default:
        return colors.textInverse;
    }
  };

  const getBorderColor = () => {
    if (disabled) {
      return colors.border;
    }

    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'tertiary':
        return colors.border;
      default:
        return 'transparent';
    }
  };

  const getBorderWidth = () => {
    switch (variant) {
      case 'outline':
      case 'tertiary':
        return 1;
      default:
        return 0;
    }
  };

  const getShadow = () => {
    if (disabled || variant === 'ghost' || variant === 'link') {
      return {};
    }
    
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
      case 'success':
        return shadow.button;
      default:
        return {};
    }
  };

  const getButtonDimensions = () => {
    switch (size) {
      case 'xs':
        return {
          height: 28,
          paddingHorizontal: spacing.sm,
          borderRadius: borderRadius.sm,
        };
      case 'sm':
        return {
          height: 36,
          paddingHorizontal: spacing.md,
          borderRadius: borderRadius.sm,
        };
      case 'md':
        return {
          height: 44,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.md,
        };
      case 'lg':
        return {
          height: 52,
          paddingHorizontal: spacing.xl,
          borderRadius: borderRadius.md,
        };
      case 'xl':
        return {
          height: 60,
          paddingHorizontal: spacing['2xl'],
          borderRadius: borderRadius.lg,
        };
      default:
        return {
          height: 44,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.md,
        };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'xs':
        return typography.fontSize.xs;
      case 'sm':
        return typography.fontSize.sm;
      case 'md':
        return typography.fontSize.base;
      case 'lg':
        return typography.fontSize.md;
      case 'xl':
        return typography.fontSize.lg;
      default:
        return typography.fontSize.base;
    }
  };

  const getFontWeight = (): TextStyle['fontWeight'] => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
      case 'success':
        return '600' as const;
      case 'link':
        return '500' as const;
      default:
        return '500' as const;
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;

    // Haptic feedback
    if (hapticFeedback && Platform.OS === 'ios') {
      Vibration.vibrate(1);
    }

    onPress?.();
  };

  const dimensions = getButtonDimensions();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: getBorderWidth(),
          height: dimensions.height,
          paddingHorizontal: dimensions.paddingHorizontal,
          borderRadius: dimensions.borderRadius,
          width: fullWidth ? '100%' : undefined,
          opacity: disabled ? 0.6 : pressed ? 0.9 : 1,
        },
        getShadow(),
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator 
          color={getTextColor()} 
          size={size === 'xs' || size === 'sm' ? 'small' : 'small'} 
        />
      ) : (
        <>
          {leftIcon && (
            <>{leftIcon}</>
          )}
          <Text
            style={[
              styles.buttonText,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                fontWeight: getFontWeight(),
                marginLeft: leftIcon ? componentSpacing.button.gap : 0,
                marginRight: rightIcon ? componentSpacing.button.gap : 0,
              },
              variant === 'link' && styles.linkText,
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {rightIcon && (
            <>{rightIcon}</>
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  buttonText: {
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});