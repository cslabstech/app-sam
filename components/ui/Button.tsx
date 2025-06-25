import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    Text,
    TextStyle,
    Vibration,
    ViewStyle,
} from 'react-native';

import { useColorScheme } from '@/hooks/utils/useColorScheme';

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

const useButtonLogic = ({ onPress, disabled, loading, hapticFeedback = true }: {
  onPress?: () => void;
  disabled: boolean;
  loading: boolean;
  hapticFeedback?: boolean;
}) => {
  
  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    // Haptic feedback
    if (hapticFeedback && Platform.OS === 'ios') {
      Vibration.vibrate(1);
    }

    onPress?.();
  }, [disabled, loading, hapticFeedback, onPress]);

  return { handlePress };
};

export const Button = React.memo(function Button({
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
  const { handlePress } = useButtonLogic({ 
    onPress, disabled, loading, hapticFeedback 
  });

  const getBaseClasses = () => {
    const baseClasses = [
      'flex-row justify-center items-center relative overflow-hidden',
      // Full width
      fullWidth ? 'w-full' : '',
    ].filter(Boolean).join(' ');

    return baseClasses;
  };

  const getVariantClasses = () => {
    if (disabled) {
      return 'bg-neutral-200 dark:bg-neutral-700';
    }

    switch (variant) {
      case 'primary':
        return 'bg-primary-500 active:bg-primary-600';
      case 'secondary':
        return 'bg-secondary-500 active:bg-secondary-600';
      case 'tertiary':
        return 'bg-neutral-100 dark:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 border border-neutral-200 dark:border-neutral-700';
      case 'danger':
        return 'bg-danger-500 active:bg-danger-600';
      case 'success':
        return 'bg-success-500 active:bg-success-600';
      case 'outline':
        return 'bg-transparent border border-primary-500 active:bg-primary-50 dark:active:bg-primary-950';
      case 'ghost':
        return 'bg-transparent active:bg-neutral-100 dark:active:bg-neutral-800';
      case 'link':
        return 'bg-transparent active:bg-neutral-50 dark:active:bg-neutral-900';
      default:
        return 'bg-primary-500 active:bg-primary-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'h-7 px-2 rounded';
      case 'sm':
        return 'h-9 px-3 rounded';
      case 'md':
        return 'h-11 px-4 rounded-md';
      case 'lg':
        return 'h-13 px-6 rounded-md';
      case 'xl':
        return 'h-15 px-8 rounded-lg';
      default:
        return 'h-11 px-4 rounded-md';
    }
  };

  const getTextClasses = () => {
    if (disabled) {
      return 'text-neutral-400 dark:text-neutral-500';
    }

    const colorClasses = (() => {
      switch (variant) {
        case 'primary':
        case 'danger':
        case 'success':
        case 'secondary':
          return 'text-white';
        case 'tertiary':
          return 'text-neutral-900 dark:text-neutral-100';
        case 'outline':
        case 'ghost':
        case 'link':
          return 'text-primary-500';
        default:
          return 'text-white';
      }
    })();

    const sizeClasses = (() => {
      switch (size) {
        case 'xs':
          return 'text-xs';
        case 'sm':
          return 'text-sm';
        case 'md':
          return 'text-base';
        case 'lg':
          return 'text-lg';
        case 'xl':
          return 'text-xl';
        default:
          return 'text-base';
      }
    })();

    const weightClasses = (() => {
      switch (variant) {
        case 'primary':
        case 'secondary':
        case 'danger':
        case 'success':
          return 'font-semibold';
        case 'link':
          return 'font-medium';
        default:
          return 'font-medium';
      }
    })();

    return `${colorClasses} ${sizeClasses} ${weightClasses} text-center font-sans`;
  };

  const getLinkTextDecoration = () => {
    return variant === 'link' ? { textDecorationLine: 'underline' as const } : {};
  };

  const getIconSpacing = () => {
    switch (size) {
      case 'xs':
      case 'sm':
        return 2;
      case 'md':
        return 3;
      case 'lg':
      case 'xl':
        return 4;
      default:
        return 3;
    }
  };

  const buttonClasses = [
    getBaseClasses(),
    getVariantClasses(),
    getSizeClasses(),
  ].filter(Boolean).join(' ');

  const textClasses = getTextClasses();
  const iconSpacing = getIconSpacing();

  return (
    <Pressable
      className={buttonClasses}
      style={[
        disabled && { opacity: 0.6 },
        !disabled && (variant === 'primary' || variant === 'secondary' || variant === 'danger' || variant === 'success') && Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
          android: {
            elevation: 2,
          },
        }),
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
          color={variant === 'primary' || variant === 'secondary' || variant === 'danger' || variant === 'success' ? 'white' : '#FF6B35'}
          size={size === 'xs' || size === 'sm' ? 'small' : 'small'} 
        />
      ) : (
        <>
          {leftIcon && (
            <Text style={{ marginRight: iconSpacing * 4 }}>{leftIcon}</Text>
          )}
          <Text
            className={textClasses}
            style={[
              getLinkTextDecoration(),
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {rightIcon && (
            <Text style={{ marginLeft: iconSpacing * 4 }}>{rightIcon}</Text>
          )}
        </>
      )}
    </Pressable>
  );
});

// 4. Export types for reuse
export type { ButtonProps, ButtonSize, ButtonVariant };

