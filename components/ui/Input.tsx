import React, { ReactNode, useCallback, useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

import { useColorScheme } from '@/hooks/utils/useColorScheme';

// 1. Types first
type InputVariant = 'default' | 'filled' | 'outlined';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  variant?: InputVariant;
  size?: InputSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  style?: import('react-native').TextStyle;
  containerStyle?: import('react-native').ViewStyle;
  className?: string;
}

// 2. Custom hook for component logic
const useInputLogic = ({ onFocus, onBlur }: {
  onFocus?: TextInputProps['onFocus'];
  onBlur?: TextInputProps['onBlur'];
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  return {
    isFocused,
    handleFocus,
    handleBlur,
  };
};

// 3. Main component
export const Input = React.memo(function Input({
  label,
  helperText,
  error,
  success = false,
  variant = 'outlined',
  size = 'md',
  leftIcon,
  rightIcon,
  disabled = false,
  required = false,
  style,
  containerStyle,
  className,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const { isFocused, handleFocus, handleBlur } = useInputLogic({ onFocus, onBlur });

  // ✅ PRIMARY - NativeWind classes
  const getLabelClasses = () => {
    const baseClasses = 'mb-2 text-sm font-medium font-sans';
    
    if (error) return `${baseClasses} text-danger-600 dark:text-danger-400`;
    if (success) return `${baseClasses} text-success-600 dark:text-success-400`;
    if (isFocused) return `${baseClasses} text-primary-600 dark:text-primary-400`;
    return `${baseClasses} text-neutral-700 dark:text-neutral-200`;
  };

  const getContainerClasses = () => {
    return 'my-3';
  };

  const getInputContainerClasses = () => {
    const baseClasses = [
      'flex-row items-center overflow-hidden',
      disabled && 'opacity-60',
    ];

    // Background
    const bgClasses = (() => {
      if (disabled) return 'bg-neutral-100 dark:bg-neutral-800';
      
      switch (variant) {
        case 'filled':
          return 'bg-neutral-100 dark:bg-neutral-800';
        case 'outlined':
        case 'default':
        default:
          return 'bg-white dark:bg-neutral-900';
      }
    })();

    // Border
    const borderClasses = (() => {
      if (disabled) return 'border border-neutral-200 dark:border-neutral-700';
      if (error) return isFocused ? 'border-2 border-danger-500' : 'border border-danger-500';
      if (success) return isFocused ? 'border-2 border-success-500' : 'border border-success-500';
      if (isFocused) return 'border-2 border-primary-500';
      
      switch (variant) {
        case 'outlined':
          return 'border border-neutral-300 dark:border-neutral-600';
        case 'filled':
          return 'border-0';
        default:
          return 'border border-neutral-300 dark:border-neutral-600';
      }
    })();

    // Size & Border Radius
    const sizeClasses = (() => {
      switch (size) {
        case 'sm':
          return 'h-9';
        case 'lg':
          return 'h-13';
        case 'md':
        default:
          return 'h-11';
      }
    })();

    const radiusClasses = (() => {
      switch (variant) {
        case 'filled':
          return 'rounded-lg';
        default:
          return 'rounded-md';
      }
    })();

    return [
      ...baseClasses,
      bgClasses,
      borderClasses,
      sizeClasses,
      radiusClasses,
    ].filter(Boolean).join(' ');
  };

  const getInputClasses = () => {
    const baseClasses = [
      'flex-1 h-full font-sans',
      disabled ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-white',
    ];

    const sizeClasses = (() => {
      switch (size) {
        case 'sm':
          return 'text-sm px-3';
        case 'lg':
          return 'text-lg px-4';
        case 'md':
        default:
          return 'text-base px-3';
      }
    })();

    const spacingClasses = [
      leftIcon && 'pl-1',
      rightIcon && 'pr-1',
    ].filter(Boolean);

    return [
      ...baseClasses,
      sizeClasses,
      ...spacingClasses,
    ].filter(Boolean).join(' ');
  };

  const getMessageClasses = () => {
    const baseClasses = 'mt-1 px-1 text-xs font-sans';
    
    if (error) return `${baseClasses} text-danger-600 dark:text-danger-400`;
    if (success) return `${baseClasses} text-success-600 dark:text-success-400`;
    return `${baseClasses} text-neutral-600 dark:text-neutral-400`;
  };

  // Early return for className prop (backward compatibility)
  if (className) {
    return (
      <View style={containerStyle}>
        {label && (
          <Text className={getLabelClasses()}>
            {label}
            {required && <Text className="text-danger-600">*</Text>}
          </Text>
        )}
        <TextInput
          className={className}
          style={style}
          placeholderTextColor={colorScheme === 'dark' ? '#a3a3a3' : '#94a3b8'}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </View>
    );
  }

  return (
    <View className={getContainerClasses()} style={containerStyle}>
      {label && (
        <Text className={getLabelClasses()}>
          {label}
          {required && <Text className="text-danger-600"> *</Text>}
        </Text>
      )}
      
      <View className={getInputContainerClasses()}>
        {leftIcon && (
          <View className="h-full justify-center px-3">
            {leftIcon}
          </View>
        )}
        
        <TextInput
          className={getInputClasses()}
          style={[
            // ⚠️ SECONDARY - Complex dynamic styling for text input specifics
            {
              includeFontPadding: false,
              textAlignVertical: 'center',
            },
            style,
          ]}
          placeholderTextColor={colorScheme === 'dark' ? '#a3a3a3' : '#94a3b8'}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && (
          <View className="h-full justify-center px-3">
            {rightIcon}
          </View>
        )}
      </View>
      
      {(error || helperText) && (
        <Text className={getMessageClasses()}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

// 4. Export types for reuse
export type { InputProps, InputSize, InputVariant };
