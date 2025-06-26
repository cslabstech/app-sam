import React, { ReactNode, useCallback, useState } from 'react';
import { Platform, Text, TextInput, TextInputProps, View } from 'react-native';

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

  // Following login pages styling standards
  const getLabelClasses = () => {
    const baseClasses = 'mb-2 text-sm font-medium';
    
    if (error) return `${baseClasses} text-danger-600 dark:text-danger-400`;
    if (success) return `${baseClasses} text-success-600 dark:text-success-400`;
    if (isFocused) return `${baseClasses} text-neutral-700 dark:text-neutral-200`;
    return `${baseClasses} text-neutral-700 dark:text-neutral-200`;
  };

  const getInputContainerClasses = () => {
    const baseClasses = [
      'flex-row items-center rounded-md border',
      disabled && 'opacity-60',
    ];

    // Height based on size - following login pages
    const heightClasses = (() => {
      switch (size) {
        case 'sm':
          return 'h-10';
        case 'lg':
          return 'h-12'; // Consistent with login pages
        case 'md':
        default:
          return 'h-12'; // Standard height like login pages
      }
    })();

    // Background following login pages
    const bgClasses = 'bg-neutral-50 dark:bg-neutral-900';

    // Border classes following login pages styling
    const borderClasses = (() => {
      if (disabled) return 'border-neutral-200 dark:border-neutral-700';
      if (error) return 'border-danger-500';
      if (success) return 'border-success-500';
      if (isFocused) return 'border-primary-500';
      return 'border-neutral-300 dark:border-neutral-700';
    })();

    return [
      ...baseClasses,
      heightClasses,
      bgClasses,
      borderClasses,
    ].filter(Boolean).join(' ');
  };

  const getInputClasses = () => {
    const baseClasses = [
      'flex-1 text-base',
      disabled ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-neutral-100',
    ];

    // Padding following login pages
    const paddingClasses = (() => {
      if (leftIcon && rightIcon) return 'px-3';
      if (leftIcon) return 'pl-1 pr-4';
      if (rightIcon) return 'pl-4 pr-1';
      return 'px-4';
    })();

    return [
      ...baseClasses,
      paddingClasses,
    ].filter(Boolean).join(' ');
  };

  const getErrorClasses = () => {
    return 'mt-2 text-xs text-danger-600 dark:text-danger-400';
  };

  // iOS-specific text input styling to fix baseline issue
  const getIOSTextInputStyle = () => {
    if (Platform.OS !== 'ios') return {};
    
    return {
      // Fix iOS text baseline issue by removing default padding
      paddingTop: 0,
      paddingBottom: 0,
      // Use line height for better vertical alignment
      lineHeight: size === 'lg' ? 20 : 18,
    };
  };

  // Early return for className prop (backward compatibility)
  if (className) {
    return (
      <View style={containerStyle}>
        {label && (
          <Text className={getLabelClasses()} style={{ fontFamily: 'Inter' }}>
            {label}
            {required && <Text className="text-danger-600">*</Text>}
          </Text>
        )}
        <TextInput
          className={className}
          style={[
            { fontFamily: 'Inter' },
            getIOSTextInputStyle(), // iOS specific fixes
            style,
          ]}
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
    <View style={containerStyle}>
      {label && (
        <Text className={getLabelClasses()} style={{ fontFamily: 'Inter' }}>
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
            {
              fontFamily: 'Inter', // Consistent font family like login pages
              includeFontPadding: false, // Remove extra padding on Android
              textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto', // Platform specific alignment
            },
            getIOSTextInputStyle(), // iOS specific fixes
            style,
          ]}
          placeholderTextColor={colorScheme === 'dark' ? '#a3a3a3' : '#a3a3a3'}
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
      
      {error && (
        <Text className={getErrorClasses()} style={{ fontFamily: 'Inter' }}>
          {error}
        </Text>
      )}
      
      {!error && helperText && (
        <Text className="mt-1 text-xs text-neutral-600 dark:text-neutral-400" style={{ fontFamily: 'Inter' }}>
          {helperText}
        </Text>
      )}
    </View>
  );
});

// 4. Export types for reuse
export type { InputProps, InputSize, InputVariant };
