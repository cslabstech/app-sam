import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { shadow } from '@/styles/shadow';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  onPress,
  disabled,
  style,
  textStyle,
  leftIcon,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getBackgroundColor = () => {
    if (disabled) {
      return colors.border + '80';
    }

    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.card;
      case 'danger':
        return colors.danger;
      case 'outline':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.textSecondary;
    }

    switch (variant) {
      case 'primary':
        return colors.white;
      case 'secondary':
        return colors.text;
      case 'danger':
        return colors.white;
      case 'outline':
        return colors.primary;
      default:
        return colors.white;
    }
  };

  const getBorderColor = () => {
    if (disabled) {
      return colors.border;
    }

    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.border;
      case 'danger':
        return colors.danger;
      case 'outline':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const getButtonHeight = () => {
    switch (size) {
      case 'small':
        return 36;
      case 'large':
        return 56;
      default:
        return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: 1,
          height: getButtonHeight(),
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {leftIcon ? <>{leftIcon}</> : null}
          <Text
            style={[
              styles.buttonText,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                marginLeft: leftIcon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 6,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...shadow,
  },
  buttonText: {
    fontWeight: '700', // Use numeric value for RN compatibility
    fontFamily: typography.fontFamily,
  },
});