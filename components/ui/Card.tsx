import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { shadow } from '@/styles/shadow';
import { spacing } from '@/styles/spacing';

interface CardProps extends ViewProps {
  noPadding?: boolean;
  style?: ViewStyle;
}

export function Card({ children, style, noPadding = false, ...props }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.card,
        { 
          backgroundColor: colors.card, 
          borderColor: colors.border,
          borderWidth: 1,
          padding: noPadding ? 0 : 16,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    marginVertical: spacing.md,
    ...shadow,
  },
});