import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useMemo } from 'react';

/**
 * Hook untuk mendapatkan styles yang theme-aware
 * Menggantikan hardcoded colors dan Tailwind classes
 */
export function useThemeStyles() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = useMemo(() => ({
    // Text styles
    text: {
      primary: { color: colors.text },
      secondary: { color: colors.textSecondary },
      tertiary: { color: colors.textTertiary },
      inverse: { color: colors.textInverse },
      disabled: { color: colors.textDisabled },
      error: { color: colors.danger },
      success: { color: colors.success },
      warning: { color: colors.warning },
    },
    
    // Background styles
    background: {
      primary: { backgroundColor: colors.background },
      secondary: { backgroundColor: colors.backgroundAlt },
      surface: { backgroundColor: colors.surface },
      surfaceElevated: { backgroundColor: colors.surfaceElevated },
      card: { backgroundColor: colors.card },
      input: { backgroundColor: colors.input },
    },
    
    // Border styles
    border: {
      default: { borderColor: colors.border },
      light: { borderColor: colors.borderLight },
      focus: { borderColor: colors.borderFocus },
      error: { borderColor: colors.danger },
      success: { borderColor: colors.success },
    },
    
    // Button styles
    button: {
      primary: {
        backgroundColor: colors.primary,
        color: colors.textInverse,
      },
      secondary: {
        backgroundColor: colors.surface,
        color: colors.text,
        borderColor: colors.border,
        borderWidth: 1,
      },
      success: {
        backgroundColor: colors.success,
        color: colors.textInverse,
      },
      danger: {
        backgroundColor: colors.danger,
        color: colors.textInverse,
      },
      disabled: {
        backgroundColor: colors.textDisabled,
        color: colors.textInverse,
      },
    },
    
    // Form styles
    form: {
      input: {
        backgroundColor: colors.input,
        borderColor: colors.inputBorder,
        color: colors.text,
      },
      inputFocus: {
        backgroundColor: colors.input,
        borderColor: colors.inputFocus,
        color: colors.text,
      },
      inputError: {
        backgroundColor: colors.input,
        borderColor: colors.danger,
        color: colors.text,
      },
      label: {
        color: colors.text,
        fontWeight: '600' as const,
      },
      errorText: {
        color: colors.danger,
        fontSize: 12,
      },
    },
    
    // Header styles
    header: {
      primary: {
        backgroundColor: colors.primary,
        color: colors.textInverse,
      },
      surface: {
        backgroundColor: colors.surface,
        color: colors.text,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      },
    },
    
    // Card styles
    card: {
      default: {
        backgroundColor: colors.card,
        borderColor: colors.border,
      },
      elevated: {
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        shadowColor: colorScheme === 'dark' ? '#000' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    },
  }), [colors, colorScheme]);

  return { colors, styles, colorScheme };
} 