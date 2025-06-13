import React, { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: import('react-native').TextStyle;
  containerStyle?: import('react-native').ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  containerStyle,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          { 
            backgroundColor: colors.card,
            borderColor: error ? colors.danger : colors.border,
            borderWidth: 1,
          },
          error && styles.errorInput,
        ]}
      >
        {leftIcon && (
          <View style={styles.iconContainer}>{leftIcon}</View>
        )}
        
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
        
        {rightIcon && (
          <View style={styles.iconContainer}>{rightIcon}</View>
        )}
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  label: {
    fontSize: typography.fontSizeSm,
    fontWeight: '500',
    fontFamily: typography.fontFamily,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    height: 44,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
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
    paddingHorizontal: spacing.md,
  },
  errorInput: {
    borderWidth: 1,
  },
  errorText: {
    fontSize: typography.fontSizeXs,
    marginTop: 4,
    fontFamily: typography.fontFamily,
  },
});