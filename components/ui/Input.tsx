import React, { ReactNode, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { borderRadius, componentSpacing, spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';

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
}

export function Input({
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
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isFocused, setIsFocused] = useState(false);

  const getBackgroundColor = () => {
    if (disabled) {
      return colors.backgroundAlt;
    }

    switch (variant) {
      case 'filled':
        return colors.backgroundAlt;
      case 'outlined':
      case 'default':
        return colors.input;
      default:
        return colors.input;
    }
  };

  const getBorderColor = () => {
    if (disabled) {
      return colors.border;
    }

    if (error) {
      return colors.danger;
    }

    if (success) {
      return colors.success;
    }

    if (isFocused) {
      return colors.inputFocus;
    }

    switch (variant) {
      case 'outlined':
        return colors.inputBorder;
      case 'filled':
        return 'transparent';
      default:
        return colors.inputBorder;
    }
  };

  const getBorderWidth = () => {
    switch (variant) {
      case 'outlined':
        return isFocused ? 2 : 1;
      case 'filled':
        return 0;
      default:
        return 1;
    }
  };

  const getInputHeight = () => {
    switch (size) {
      case 'sm':
        return 36;
      case 'lg':
        return 52;
      default:
        return 44;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return typography.fontSize.sm;
      case 'lg':
        return typography.fontSize.md;
      default:
        return typography.fontSize.base;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return componentSpacing.input.padding;
      case 'lg':
        return componentSpacing.input.paddingHorizontal;
      default:
        return componentSpacing.input.paddingHorizontal;
    }
  };

  const getBorderRadius = () => {
    switch (variant) {
      case 'filled':
        return borderRadius.lg;
      default:
        return borderRadius.input;
    }
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const labelColor = error 
    ? colors.danger 
    : success 
      ? colors.success 
      : isFocused 
        ? colors.primary 
        : colors.text;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: labelColor }]}>
            {label}
            {required && <Text style={[styles.required, { color: colors.danger }]}> *</Text>}
          </Text>
        </View>
      )}
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: getBorderWidth(),
            height: getInputHeight(),
            borderRadius: getBorderRadius(),
          },
          disabled && styles.disabledInput,
        ]}
      >
        {leftIcon && (
          <View style={[styles.iconContainer, styles.leftIcon]}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            { 
              color: disabled ? colors.textDisabled : colors.text,
              fontSize: getFontSize(),
              paddingHorizontal: getPadding(),
            },
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && (
          <View style={[styles.iconContainer, styles.rightIcon]}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {(error || helperText) && (
        <View style={styles.messageContainer}>
          <Text 
            style={[
              styles.messageText, 
              { 
                color: error ? colors.danger : success ? colors.success : colors.textSecondary 
              }
            ]}
          >
            {error || helperText}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: componentSpacing.input.marginVertical,
  },
  labelContainer: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    fontFamily: typography.fontFamily,
  },
  required: {
    fontSize: typography.fontSize.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: typography.fontFamily,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  iconContainer: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: componentSpacing.input.iconPadding,
  },
  leftIcon: {
    paddingLeft: componentSpacing.input.iconPadding,
  },
  rightIcon: {
    paddingRight: componentSpacing.input.iconPadding,
  },
  disabledInput: {
    opacity: 0.6,
  },
  messageContainer: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  messageText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily,
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
  },
});