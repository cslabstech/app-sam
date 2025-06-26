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

  // Improved styling following login pages standards
  const getButtonClasses = () => {
    const baseClasses = [
      'flex-row items-center justify-center rounded-md',
      fullWidth ? 'w-full' : '',
    ];

    // Size classes - more precise like login pages
    const sizeClasses = (() => {
      switch (size) {
        case 'xs':
          return 'h-8 px-3';
        case 'sm':
          return 'h-10 px-4';
        case 'md':
          return 'h-12 px-4';
        case 'lg':
          return 'h-12 px-6'; // Consistent with login pages
        case 'xl':
          return 'h-14 px-8';
        default:
          return 'h-12 px-4';
      }
    })();

    // Variant classes - following login pages styling
    const variantClasses = (() => {
      const isDisabled = disabled || loading;
      
      if (isDisabled) {
        return 'bg-neutral-300 dark:bg-neutral-700';
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
          return 'border-2 border-primary-500 bg-white dark:bg-neutral-950 active:bg-neutral-50 dark:active:bg-neutral-900';
        case 'ghost':
          return 'bg-transparent active:bg-neutral-100 dark:active:bg-neutral-800';
        case 'link':
          return 'bg-transparent active:bg-neutral-50 dark:active:bg-neutral-900';
        default:
          return 'bg-primary-500 active:bg-primary-600';
      }
    })();

    return [
      ...baseClasses,
      sizeClasses,
      variantClasses,
    ].filter(Boolean).join(' ');
  };

  const getTextClasses = () => {
    const isDisabled = disabled || loading;
    
    // Base text classes
    const baseClasses = 'font-semibold text-center';
    
    // Size-based text classes
    const sizeClasses = (() => {
      switch (size) {
        case 'xs':
          return 'text-sm';
        case 'sm':
          return 'text-sm';
        case 'md':
          return 'text-base';
        case 'lg':
          return 'text-base'; // Consistent with login pages
        case 'xl':
          return 'text-lg';
        default:
          return 'text-base';
      }
    })();

    // Color classes following login pages
    const colorClasses = (() => {
      if (isDisabled) {
        return 'text-neutral-500 dark:text-neutral-400';
      }

      switch (variant) {
        case 'primary':
        case 'danger':
        case 'success':
        case 'secondary':
          return 'text-white';
        case 'tertiary':
          return 'text-neutral-900 dark:text-neutral-100';
        case 'outline':
          return 'text-primary-500';
        case 'ghost':
        case 'link':
          return 'text-primary-500';
        default:
          return 'text-white';
      }
    })();

    return `${baseClasses} ${sizeClasses} ${colorClasses}`;
  };

  const buttonClasses = getButtonClasses();
  const textClasses = getTextClasses();

  return (
    <Pressable
      className={buttonClasses}
      style={[
        {
          // Following login pages styling patterns
          opacity: (disabled || loading) ? 0.6 : 1,
        },
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
          color={variant === 'outline' ? '#f97316' : 'white'}
          size="small"
        />
      ) : (
        <>
          {leftIcon && (
            <>{leftIcon}</>
          )}
          <Text
            className={textClasses}
            style={[
              { fontFamily: 'Inter' }, // Consistent font family
              leftIcon ? { marginLeft: 8 } : undefined,
              rightIcon ? { marginRight: 8 } : undefined,
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
});

// 4. Export types for reuse
export type { ButtonProps, ButtonSize, ButtonVariant };

